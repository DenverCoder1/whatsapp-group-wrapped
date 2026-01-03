/**
 * Set config values in config.js
 * Run script with: `node main.js <file> [startDate] [endDate] [topCount] [outputFormat] [language]`
 */

let { FILTERS, TAG_TO_NAME, TOP_COUNT } = require("./config.js");
const { extractFirstFileByExtension, extractFilesByExtension } = require("./zip-extractor.js");
const Translations = require("./translations.js");

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

// Optional arguments to override config: startDate, endDate, topCount, outputFormat, language
let OUTPUT_FORMAT = 'text'; // default to text
let LANGUAGE = 'en'; // default to English
if (process.argv[3]) {
    const startDate = process.argv[3];
    const endDate = process.argv[4] || FILTERS.endDate.toISOString().split('T')[0];
    const topCount = process.argv[5] ? Number.parseInt(process.argv[5], 10) : TOP_COUNT;
    const outputFormat = process.argv[6] || 'text';
    const language = process.argv[7] || 'en';
    
    FILTERS = {
        startDate: new Date(startDate + 'T00:00:00'),
        endDate: new Date(endDate + 'T23:59:59'),
    };
    TOP_COUNT = topCount;
    OUTPUT_FORMAT = outputFormat;
    LANGUAGE = language;
}

// Initialize translations
const i18n = new Translations(LANGUAGE);

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
        endDate: FILTERS.endDate.toISOString().split('T')[0],
        language: {
            code: i18n.getLanguageCode(),
            name: i18n.getLanguageName(),
            rtl: i18n.isRTL()
        }
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

const commonWords = new Set();

// Load all common words files (English, Hebrew, etc.)
const commonWordsFiles = ['common-words-en.txt', 'common-words-he.txt'];
for (const file of commonWordsFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        const words = fs.readFileSync(filePath, "utf8")
            .split("\n")
            .map((w) => w.toLowerCase())
            .filter((w) => w.length > 0);
        words.forEach(w => commonWords.add(w));
    }
}

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
 * @param {boolean} isRanked - Whether this section shows ranked items with numbers
 */
function addJsonSection(title, items, icon = '📊', isRanked = false) {
    if (OUTPUT_FORMAT === 'json') {
        jsonOutput.sections.push({
            title,
            icon,
            isRanked,
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
outputLine(`${i18n.t('sections.topSenders')}:`);
for (const [sender, count] of top) {
    const unit = i18n.pluralize(count, i18n.t('units.message'));
    outputLine(`${sender} - ${count} ${unit}`);
}
outputLine();
addJsonSection(i18n.t('sections.topSenders'), top.map(([name, count]) => ({ name, value: `${count} ${i18n.pluralize(count, i18n.t('units.message'))}` })), '📊', true);

// Top media senders
top = getTopEntries(mediaPerSender, TOP_COUNT);
outputLine(`${i18n.t('sections.topMediaSenders')}:`);
for (const [sender, count] of top) {
    const unit = i18n.pluralize(count, i18n.t('units.messageWithMedia'));
    outputLine(`${sender} - ${count} ${unit}`);
}
outputLine(`\n${i18n.t('messages.totalMessagesWithMedia')}:`, totalMedia, "\n");
addJsonSection(i18n.t('sections.topMediaSenders'), top.map(([name, count]) => ({ name, value: `${count} ${i18n.pluralize(count, i18n.t('units.messageWithMedia'))}` })), '📷', true);

// Top question askers
top = getTopEntries(questionsPerSender, TOP_COUNT).filter((a) => a[1] > 0);
outputLine(`${i18n.t('sections.topQuestionAskers')}:`);
for (const [sender, count] of top) {
    const unit = i18n.pluralize(count, i18n.t('units.question'));
    const verb = i18n.conjugateVerb(count, i18n.t('actions.asked'));
    outputLine(`${sender} - ${count} ${unit} ${verb}`);
}
outputLine();
addJsonSection(i18n.t('sections.topQuestionAskers'), top.map(([name, count]) => ({ name, value: `${count} ${i18n.pluralize(count, i18n.t('units.question'))} ${i18n.conjugateVerb(count, i18n.t('actions.asked'))}` })), '❓', true);

// Top taggers
top = getTopEntries(tagsPerSender, TOP_COUNT);
outputLine(`${i18n.t('sections.topTaggers')}:`);
for (const [sender, count] of top) {
    const unit = i18n.pluralize(count, i18n.t('units.tag'));
    const verb = i18n.conjugateVerb(count, i18n.t('actions.sent'));
    outputLine(`${sender} - ${count} ${unit} ${verb}`);
}
outputLine();
addJsonSection(i18n.t('sections.topTaggers'), top.map(([name, count]) => ({ name, value: `${count} ${i18n.pluralize(count, i18n.t('units.tag'))} ${i18n.conjugateVerb(count, i18n.t('actions.sent'))}` })), '🏷️', true);

// Top taggees
const taggees = calculateTaggees(messages);
top = getTopEntries(taggees, TOP_COUNT);
outputLine(`${i18n.t('sections.topTaggees')}:`);
for (const [tag, count] of top) {
    const unit = i18n.pluralize(count, i18n.t('units.time'));
    const verb = i18n.conjugateVerb(count, i18n.t('actions.tagged'));
    outputLine(`${TAG_TO_NAME[tag] || tag} - ${verb} ${count} ${unit}`);
}
outputLine();
addJsonSection(i18n.t('sections.topTaggees'), top.map(([tag, count]) => ({ name: TAG_TO_NAME[tag] || tag, value: `${i18n.conjugateVerb(count, i18n.t('actions.tagged'))} ${count} ${i18n.pluralize(count, i18n.t('units.time'))}` })), '👤', true);

// Total messages
outputLine(`${i18n.t('stats.totalMessages')}:`, messages.length, "\n");

// Deleted messages
const deletedCount = messages.filter((m) => m.deleted).length;
outputLine(`${i18n.t('stats.messagesDeleted')}:`, deletedCount, "\n");

// Messages deleted by admin
const deletedByAdminCount = messages.filter((m) => m.text === "null").length;
outputLine(`${i18n.t('stats.messagesDeletedByAdmin')}:`, deletedByAdminCount, "\n");

// Daily messages (average)
const dailyMessages = calculateDailyAverage(messages.length, FILTERS.startDate, FILTERS.endDate);
outputLine(`${i18n.t('stats.dailyAverage')}:`, dailyMessages, "\n");

// Message senders
const senderCount = countUniqueSenders(messages);
outputLine(`${i18n.t('stats.messageSenders')}:`, senderCount, "\n");

// Add Message Stats section
const messageStats = [
    { name: i18n.t('stats.totalMessages'), value: messages.length.toString() },
    { name: i18n.t('stats.messagesWithMedia'), value: totalMedia.toString() },
    { name: i18n.t('stats.messagesDeleted'), value: deletedCount.toString() },
    { name: i18n.t('stats.dailyAverage'), value: dailyMessages.toString() }
];
if (pinnedMessages > 0) {
    messageStats.push({ name: i18n.t('stats.messagesPinned'), value: pinnedMessages.toString() });
}
addJsonSection(i18n.t('sections.messageStats'), messageStats, '📊');

// Add Member Stats section
const memberStats = [
    { name: i18n.t('stats.messageSenders'), value: senderCount.toString() },
    { name: i18n.t('stats.membersJoined'), value: addedMembers.size.toString() }
];
if (leftMembers.size > 0) {
    memberStats.push({ name: i18n.t('stats.membersLeft'), value: leftMembers.size.toString() });
}
addJsonSection(i18n.t('sections.memberStats'), memberStats, '👥');

// Most active hour of the day
const messagesPerHour = calculateMessagesPerHour(messages);
// show top
top = Object.entries(messagesPerHour)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_COUNT);
outputLine(`${i18n.t('sections.mostActiveHours')}:`);
for (const [hour, count] of top) {
    const unit = i18n.pluralize(count, i18n.t('units.message'));
    outputLine(`${i18n.format(i18n.t('formats.hourFormat'), {hour})} - ${count} ${unit}`);
}
outputLine();
addJsonSection(i18n.t('sections.mostActiveHours'), top.map(([hour, count]) => ({ name: i18n.format(i18n.t('formats.hourFormat'), {hour}), value: `${count} ${i18n.pluralize(count, i18n.t('units.message'))}` })), '⏰');

// Most active day of the week
const messagesPerDay = calculateMessagesPerDayOfWeek(messages);
// show top
top = Object.entries(messagesPerDay).sort((a, b) => b[1] - a[1]);
outputLine(`${i18n.t('sections.mostActiveDays')}:`);
for (const [day, count] of top) {
    const unit = i18n.pluralize(count, i18n.t('units.message'));
    outputLine(`${i18n.getDayName(Number(day))} - ${count} ${unit}`);
}
outputLine();
addJsonSection(i18n.t('sections.mostActiveDays'), top.map(([day, count]) => ({ name: i18n.getDayName(Number(day)), value: `${count} ${i18n.pluralize(count, i18n.t('units.message'))}` })), '📅');

// Most active month of the year
const messagesPerMonth = calculateMessagesPerMonth(messages);
// show top
top = Object.entries(messagesPerMonth).sort((a, b) => b[1] - a[1]);
outputLine(`${i18n.t('sections.mostActiveMonths')}:`);
for (const [month, count] of top) {
    const unit = i18n.pluralize(count, i18n.t('units.message'));
    outputLine(`${i18n.getMonthName(Number(month))} - ${count} ${unit}`);
}
outputLine();
addJsonSection(i18n.t('sections.mostActiveMonths'), top.map(([month, count]) => ({ name: i18n.getMonthName(Number(month)), value: `${count} ${i18n.pluralize(count, i18n.t('units.message'))}` })), '📆');

// Members who joined
outputLine(`${i18n.t('stats.membersJoined')}:`, addedMembers.size, "\n");

// Members who left
if (leftMembers.size > 0) {
    outputLine(`${i18n.t('stats.membersLeft')}:`, leftMembers.size, "\n");
}

// Pinned messages
if (pinnedMessages > 0) {
    outputLine(`${i18n.t('stats.messagesPinned')}:`, pinnedMessages, "\n");
}

// Total number of words sent, average number of words per message, most common words
const { totalWords, messagesWithWords, words, uncommonWords } = calculateWordStats(messages, commonWords);
const avgWordsPerMessage = Math.round((totalWords / messagesWithWords) * 100) / 100;
outputLine(`${i18n.t('stats.totalWordsent')}:`, totalWords, "\n");
outputLine(`${i18n.t('stats.wordsPerMessage')}:`, avgWordsPerMessage, "\n");

// show top common words
top = Object.entries(words)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_COUNT);
outputLine(`${i18n.t('sections.topWords')}:`);
for (const [word, count] of top) {
    const unit = i18n.pluralize(count, i18n.t('units.time'));
    outputLine(`${word} - ${count} ${unit}`);
}
outputLine();
addJsonSection(i18n.t('sections.topWords'), top.map(([word, count]) => ({ name: word, value: `${count} ${i18n.pluralize(count, i18n.t('units.time'))}` })), '💬');

// show top uncommon words
const topUncommon = Object.entries(uncommonWords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_COUNT);
outputLine(`${i18n.t('sections.topUncommonWords')}:`);
for (const [word, count] of topUncommon) {
    const unit = i18n.pluralize(count, i18n.t('units.time'));
    outputLine(`${word} - ${count} ${unit}`);
}
outputLine();
addJsonSection(i18n.t('sections.topUncommonWords'), topUncommon.map(([word, count]) => ({ name: word, value: `${count} ${i18n.pluralize(count, i18n.t('units.time'))}` })), '✨');

// Add Word Stats section
const wordStats = [
    { name: i18n.t('stats.totalWordsent'), value: totalWords.toString() },
    { name: i18n.t('stats.wordsPerMessage'), value: avgWordsPerMessage.toString() }
];
addJsonSection(i18n.t('sections.wordStats'), wordStats, '📝');

// Top emoji senders, Most common emojis
top = Object.entries(emojiPerSender)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, TOP_COUNT);
outputLine(`${i18n.t('sections.topEmojiSenders')}:`);
for (const [sender, emojiString] of top) {
    const unit = i18n.pluralize(emojiString.length, i18n.t('units.emoji'));
    outputLine(`${sender} - ${emojiString.length} ${unit}`);
}
outputLine();
addJsonSection(i18n.t('sections.topEmojiSenders'), top.map(([name, emojiString]) => ({ name, value: `${emojiString.length} ${i18n.pluralize(emojiString.length, i18n.t('units.emoji'))}` })), '😀', true);

top = getTopEntries(emojis, TOP_COUNT);
outputLine(`${i18n.t('sections.topEmojis')}:`);
for (const [emoji, count] of top) {
    const unit = i18n.pluralize(count, i18n.t('units.time'));
    outputLine(`${emoji} - ${count} ${unit}`);
}
outputLine();
addJsonSection(i18n.t('sections.topEmojis'), top.map(([emoji, count]) => ({ name: emoji, value: `${count} ${i18n.pluralize(count, i18n.t('units.time'))}` })), '🎉', true);

// Number of unique emojis
outputLine(`${i18n.t('stats.numberOfUniqueEmojis')}:`, Object.keys(emojis).length, "\n");

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

    outputLine(`${i18n.t('stats.uniquePhoneNumbers')}: ${sortedPhones.length}`);
    outputLine();

    // Show most shared contacts
    const topShared = sortedPhones.slice(0, Math.min(TOP_COUNT, sortedPhones.length));
    outputLine(i18n.format(i18n.t('formats.topXMostShared'), {count: topShared.length}) + ':');
    for (let i = 0; i < topShared.length; i++) {
        const [phone, stats] = topShared[i];
        const unit = i18n.pluralize(stats.count, i18n.t('units.time'));
        const verb = i18n.conjugateVerb(stats.count, i18n.t('actions.shared'));
        outputLine(`${i + 1}. ${stats.mostCommonName} (${phone}) - ${verb} ${stats.count} ${unit}`);

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
    addJsonSection(i18n.t('sections.topContactsShared'), 
        topShared.map(([phone, stats]) => ({ 
            name: stats.mostCommonName, 
            value: `${i18n.conjugateVerb(stats.count, i18n.t('actions.shared'))} ${stats.count} ${i18n.pluralize(stats.count, i18n.t('units.time'))}` 
        })), 
        '📞',
        true
    );

    // Statistics
    const multipleShareCount = sortedPhones.filter(([_, stats]) => stats.count > 1).length;
    const multipleNameCount = sortedPhones.filter(([_, stats]) => stats.names.size > 1).length;

    outputLine(`${i18n.t('stats.contactsSharedByMultiple')}: ${multipleShareCount}`);
    outputLine(`${i18n.t('stats.contactsWithDifferentNames')}: ${multipleNameCount}`);
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
