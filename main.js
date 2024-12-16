/**
 * Set config values in config.js
 * Run script with: `node main.js`
 */

const GraphemeSplitter = require("./grapheme-splitter.min.js");
const splitter = new GraphemeSplitter();
const { FILTERS, TAG_TO_NAME, TOP_COUNT } = require("./config.js");

// check if a parameter is passed to the script
if (process.argv.length < 3) {
    console.error("Please provide a file to analyze");
    process.exit(1);
}

// read the chat file
const IMPORT_FILE = process.argv[2];

// create an output directory to store the results
const outputDir = "output";
require("fs").mkdirSync(outputDir, { recursive: true });

const chat = require("fs")
    .readFileSync(IMPORT_FILE, "utf8")
    .replace(/[\u202f\u200e]/g, " ")
    .replace(/\u200e/g, "");

const commonWords = new Set(
    require("fs")
        .readFileSync("common-words.txt", "utf8")
        .split("\n")
        .map((w) => w.toLowerCase())
);

// create an output file stream to write the results
const output = require("fs").createWriteStream(`${outputDir}/results.txt`, { flags: "w" });

/* 
 * Take 1 or more args and print them to output and log them to console
 */
function outputLine(...args) {
    const line = args.join(" ");
    console.log(line);
    output.write(line + "\n");
}

// Determine the format of the export file (the export differs between Android and iOS)
// 1 = 3/9/23, 14:29 - Name: Message
// 2 = [2023-03-09, 2:29:00 PM] Name: Message
const type1Matches = (chat.match(/^\d{1,2}\/\d{1,2}\/\d{2}, \d{2}:\d{2}/gm) || []).length;
const type2Matches = (chat.match(/^\[\d{4}-\d{2}-\d{2}, \d{1,2}:\d{2}:\d{2} (?:AM|PM)\]/gm) || []).length;
const CHAT_FORMAT = type1Matches > type2Matches ? 1 : 2;

// parse chat into messages
let startOfMessageRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2}), (\d{2}):(\d{2}) (?:- ([^:]+)(?::) )?/;
if (CHAT_FORMAT === 2) {
    startOfMessageRegex = /^ ?\[(\d{4})-(\d{2})-(\d{2}), (\d{1,2}):(\d{2}):(\d{2}) (AM|PM)\] (.*?): /;
}
const messages = [];
let currentMessage = null;
const addedMembers = new Set();
function regexEscape(str) {
    return str.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}
function addMessage(message) {
    if (message.date < FILTERS.startDate || message.date > FILTERS.endDate) {
        return;
    }
    if (
        new RegExp(
            [`added ${message.sender}`, "joined using this group's invite link", `${message.sender} was added`]
                .map(regexEscape)
                .join("|")
        ).test(message.text) ||
        (!message.sender && message.text.includes("added"))
    ) {
        addedMembers.add(message.sender ?? message.text);
        return;
    }
    if (
        new RegExp(
            [
                `${message.sender} left`,
                `${message.sender} was removed`,
                `changed this group's icon`,
                `changed to +`,
                `changed the subject from`,
                `changed their phone number to a new number`,
                `changed the group description`,
                `changed this group's settings`,
                `deleted this group's icon`,
                `deleted this group's description`,
                `turned on admin approval to join this group`,
                `${message.sender} created this group`,
                `Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.`,
                `${message.sender} pinned a message`,
            ]
                .map(regexEscape)
                .join("|")
        ).test(message.text)
    ) {
        return;
    }
    messages.push(message);
}
for (const line of chat.split("\n")) {
    const match = startOfMessageRegex.exec(line);
    if (match) {
        if (currentMessage) {
            addMessage(currentMessage);
            currentMessage = null;
        }
        let year = "20" + match[3];
        let day = match[2];
        let month = match[1];
        let hour = match[4];
        let minute = match[5];
        let sender = match[6];
        if (CHAT_FORMAT === 2) {
            year = Number(match[1]);
            month = Number(match[2]);
            day = Number(match[3]);
            hour = Number(match[4]);
            if (match[7] === "PM" && hour !== 12) {
                hour += 12;
            } else if (match[7] === "AM" && hour === 12) {
                hour = 0;
            }
            minute = Number(match[5]);
            sender = match[8];
        }
        // convert phone numbers to names if found
        const senderDigits = (sender ?? "").replace(/\D/g, "");
        if (/[\d\s+-]/.test(sender) && TAG_TO_NAME[`@${senderDigits}`]) {
            sender = TAG_TO_NAME[`@${senderDigits}`];
        }
        currentMessage = {
            sender,
            year,
            month,
            day,
            hour,
            minute,
            date: new Date(year, month - 1, day, hour, minute),
            text: line.substring(match[0].length),
        };
    } else if (currentMessage) {
        currentMessage.text += "\n" + line;
    } else {
        console.error("Couldn't parse line:", line);
    }
}
if (currentMessage) {
    addMessage(currentMessage);
}

// save messages as array of text only
require("fs").writeFileSync(
    `${outputDir}/messages-text.json`,
    JSON.stringify(
        messages.map((m) => m.text),
        null,
        4
    )
);

// Top message senders
const messagesPerSender = {};
messages.forEach((message) => {
    if (!messagesPerSender[message.sender]) {
        messagesPerSender[message.sender] = 0;
    }
    messagesPerSender[message.sender]++;
});
// show top
let top = Object.entries(messagesPerSender)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_COUNT);
outputLine(`Top senders:`);
for (const [sender, count] of top) {
    outputLine(`${sender} - ${count} messages`);
}
outputLine();

// Top media senders
const mediaPerSender = {};
let totalMedia = 0;
messages.forEach((message, i) => {
    if (!mediaPerSender[message.sender]) {
        mediaPerSender[message.sender] = 0;
    }
    const hasMedia = /<Media omitted>|image omitted|video omitted|sticker omitted|GIF omitted/.test(message.text);
    if (hasMedia) {
        mediaPerSender[message.sender]++;
        totalMedia++;
    }
    messages[i].media = hasMedia;
});
// show top
top = Object.entries(mediaPerSender)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_COUNT);
outputLine(`Top media senders:`);
for (const [sender, count] of top) {
    outputLine(`${sender} - ${count} messages with media`);
}
outputLine("\nTotal messages with media:", totalMedia, "\n");

// Top question askers
const questionsPerSender = {};
messages.forEach((message, i) => {
    if (!questionsPerSender[message.sender]) {
        questionsPerSender[message.sender] = 0;
    }
    const questionPhrases = [
        "anyone know",
        "any leads",
        "does anyone",
        "can I",
        "anyone have",
        "what is",
        "why is",
        "what does",
        "what was",
        "why was",
        "where is",
        "where was",
        "what are",
        "why are",
        "where are",
        "do you",
        "is it possible",
        "question:",
        "question is",
        "where would",
        "do any of you",
    ];
    const questionIfFirstWord = [
        "what",
        "why",
        "where",
        "when",
        "how",
        "who",
        "is",
        "are",
        "do",
        "does",
        "can",
        "will",
        "would",
        "should",
        "could",
        "did",
        "was",
        "were",
        "has",
        "have",
        "had",
    ];
    const hasQuestion =
        /\?(?:\s|$)/.test(message.text) ||
        new RegExp(questionPhrases.map(regexEscape).join("|")).test(message.text) ||
        questionIfFirstWord.some((w) => message.text.toLowerCase().startsWith(w + " "));
    if (hasQuestion) {
        questionsPerSender[message.sender]++;
    }
    messages[i].question = hasQuestion;
});
// show top
top = Object.entries(questionsPerSender)
    .sort((a, b) => b[1] - a[1])
    .filter((a) => a[1] > 0)
    .slice(0, TOP_COUNT);
outputLine(`Top question askers:`);
for (const [sender, count] of top) {
    outputLine(`${sender} - ${count} questions asked`);
}
outputLine();

// Top taggers
const tagsPerSender = {};
messages.forEach((message, i) => {
    if (!tagsPerSender[message.sender]) {
        tagsPerSender[message.sender] = 0;
    }
    const tags = message.text.match(/@\d{10,}/g);
    if (tags) {
        tagsPerSender[message.sender] += tags.length;
    }
    messages[i].tags = [...new Set(tags || [])].join(" ");
});
// show top
top = Object.entries(tagsPerSender)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_COUNT);
outputLine(`Top taggers:`);
for (const [sender, count] of top) {
    outputLine(`${sender} - ${count} tags sent`);
}
outputLine();

// Top taggees
const taggees = {};
messages.forEach((message) => {
    const tags = message.text.match(/@\d{10,}/g);
    if (tags) {
        for (const tag of tags) {
            if (!taggees[tag]) {
                taggees[tag] = 0;
            }
            taggees[tag]++;
        }
    }
});
// show top
top = Object.entries(taggees)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_COUNT);
outputLine(`Top taggees:`);
for (const [tag, count] of top) {
    outputLine(`${TAG_TO_NAME[tag] || tag} - tagged ${count} times`);
}
outputLine();

// Total messages
outputLine("Total messages:", messages.length, "\n");

// Daily messages (average)
const dailyMessages = messages.length / ((FILTERS.endDate - FILTERS.startDate) / (1000 * 60 * 60 * 24));
outputLine("Daily messages:", Math.round(dailyMessages * 100) / 100, "\n");

// Message senders
const senders = new Set(messages.map((m) => m.sender));
outputLine("Message senders:", senders.size, "\n");

// Most active hour of the day
const messagesPerHour = {};
messages.forEach((message) => {
    if (!messagesPerHour[message.hour]) {
        messagesPerHour[message.hour] = 0;
    }
    messagesPerHour[message.hour]++;
});
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
const messagesPerDay = {};
messages.forEach((message) => {
    if (!messagesPerDay[message.date.getDay()]) {
        messagesPerDay[message.date.getDay()] = 0;
    }
    messagesPerDay[message.date.getDay()]++;
});
// show top
top = Object.entries(messagesPerDay).sort((a, b) => b[1] - a[1]);
outputLine(`Top active days of the week:`);
for (const [day, count] of top) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    outputLine(`${days[day]} - ${count} messages`);
}
outputLine();

// Most active month of the year
const messagesPerMonth = {};
messages.forEach((message) => {
    if (!messagesPerMonth[message.month]) {
        messagesPerMonth[message.month] = 0;
    }
    messagesPerMonth[message.month]++;
});
// show top
top = Object.entries(messagesPerMonth).sort((a, b) => b[1] - a[1]);
outputLine(`Top active months of the year:`);
for (const [month, count] of top) {
    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    outputLine(`${months[month - 1]} - ${count} messages`);
}
outputLine();

// Members who joined
outputLine("Members who joined:", addedMembers.size, "\n");

// Total number of words sent, average number of words per message, most common words
let totalWords = 0;
let messagesWithWords = 0;
const words = {};
const uncommonWords = {};
messages.forEach((message) => {
    const ignore = ["This message was deleted", "<This message was edited>", "omitted"];
    if (ignore.some((i) => message.text.includes(i))) {
        return;
    }
    const messageWords = message.text.split(/\s+/);
    for (const word of messageWords) {
        // remove punctuation from either side of the word and make it lowercase
        const cleanWord = word
            .toLowerCase()
            .replace(/^[^a-z']+/g, "")
            .replace(/[^a-z']+$/g, "");
        // ignore words that contain anything other than letters and apostrophes
        if (!/^[a-z'’]+$/.test(cleanWord)) {
            continue;
        }
        if (!words[cleanWord]) {
            words[cleanWord] = 0;
            if (!commonWords.has(cleanWord)) {
                uncommonWords[cleanWord] = 0;
            }
        }
        words[cleanWord]++;
        if (!commonWords.has(cleanWord)) {
            uncommonWords[cleanWord]++;
        }
    }
    messagesWithWords++;
    totalWords += messageWords.length;
});
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
const emojiPerSender = {};
const emojis = {};
const emojiRegex = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;
messages.forEach((message, i) => {
    if (!emojiPerSender[message.sender]) {
        emojiPerSender[message.sender] = "";
    }
    const emojisInMessage = [];
    const graphemes = splitter.splitGraphemes(message.text);
    for (const grapheme of graphemes) {
        if (emojiRegex.test(grapheme)) {
            emojisInMessage.push(grapheme);
            if (!emojis[grapheme]) {
                emojis[grapheme] = 0;
            }
            emojis[grapheme]++;
        }
    }
    emojiPerSender[message.sender] += emojisInMessage.join("");
    messages[i].emojis = emojisInMessage.join("");
});
// show top senders
top = Object.entries(emojiPerSender)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, TOP_COUNT);
outputLine(`Top emoji senders:`);
for (const [sender, emojis] of top) {
    outputLine(`${sender} - ${emojis.length} emojis`);
}
outputLine();
// show top emojis
top = Object.entries(emojis)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_COUNT);
outputLine(`Top emojis:`);
for (const [emoji, count] of top) {
    outputLine(`${emoji} - ${count} times`);
}
outputLine();

// save messages as json
require("fs").writeFileSync(`${outputDir}/messages.json`, JSON.stringify(messages, null, 4));

// save messages as csv
if (messages.length) {
    const headers = Object.keys(messages[0]);
    const csv = [headers.join(",")];
    // write each row, but take into account that some messages may have quotes, commas, or newlines
    for (const message of messages) {
        const row = [];
        for (const header of headers) {
            let value = message[header];
            if (typeof value === "string") {
                value = value.replace(/"/g, '""');
                if (value.includes(",") || value.includes("\n")) {
                    value = `"${value}"`;
                }
            }
            row.push(value);
        }
        csv.push(row.join(","));
    }
    require("fs").writeFileSync(`${outputDir}/messages.csv`, csv.join("\n"));
}
