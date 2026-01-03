/**
 * Set config values in config.js
 * Run script with: `node main.js <file> [startDate] [endDate] [topCount]`
 */

let { FILTERS, TAG_TO_NAME, TOP_COUNT } = require("./config.js");
const { extractFirstFileByExtension, extractFilesByExtension } = require("./zip-extractor.js");

// Helper function for pluralization
function pluralize(count, singular, plural = null) {
    if (count === 1) return singular;
    return plural || singular + 's';
}

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

// Optional arguments to override config: startDate, endDate, topCount, outputFormat
let OUTPUT_FORMAT = 'text'; // default to text
if (process.argv[3]) {
    const startDate = process.argv[3];
    const endDate = process.argv[4] || FILTERS.endDate.toISOString().split('T')[0];
    const topCount = process.argv[5] ? Number.parseInt(process.argv[5], 10) : TOP_COUNT;
    const outputFormat = process.argv[6] || 'text';
    
    FILTERS = {
        startDate: new Date(startDate + 'T00:00:00'),
        endDate: new Date(endDate + 'T23:59:59'),
    };
    TOP_COUNT = topCount;
    OUTPUT_FORMAT = outputFormat;
}

// create an output directory to store the results
const outputDir = process.env.VERCEL ? '/tmp/output' : path.join(__dirname, "..", "output");
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// JSON output structure
const jsonOutput = {
    metadata: {
        groupName: '',
        startDate: FILTERS.startDate.toISOString().split('T')[0],
        endDate: FILTERS.endDate.toISOString().split('T')[0]
    },
    sections: []
};

// Load chat file
let chat, chatFileName, groupName;
try {
    const loaded = loadChatFile(IMPORT_FILE, extractFirstFileByExtension);
    chat = loaded.chat;
    chatFileName = loaded.fileName;
    groupName = extractGroupName(chatFileName);
    jsonOutput.metadata.groupName = groupName;
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
    if (OUTPUT_FORMAT === 'text') {
        console.log(line);
        output.write(line + "\n");
    }
}

/**
 * Add a section to JSON output
 * @param {string} title - Section title
 * @param {Array} items - Array of {name, value} objects or strings
 * @param {string} icon - Optional icon for the section
 */
function addJsonSection(title, items, icon = '📊') {
    if (OUTPUT_FORMAT === 'json') {
        jsonOutput.sections.push({
            title,
            icon,
            items: items.map(item => {
                if (typeof item === 'object' && item.name && item.value) {
                    return item;
                }
                // Handle array format [name, value]
                if (Array.isArray(item)) {
                    return { name: item[0], value: item[1] };
                }
                return item;
            })
        });
    }
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
    outputLine(`${sender} - ${count} ${pluralize(count, 'message')}`);
}
outputLine();
addJsonSection('Top senders', top.map(([name, count]) => ({ name, value: `${count} ${pluralize(count, 'message')}` })), '📊');

// Top media senders
top = getTopEntries(mediaPerSender, TOP_COUNT);
outputLine(`Top media senders:`);
for (const [sender, count] of top) {
    outputLine(`${sender} - ${count} ${pluralize(count, 'message')} with media`);
}
outputLine("\nTotal messages with media:", totalMedia, "\n");
addJsonSection('Top media senders', top.map(([name, count]) => ({ name, value: `${count} ${pluralize(count, 'message')} with media` })), '📷');

// Top question askers
top = getTopEntries(questionsPerSender, TOP_COUNT).filter((a) => a[1] > 0);
outputLine(`Top question askers:`);
for (const [sender, count] of top) {
    outputLine(`${sender} - ${count} ${pluralize(count, 'question')} asked`);
}
outputLine();
addJsonSection('Top question askers', top.map(([name, count]) => ({ name, value: `${count} ${pluralize(count, 'question')} asked` })), '❓');

// Top taggers
top = getTopEntries(tagsPerSender, TOP_COUNT);
outputLine(`Top taggers:`);
for (const [sender, count] of top) {
    outputLine(`${sender} - ${count} ${pluralize(count, 'tag')} sent`);
}
outputLine();
addJsonSection('Top taggers', top.map(([name, count]) => ({ name, value: `${count} ${pluralize(count, 'tag')} sent` })), '🏷️');

// Top taggees
const taggees = calculateTaggees(messages);
top = getTopEntries(taggees, TOP_COUNT);
outputLine(`Top taggees:`);
for (const [tag, count] of top) {
    outputLine(`${TAG_TO_NAME[tag] || tag} - tagged ${count} ${pluralize(count, 'time')}`);
}
outputLine();
addJsonSection('Top taggees', top.map(([tag, count]) => ({ name: TAG_TO_NAME[tag] || tag, value: `tagged ${count} ${pluralize(count, 'time')}` })), '👤');

// Total messages
outputLine("Total messages:", messages.length, "\n");

// Deleted messages
const deletedCount = messages.filter((m) => m.deleted).length;
outputLine("Total messages deleted:", deletedCount, "\n");

// Messages deleted by admin
const deletedByAdminCount = messages.filter((m) => m.text === "null").length;
outputLine("Total messages deleted by admin:", deletedByAdminCount, "\n");

// Daily messages (average)
const dailyMessages = calculateDailyAverage(messages.length, FILTERS.startDate, FILTERS.endDate);
outputLine("Daily messages:", dailyMessages, "\n");

// Message senders
const senderCount = countUniqueSenders(messages);
outputLine("Message senders:", senderCount, "\n");

// Add Message Stats section
const messageStats = [
    { name: 'Total messages', value: messages.length.toString() },
    { name: 'Messages with media', value: totalMedia.toString() },
    { name: 'Messages deleted', value: deletedCount.toString() },
    { name: 'Daily average', value: dailyMessages.toString() }
];
if (pinnedMessages > 0) {
    messageStats.push({ name: 'Messages pinned', value: pinnedMessages.toString() });
}
addJsonSection('Message Stats', messageStats, '📊');

// Add Member Stats section
const memberStats = [
    { name: 'Message senders', value: senderCount.toString() },
    { name: 'Members joined', value: addedMembers.size.toString() }
];
if (leftMembers.size > 0) {
    memberStats.push({ name: 'Members left', value: leftMembers.size.toString() });
}
addJsonSection('Member Stats', memberStats, '👥');

// Most active hour of the day
const messagesPerHour = calculateMessagesPerHour(messages);
// show top
top = Object.entries(messagesPerHour)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_COUNT);
outputLine(`Top active hours of the day:`);
for (const [hour, count] of top) {
    outputLine(`${hour}:00 - ${count} ${pluralize(count, 'message')}`);
}
outputLine();
addJsonSection('Most Active Hours', top.map(([hour, count]) => ({ name: `${hour}:00`, value: `${count} ${pluralize(count, 'message')}` })), '⏰');

// Most active day of the week
const messagesPerDay = calculateMessagesPerDayOfWeek(messages);
// show top
top = Object.entries(messagesPerDay).sort((a, b) => b[1] - a[1]);
outputLine(`Top active days of the week:`);
for (const [day, count] of top) {
    outputLine(`${getDayName(Number(day))} - ${count} ${pluralize(count, 'message')}`);
}
outputLine();
addJsonSection('Most Active Days', top.map(([day, count]) => ({ name: getDayName(Number(day)), value: `${count} ${pluralize(count, 'message')}` })), '📅');

// Most active month of the year
const messagesPerMonth = calculateMessagesPerMonth(messages);
// show top
top = Object.entries(messagesPerMonth).sort((a, b) => b[1] - a[1]);
outputLine(`Top active months of the year:`);
for (const [month, count] of top) {
    outputLine(`${getMonthName(Number(month))} - ${count} ${pluralize(count, 'message')}`);
}
outputLine();
addJsonSection('Most Active Months', top.map(([month, count]) => ({ name: getMonthName(Number(month)), value: `${count} ${pluralize(count, 'message')}` })), '📆');

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
const avgWordsPerMessage = Math.round((totalWords / messagesWithWords) * 100) / 100;
outputLine("Total number of words sent:", totalWords, "\n");
outputLine("Average number of words per message:", avgWordsPerMessage, "\n");
// show top
top = Object.entries(words)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_COUNT);
outputLine(`Top words:`);
for (const [word, count] of top) {
    outputLine(`${word} - ${count} ${pluralize(count, 'time')}`);
}
outputLine();
// show top uncommon
const topUncommon = Object.entries(uncommonWords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_COUNT);
outputLine(`Top uncommon words:`);
for (const [word, count] of topUncommon) {
    outputLine(`${word} - ${count} ${pluralize(count, 'time')}`);
}
outputLine();

// Add Word Stats section
const wordStats = [
    { name: 'Total words sent', value: totalWords.toString() },
    { name: 'Words per message', value: avgWordsPerMessage.toString() }
];
// Add top 3 uncommon words
const top3Uncommon = topUncommon.slice(0, 3);
top3Uncommon.forEach(([word, count], i) => {
    wordStats.push({ name: `#${i + 1} uncommon word`, value: `${word} (${count}×)` });
});
addJsonSection('Word Stats', wordStats, '📝');

// Top emoji senders, Most common emojis
top = Object.entries(emojiPerSender)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, TOP_COUNT);
outputLine(`Top emoji senders:`);
for (const [sender, emojiString] of top) {
    outputLine(`${sender} - ${emojiString.length} ${pluralize(emojiString.length, 'emoji')}`);
}
outputLine();
addJsonSection('Top Emoji Senders', top.map(([name, emojiString]) => ({ name, value: `${emojiString.length} ${pluralize(emojiString.length, 'emoji')}` })), '😀');

top = getTopEntries(emojis, TOP_COUNT);
outputLine(`Top emojis:`);
for (const [emoji, count] of top) {
    outputLine(`${emoji} - ${count} ${pluralize(count, 'time')}`);
}
outputLine();
addJsonSection('Top Emojis', top.map(([emoji, count]) => ({ name: emoji, value: `${count} ${pluralize(count, 'time')}` })), '🎉');

// Number of unique emojis
outputLine("Number of unique emojis:", Object.keys(emojis).length, "\n");

// Analyze VCF files if this is a ZIP file
let vcfAnalysis = new Map();
if (IMPORT_FILE.toLowerCase().endsWith(".zip")) {
    try {
        vcfAnalysis = analyzeVcfFiles(IMPORT_FILE, extractFilesByExtension, messages);
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
        outputLine(`${i + 1}. ${stats.mostCommonName} (${phone}) - shared ${stats.count} ${pluralize(stats.count, 'time')}`);

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
    
    // Add Top Contacts section
    addJsonSection('Top Contacts Shared', 
        topShared.map(([phone, stats]) => ({ 
            name: stats.mostCommonName, 
            value: `shared ${stats.count} ${pluralize(stats.count, 'time')}` 
        })), 
        '📞'
    );

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

// Output JSON if requested
if (OUTPUT_FORMAT === 'json') {
    console.log(JSON.stringify(jsonOutput, null, 2));
}
