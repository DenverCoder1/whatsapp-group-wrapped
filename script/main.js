/**
 * Set config values in config.js
 * Run script with: `node main.js <file> [startDate] [endDate] [topCount]`
 */

let { FILTERS, TAG_TO_NAME, TOP_COUNT } = require("./config.js");
const { extractFirstFileByExtension, extractFilesByExtension } = require("./zip-extractor.js");
const {
    detectChatFormat,
    getTopEntries,
    loadChatFile,
    extractGroupName,
    parseChatMessages,
    createBanner,
    enrichMessages,
    calculateWordStats,
    calculateTaggees,
    calculateDailyAverage,
    countUniqueSenders,
    calculateMessagesPerHour,
    calculateMessagesPerDayOfWeek,
    calculateMessagesPerMonth,
    getDayName,
    getMonthName,
    analyzeVcfFiles,
    generateCsv,
} = require("./util.js");
const fs = require("node:fs");
const path = require("node:path");

// check if a parameter is passed to the script
if (process.argv.length < 3) {
    console.error("Please provide a file to analyze");
    process.exit(1);
}

// read the chat file
const IMPORT_FILE = process.argv[2];

// Optional arguments to override config: startDate, endDate, topCount
if (process.argv[3]) {
    const startDate = process.argv[3];
    const endDate = process.argv[4] || FILTERS.endDate.toISOString().split('T')[0];
    const topCount = process.argv[5] ? Number.parseInt(process.argv[5], 10) : TOP_COUNT;
    
    FILTERS = {
        startDate: new Date(startDate + 'T00:00:00'),
        endDate: new Date(endDate + 'T23:59:59'),
    };
    TOP_COUNT = topCount;
}

// create an output directory to store the results
const outputDir = path.join(__dirname, "..", "output");
fs.mkdirSync(outputDir, { recursive: true });

// Load chat file
let chat, chatFileName, groupName;
try {
    const loaded = loadChatFile(IMPORT_FILE, extractFirstFileByExtension);
    chat = loaded.chat;
    chatFileName = loaded.fileName;
    groupName = extractGroupName(chatFileName);
} catch (error) {
    console.error(error.message);
    process.exit(1);
}

const commonWords = new Set(
    fs
        .readFileSync(path.join(__dirname, "common-words.txt"), "utf8")
        .split("\n")
        .map((w) => w.toLowerCase())
);

// create an output file stream to write the results
const output = fs.createWriteStream(`${outputDir}/results.txt`, { flags: "w" });

/**
 * Take 1 or more args and print them to output and log them to console
 * @param  {...any} args - Arguments to print to the output stream
 */
function outputLine(...args) {
    const line = args.join(" ");
    console.log(line);
    output.write(line + "\n");
}

// Determine the format of the export file
const CHAT_FORMAT = detectChatFormat(chat);

// Parse chat into messages
const { messages, addedMembers, leftMembers, pinnedMessages } = parseChatMessages(
    chat,
    CHAT_FORMAT,
    TAG_TO_NAME,
    FILTERS
);

// save messages as array of text only
fs.writeFileSync(
    `${outputDir}/messages-text.json`,
    JSON.stringify(
        messages.map((m) => m.text),
        null,
        4
    )
);

// ASCII art greeting
const bannerLines = createBanner(FILTERS.startDate, FILTERS.endDate, groupName);
bannerLines.forEach((line) => outputLine(line));
outputLine();

// Enrich messages with additional metadata
const { mediaPerSender, questionsPerSender, tagsPerSender, emojiPerSender, emojis, totalMedia } =
    enrichMessages(messages);

// Top message senders
const messagesPerSender = {};
messages.forEach((message) => {
    if (!messagesPerSender[message.sender]) {
        messagesPerSender[message.sender] = 0;
    }
    messagesPerSender[message.sender]++;
});
let top = getTopEntries(messagesPerSender, TOP_COUNT);
outputLine(`Top senders:`);
for (const [sender, count] of top) {
    outputLine(`${sender} - ${count} messages`);
}
outputLine();

// Top media senders
top = getTopEntries(mediaPerSender, TOP_COUNT);
outputLine(`Top media senders:`);
for (const [sender, count] of top) {
    outputLine(`${sender} - ${count} messages with media`);
}
outputLine("\nTotal messages with media:", totalMedia, "\n");

// Top question askers
top = getTopEntries(questionsPerSender, TOP_COUNT).filter((a) => a[1] > 0);
outputLine(`Top question askers:`);
for (const [sender, count] of top) {
    outputLine(`${sender} - ${count} questions asked`);
}
outputLine();

// Top taggers
top = getTopEntries(tagsPerSender, TOP_COUNT);
outputLine(`Top taggers:`);
for (const [sender, count] of top) {
    outputLine(`${sender} - ${count} tags sent`);
}
outputLine();

// Top taggees
const taggees = calculateTaggees(messages);
top = getTopEntries(taggees, TOP_COUNT);
outputLine(`Top taggees:`);
for (const [tag, count] of top) {
    outputLine(`${TAG_TO_NAME[tag] || tag} - tagged ${count} times`);
}
outputLine();

// Total messages
outputLine("Total messages:", messages.length, "\n");

// Deleted messages
outputLine("Total messages deleted:", messages.filter((m) => m.deleted).length, "\n");

// Messages deleted by admin
outputLine("Total messages deleted by admin:", messages.filter((m) => m.text === "null").length, "\n");

// Daily messages (average)
const dailyMessages = calculateDailyAverage(messages.length, FILTERS.startDate, FILTERS.endDate);
outputLine("Daily messages:", dailyMessages, "\n");

// Message senders
const senderCount = countUniqueSenders(messages);
outputLine("Message senders:", senderCount, "\n");

// Most active hour of the day
const messagesPerHour = calculateMessagesPerHour(messages);
// show top
top = Object.entries(messagesPerHour)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_COUNT);
outputLine(`Top active hours of the day:`);
for (const [hour, count] of top) {
    outputLine(`${hour}:00 - ${count} messages`);
}
outputLine();

// Most active day of the week
const messagesPerDay = calculateMessagesPerDayOfWeek(messages);
// show top
top = Object.entries(messagesPerDay).sort((a, b) => b[1] - a[1]);
outputLine(`Top active days of the week:`);
for (const [day, count] of top) {
    outputLine(`${getDayName(Number(day))} - ${count} messages`);
}
outputLine();

// Most active month of the year
const messagesPerMonth = calculateMessagesPerMonth(messages);
// show top
top = Object.entries(messagesPerMonth).sort((a, b) => b[1] - a[1]);
outputLine(`Top active months of the year:`);
for (const [month, count] of top) {
    outputLine(`${getMonthName(Number(month))} - ${count} messages`);
}
outputLine();

// Members who joined
outputLine("Members who joined:", addedMembers.size, "\n");

// Members who left
if (leftMembers.size > 0) {
    outputLine("Members who left:", leftMembers.size, "\n");
}

// Pinned messages
if (pinnedMessages > 0) {
    outputLine("Messages pinned:", pinnedMessages, "\n");
}

// Total number of words sent, average number of words per message, most common words
const { totalWords, messagesWithWords, words, uncommonWords } = calculateWordStats(messages, commonWords);
outputLine("Total number of words sent:", totalWords, "\n");
outputLine("Average number of words per message:", Math.round((totalWords / messagesWithWords) * 100) / 100, "\n");
// show top
top = Object.entries(words)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_COUNT);
outputLine(`Top words:`);
for (const [word, count] of top) {
    outputLine(`${word} - ${count} times`);
}
outputLine();
// show top uncommon
top = Object.entries(uncommonWords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_COUNT);
outputLine(`Top uncommon words:`);
for (const [word, count] of top) {
    outputLine(`${word} - ${count} times`);
}
outputLine();

// Top emoji senders, Most common emojis
top = Object.entries(emojiPerSender)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, TOP_COUNT);
outputLine(`Top emoji senders:`);
for (const [sender, emojiString] of top) {
    outputLine(`${sender} - ${emojiString.length} emojis`);
}
outputLine();
top = getTopEntries(emojis, TOP_COUNT);
outputLine(`Top emojis:`);
for (const [emoji, count] of top) {
    outputLine(`${emoji} - ${count} times`);
}
outputLine();

// Number of unique emojis
outputLine("Number of unique emojis:", Object.keys(emojis).length, "\n");

// Analyze VCF files if this is a ZIP file
let vcfAnalysis = new Map();
if (IMPORT_FILE.toLowerCase().endsWith(".zip")) {
    try {
        vcfAnalysis = analyzeVcfFiles(IMPORT_FILE, extractFilesByExtension);
    } catch (error) {
        console.warn(`Warning: Could not analyze VCF files - ${error.message}`);
    }
}

// VCF analysis output
if (vcfAnalysis.size > 0) {
    // Sort by count (most shared first)
    const sortedPhones = Array.from(vcfAnalysis.entries()).sort((a, b) => b[1].count - a[1].count);

    outputLine(`Total unique phone numbers sent as contacts: ${sortedPhones.length}`);
    outputLine();

    // Show most shared contacts
    const topShared = sortedPhones.slice(0, Math.min(TOP_COUNT, sortedPhones.length));
    outputLine(`Top ${topShared.length} most shared contacts:`);
    for (let i = 0; i < topShared.length; i++) {
        const [phone, stats] = topShared[i];
        outputLine(`${i + 1}. ${stats.mostCommonName} (${phone}) - shared ${stats.count} times`);

        // If there are multiple names for this number, show them
        if (stats.names.size > 1) {
            const nameList = Array.from(stats.names.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => `${name} (${count})`)
                .join(", ");
            outputLine(`   Also known as: ${nameList}`);
        }
    }
    outputLine();

    // Statistics
    const multipleShareCount = sortedPhones.filter(([_, stats]) => stats.count > 1).length;
    const multipleNameCount = sortedPhones.filter(([_, stats]) => stats.names.size > 1).length;

    outputLine(`Contacts shared by multiple people: ${multipleShareCount}`);
    outputLine(`Contacts with different names: ${multipleNameCount}`);
    outputLine();
}

// save messages as json
fs.writeFileSync(`${outputDir}/messages.json`, JSON.stringify(messages, null, 4));

// save messages as csv
const csvContent = generateCsv(messages);
if (csvContent) {
    fs.writeFileSync(`${outputDir}/messages.csv`, csvContent);
}
