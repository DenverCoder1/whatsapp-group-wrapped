const GraphemeSplitter = require("./grapheme-splitter.min.js");
const splitter = new GraphemeSplitter();
const path = require("node:path");

/**
 * Escape special regex characters in a string
 */
function regexEscape(str) {
    return str.replaceAll(/[-/\\^$*+?.()|[\]{}]/g, String.raw`\$&`);
}

/**
 * Detect the format of WhatsApp chat export
 * @param {string} chat - The chat content
 * @returns {number} - Format type (1, 2, or 3)
 */
function detectChatFormat(chat) {
    const type1Matches = (chat.match(/^\d{1,2}\/\d{1,2}\/\d{2}, \d{2}:\d{2}(?: (?:AM|PM))?/gm) || []).length;
    const type2Matches = (chat.match(/^\[\d{4}-\d{2}-\d{2}, \d{1,2}:\d{2}:\d{2} (?:AM|PM)\]/gm) || []).length;
    const type3Matches = (chat.match(/^\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}/gm) || []).length;
    const type4Matches = (chat.match(/^\d{1,2}\.\d{1,2}\.\d{4}, \d{1,2}:\d{2}/gm) || []).length;
    let chatFormat = type1Matches > type2Matches ? 1 : 2;
    if (type3Matches > type1Matches) chatFormat = 3;
    if (type4Matches > type3Matches) chatFormat = 4;
    return chatFormat;
}

/**
 * Get the regex pattern for detecting start of messages based on chat format
 * @param {number} chatFormat - The detected chat format
 * @returns {RegExp} - The regex pattern
 */
function getMessageRegex(chatFormat) {
    if (chatFormat === 2) {
        return /^ ?\[(\d{4})-(\d{2})-(\d{2}), (\d{1,2}):(\d{2}):(\d{2}) (AM|PM)\] (.*?): /;
    } else if (chatFormat === 3) {
        return /^(\d{1,2})\/(\d{1,2})\/(\d{4}), (\d{1,2}):(\d{2}) (?:- ([^:]+)(?::) )?/;
    } else if (chatFormat === 4) {
        return /^(\d{1,2})\.(\d{1,2})\.(\d{4}), (\d{1,2}):(\d{2}) (?:- ([^:]+)(?::) )?/;
    }
    return /^(\d{1,2})\/(\d{1,2})\/(\d{2}), (\d{2}):(\d{2})(?: (AM|PM))? (?:- ([^:]+)(?::) )?/;
}

/**
 * Parse message metadata from regex match
 * @param {Array} match - Regex match array
 * @param {number} chatFormat - The detected chat format
 * @param {Object} tagToName - Mapping of phone tags to names
 * @returns {Object} - Parsed message metadata
 */
function parseMessageMatch(match, chatFormat, tagToName) {
    let year, month, day, hour, minute, sender;

    if (chatFormat === 2) {
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
    } else if (chatFormat === 3) {
        year = Number(match[3]);
        day = Number(match[1]);
        month = Number(match[2]);
        hour = Number(match[4]);
        minute = Number(match[5]);
        sender = match[6];
    } else if (chatFormat === 4) {
        year = Number(match[3]);
        day = Number(match[1]);
        month = Number(match[2]);
        hour = Number(match[4]);
        minute = Number(match[5]);
        sender = match[6];
    } else {
        year = Number("20" + match[3]);
        day = Number(match[2]);
        month = Number(match[1]);
        hour = Number(match[4]);
        minute = Number(match[5]);
        if (match[6] === "PM" && hour !== 12) {
            hour += 12;
        } else if (match[6] === "AM" && hour === 12) {
            hour = 0;
        }
        sender = match[7];
    }

    // Convert phone numbers to names if found
    const senderDigits = (sender ?? "").replaceAll(/\D/g, "");
    if (/[\d\s+-]/.test(sender) && tagToName[`@${senderDigits}`]) {
        sender = tagToName[`@${senderDigits}`];
    }

    return { year, month, day, hour, minute, sender };
}

/**
 * Check if a message is a system message that should be filtered
 * @param {Object} message - The message object
 * @returns {string|null} - Type of system message or null
 */
function getSystemMessageType(message) {
    // Member joins
    if (
        new RegExp(
            [
                `added ${message.sender}`,
                "joined using this group's invite link",
                `${message.sender} was added`,
                "joined using a group link",
                // Hebrew patterns
                `צירף/ה את`, // added (Hebrew)
                `הצטרף/ה לקבוצה`, // joined the group (Hebrew)
                `נוספ/ה`, // was added (Hebrew)
            ]
                .map(regexEscape)
                .join("|")
        ).test(message.text) ||
        (!message.sender && message.text.includes("added"))
    ) {
        return "member_joined";
    }

    // Member leaves
    if (
        new RegExp(
            [
                `${message.sender} left`,
                `${message.sender} was removed`,
                // Hebrew patterns
                `הוסר/ה`, // was removed (Hebrew)
                `יצא/ה`, // left (Hebrew)
            ]
                .map(regexEscape)
                .join("|")
        ).test(message.text) ||
        (!message.sender && message.text.includes("left"))
    ) {
        return "member_left";
    }

    // Pinned messages
    if (message.text.endsWith("pinned a message") || message.text.includes("הודעה הוצמדה על ידי")) {
        return "pinned_message";
    }

    // Other system messages
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
                `removed the group description`,
                `turned on admin approval to join this group`,
                `${message.sender} created this group`,
                `Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.`,
                `${message.sender} pinned a message`,
                // Hebrew patterns - TODO: verify if these are accurate
                `שינה/תה את תמונת הקבוצה`, // changed group icon
                `שינה/תה את נושא הקבוצה`, // changed group subject
                `שינה/תה את תיאור הקבוצה`, // changed group description
                `שינה/תה את הגדרות הקבוצה`, // changed group settings
                `מחק/ה את תמונת הקבוצה`, // deleted group icon
                `מחק/ה את תיאור הקבוצה`, // deleted group description
                `יצר/ה את הקבוצה`, // created the group
                `הודעות ושיחות מוצפנות מקצה לקצה`, // encryption message
                `תיאור הקבוצה השתנה`, // group description changed
                `החליף/ה את תמונת קבוצה`, // changed group picture
                `הטיימר של ההודעות`, // message timer
                `מצב הודעות זמניות`, // temporary messages mode
            ]
                .map(regexEscape)
                .join("|")
        ).test(message.text) ||
        !message.sender
    ) {
        return "other_system";
    }

    return null;
}

/**
 * Check if a message contains a question
 * @param {string} text - Message text
 * @returns {boolean}
 */
function isQuestion(text) {
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
        "poll:",
    ];

    return (
        /\?(?:\s|$)/.test(text) ||
        new RegExp(questionPhrases.map(regexEscape).join("|")).test(text) ||
        questionIfFirstWord.some((w) => new RegExp(String.raw`^${w}\s`, "i").test(text)) ||
        ["who", "what", "where", "when", "why", "how"].includes(text.toLowerCase())
    );
}

/**
 * Check if a message contains media
 * @param {string} text - Message text
 * @returns {boolean}
 */
function hasMedia(text) {
    const patterns = [
        "<Media omitted>",
        "image omitted",
        "video omitted",
        "sticker omitted",
        "GIF omitted",
        // Hebrew patterns
        "<המדיה לא נכללה>", // Hebrew: <Media not included>
    ];
    return new RegExp(patterns.map(regexEscape).join("|")).test(text);
}

/**
 * Extract tags from message text
 * @param {string} text - Message text
 * @returns {Array<string>} - Array of unique tags
 */
function extractTags(text) {
    const tags = text.match(/@(?:\d{10,}|\u2068[^\u2069]+\u2069)/g);
    return [...new Set(tags || [])];
}

/**
 * Extract emojis from message text
 * @param {string} text - Message text
 * @returns {Array<string>} - Array of emojis
 */
function extractEmojis(text) {
    const emojiRegex = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;
    const emojisInMessage = [];
    const graphemes = splitter.splitGraphemes(text);
    for (const grapheme of graphemes) {
        if (emojiRegex.test(grapheme)) {
            emojisInMessage.push(grapheme);
        }
    }
    return emojisInMessage;
}

/**
 * Clean and extract words from message text, returns all words and the cleaned ones separately
 * @param {string} text - Message text
 * @returns {[Array<string>, Array<string>]} - Array of all words and array of cleaned words
 */
function extractWords(text) {
    const messageWords = text
        .replaceAll(/\s+<This message was edited>/g, "")
        .replaceAll(/\s+<ההודעה נערכה>/g, "") // Hebrew: message was edited
        .split(/\s+/);
    const cleanWords = [];

    for (const word of messageWords) {
        // Remove punctuation from either side of the word and make it lowercase
        // Support Unicode letters (Latin, Hebrew, Arabic, Cyrillic, etc.)
        const cleanWord = word
            .toLowerCase()
            .replaceAll(/^[^\p{L}']+/gu, "")
            .replaceAll(/[^\p{L}']+$/gu, "")
            .replaceAll("'", "'");
        // Ignore words that contain anything other than letters (any script) and apostrophes
        // Also ignore single quotes by themselves
        if (/^[\p{L}']+$/u.test(cleanWord) && cleanWord !== "'") {
            cleanWords.push(cleanWord);
        }
    }

    return [messageWords, cleanWords];
}

/**
 * Get top N items from an object by value
 * @param {Object} obj - Object to sort
 * @param {number} count - Number of top items to return
 * @returns {Array<[string, any]>} - Array of [key, value] pairs
 */
function getTopEntries(obj, count) {
    return Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, count);
}

/**
 * Parse a VCF file and extract phone numbers and names
 * @param {string} vcfContent - Content of a VCF file
 * @returns {Array<{phone: string, name: string}>} Array of contacts
 */
function parseVcf(vcfContent) {
    const contacts = [];
    const vcards = vcfContent.split(/(?=BEGIN:VCARD)/);

    for (const vcard of vcards) {
        if (!vcard.trim()) continue;

        let name = "";
        let phone = "";

        // Extract FN (formatted name) - this is usually the display name
        const fnMatch = /FN:(.*)/.exec(vcard);
        if (fnMatch) {
            name = fnMatch[1].trim();
        }

        // Extract phone number from TEL field
        const telMatch = /TEL[^:]*:([+\d\s\-()]+)/.exec(vcard);
        if (telMatch) {
            // Normalize phone number - remove spaces, dashes, parentheses
            phone = telMatch[1].replaceAll(/[\s\-()]/g, "");
        }

        if (phone && name) {
            contacts.push({ phone, name });
        }
    }

    return contacts;
}

/**
 * Generate the wrapped title based on date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {string} - Title string
 */
function getWrappedTitle(startDate, endDate) {
    const startMonth = startDate.getMonth() + 1;
    const startDay = startDate.getDate();
    const endMonth = endDate.getMonth() + 1;
    const endDay = endDate.getDate();
    const year = startDate.getFullYear();

    // Check if it's a full year (Jan 1 to Dec 31)
    if (startMonth === 1 && startDay === 1 && endMonth === 12 && endDay === 31) {
        return `WhatsApp Group Wrapped ${year}`;
    } else {
        return `WhatsApp Group Wrapped ${startMonth}/${startDay}/${year} - ${endMonth}/${endDay}/${endDate.getFullYear()}`;
    }
}

/**
 * Load chat content from file (supports .txt and .zip)
 * @param {string} filePath - Path to the file
 * @param {Function} extractFirstFileByExtension - Function to extract from ZIP
 * @returns {{chat: string, fileName: string}} - Chat content and file name
 */
function loadChatFile(filePath, extractFirstFileByExtension) {
    const fs = require("node:fs");

    if (filePath.toLowerCase().endsWith(".zip")) {
        const chatFile = extractFirstFileByExtension(filePath, ".txt");
        const chat = chatFile.content.toString("utf8").replaceAll(/[\u202f\u200e]/g, " ");
        return { chat, fileName: chatFile.filename };
    } else {
        const chat = fs.readFileSync(filePath, "utf8").replaceAll(/[\u202f\u200e]/g, " ");
        return { chat, fileName: filePath };
    }
}

/**
 * Extract group name from WhatsApp chat file name
 * @param {string} fileName - The chat file name
 * @returns {string} - Extracted group name or empty string
 */
function extractGroupName(fileName) {
    fileName = path.basename(fileName);
    const match = fileName.match(/WhatsApp Chat with (.+?)(?: \(\d+\))?\.txt$/);
    return match ? match[1] : "";
}

/**
 * Parse chat content into message objects
 * @param {string} chat - The chat content
 * @param {number} chatFormat - Detected chat format
 * @param {Object} tagToName - Mapping of phone tags to names
 * @param {Object} filters - Date filters
 * @returns {Object} - Parsed messages and metadata
 */
function parseChatMessages(chat, chatFormat, tagToName, filters) {
    const startOfMessageRegex = getMessageRegex(chatFormat);
    const messages = [];
    let currentMessage = null;
    const addedMembers = new Set();
    const leftMembers = new Set();
    let pinnedMessages = 0;

    function addMessage(message) {
        // filter by date
        if (message.date < filters.startDate || message.date > filters.endDate) {
            return;
        }

        // Check for system messages
        const systemType = getSystemMessageType(message);
        if (systemType === "member_joined") {
            addedMembers.add(message.sender ?? message.text);
            return;
        }
        if (systemType === "member_left") {
            leftMembers.add(message.sender ?? message.text);
            return;
        }
        if (systemType === "pinned_message") {
            pinnedMessages++;
            return;
        }
        if (systemType === "other_system") {
            return;
        }

        message.deleted =
            message.text === "null" ||
            message.text === "This message was deleted" ||
            message.text.replaceAll(/[\u200e\u200f]/g, "") === "הודעה זו נמחקה"; // Hebrew: This message was deleted

        messages.push(message);
    }

    for (const line of chat.split("\n")) {
        const match = startOfMessageRegex.exec(line);
        if (match) {
            if (currentMessage) {
                addMessage(currentMessage);
                currentMessage = null;
            }

            const { year, month, day, hour, minute, sender } = parseMessageMatch(match, chatFormat, tagToName);

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
            // If message text is empty or only whitespace, mark as deleted by admin
            if (currentMessage.text.trim() === "") {
                currentMessage.text = "null";
            }
        } else if (currentMessage) {
            currentMessage.text += "\n" + line;
        }
    }

    if (currentMessage) {
        addMessage(currentMessage);
    }

    return { messages, addedMembers, leftMembers, pinnedMessages };
}

/**
 * Enrich messages with additional metadata (media, questions, tags, emojis)
 * @param {Array} messages - Array of message objects
 * @returns {Object} - Enriched data with per-sender statistics
 */
function enrichMessages(messages) {
    const mediaPerSender = {};
    const questionsPerSender = {};
    const tagsPerSender = {};
    const emojiPerSender = {};
    const emojis = {};
    let totalMedia = 0;

    messages.forEach((message, i) => {
        // Initialize sender stats
        if (!(message.sender in mediaPerSender)) {
            mediaPerSender[message.sender] = 0;
            questionsPerSender[message.sender] = 0;
            tagsPerSender[message.sender] = 0;
            emojiPerSender[message.sender] = "";
        }

        // Check for media
        const messageHasMedia = hasMedia(message.text);
        if (messageHasMedia) {
            mediaPerSender[message.sender]++;
            totalMedia++;
        }
        messages[i].media = messageHasMedia;

        // Check for questions
        const messageIsQuestion = isQuestion(message.text);
        if (messageIsQuestion) {
            questionsPerSender[message.sender]++;
        }
        messages[i].question = messageIsQuestion;

        // Extract tags
        const tags = extractTags(message.text);
        if (tags.length > 0) {
            tagsPerSender[message.sender] += tags.length;
        }
        messages[i].tags = tags;

        // Extract emojis
        const emojisInMessage = extractEmojis(message.text);
        for (const emoji of emojisInMessage) {
            if (!emojis[emoji]) {
                emojis[emoji] = 0;
            }
            emojis[emoji]++;
        }
        emojiPerSender[message.sender] += emojisInMessage.join("");
        messages[i].emojis = emojisInMessage.join("");
    });

    return {
        mediaPerSender,
        questionsPerSender,
        tagsPerSender,
        emojiPerSender,
        emojis,
        totalMedia,
    };
}

/**
 * Calculate word statistics from messages
 * @param {Array} messages - Array of message objects
 * @param {Set} commonWords - Set of common words to filter
 * @returns {Object} - Word statistics
 */
function calculateWordStats(messages, commonWords) {
    let totalWords = 0;
    let messagesWithWords = 0;
    const words = {};
    const uncommonWords = {};

    messages
        .filter((m) => !m.deleted)
        .forEach((message) => {
            if (
                [
                    "omitted",
                    "המדיה לא נכללה", // Hebrew: media omitted
                ].some((pattern) => message.text.includes(pattern))
            ) {
                return;
            }
            const [messageWords, cleanWords] = extractWords(message.text);
            for (const cleanWord of cleanWords) {
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

    return { totalWords, messagesWithWords, words, uncommonWords };
}

/**
 * Calculate taggees (who gets tagged most)
 * @param {Array} messages - Array of message objects with tags property
 * @returns {Object} - Object with tag as key and count as value
 */
function calculateTaggees(messages) {
    const taggees = {};
    messages.forEach((message) => {
        const tagsList = Array.isArray(message.tags) ? message.tags : [];
        for (const tag of tagsList) {
            if (!(tag in taggees)) {
                taggees[tag] = 0;
            }
            taggees[tag]++;
        }
    });
    return taggees;
}

/**
 * Calculate daily message average
 * @param {number} totalMessages - Total number of messages
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} - Average messages per day
 */
function calculateDailyAverage(totalMessages, startDate, endDate) {
    const days = (endDate - startDate) / (1000 * 60 * 60 * 24);
    return Math.round((totalMessages / days) * 100) / 100;
}

/**
 * Count unique senders
 * @param {Array} messages - Array of message objects
 * @returns {number} - Number of unique senders
 */
function countUniqueSenders(messages) {
    return new Set(messages.map((m) => m.sender)).size;
}

/**
 * Calculate messages per hour of day
 * @param {Array} messages - Array of message objects
 * @returns {Object} - Object with hour (0-23) as key and count as value
 */
function calculateMessagesPerHour(messages) {
    const messagesPerHour = {};
    messages.forEach((message) => {
        if (!(message.hour in messagesPerHour)) {
            messagesPerHour[message.hour] = 0;
        }
        messagesPerHour[message.hour]++;
    });
    return messagesPerHour;
}

/**
 * Calculate messages per day of week
 * @param {Array} messages - Array of message objects
 * @returns {Object} - Object with day (0-6, Sunday-Saturday) as key and count as value
 */
function calculateMessagesPerDayOfWeek(messages) {
    const messagesPerDay = {};
    messages.forEach((message) => {
        const day = message.date.getDay();
        if (!(day in messagesPerDay)) {
            messagesPerDay[day] = 0;
        }
        messagesPerDay[day]++;
    });
    return messagesPerDay;
}

/**
 * Calculate messages per month
 * @param {Array} messages - Array of message objects
 * @returns {Object} - Object with month (1-12) as key and count as value
 */
function calculateMessagesPerMonth(messages) {
    const messagesPerMonth = {};
    messages.forEach((message) => {
        if (!(message.month in messagesPerMonth)) {
            messagesPerMonth[message.month] = 0;
        }
        messagesPerMonth[message.month]++;
    });
    return messagesPerMonth;
}

/**
 * Get day name from day number
 * @param {number} day - Day number (0-6, Sunday-Saturday)
 * @returns {string} - Day name
 */
function getDayName(day) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[day];
}

/**
 * Get month name from month number
 * @param {number} month - Month number (1-12)
 * @returns {string} - Month name
 */
function getMonthName(month) {
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
    return months[month - 1];
}

/**
 * Analyze VCF files from a ZIP and count shared phone numbers
 * Only counts VCF files that were sent in messages within the date range
 * @param {string} zipFilePath - Path to the ZIP file
 * @param {Function} extractFilesByExtension - Function to extract files from ZIP
 * @param {Array} messages - Array of message objects to check for VCF references
 * @returns {Map<string, {count: number, names: Map<string, number>, mostCommonName: string}>}
 */
function analyzeVcfFiles(zipFilePath, extractFilesByExtension, messages) {
    const phoneStats = new Map();

    // Extract all VCF files from the ZIP
    const vcfFiles = extractFilesByExtension(zipFilePath, ".vcf");

    // Create a map of VCF filenames for easy lookup
    const vcfFileMap = new Map();
    for (const vcfFile of vcfFiles) {
        // Get just the filename without path
        const filename = vcfFile.filename.split("/").pop();
        vcfFileMap.set(filename, vcfFile);
    }

    // Find all messages that reference .vcf files and count each occurrence
    const vcfPattern = /([^/\\]+\.vcf)/gi;

    for (const message of messages) {
        if (!message.text) continue;
        const matches = message.text.matchAll(vcfPattern);
        for (const match of matches) {
            const filename = match[1];
            if (!vcfFileMap.has(filename)) continue;

            const vcfFile = vcfFileMap.get(filename);
            const contacts = parseVcf(vcfFile.content);

            // Count each contact in this VCF file as a share
            for (const contact of contacts) {
                if (!phoneStats.has(contact.phone)) {
                    phoneStats.set(contact.phone, {
                        count: 0,
                        names: new Map(),
                        mostCommonName: "",
                    });
                }

                const stats = phoneStats.get(contact.phone);
                stats.count++;

                // Track how many times each name is used for this phone number
                const nameCount = stats.names.get(contact.name) || 0;
                stats.names.set(contact.name, nameCount + 1);

                // Update most common name
                let maxCount = 0;
                let mostCommon = "";
                for (const [name, count] of stats.names) {
                    if (count > maxCount) {
                        maxCount = count;
                        mostCommon = name;
                    }
                }
                stats.mostCommonName = mostCommon;
            }
        }
    }

    return phoneStats;
}

/**
 * Generate CSV content from messages
 * @param {Array} messages - Array of message objects
 * @returns {string} - CSV content
 */
function generateCsv(messages) {
    if (messages.length === 0) {
        return "";
    }

    const headers = Object.keys(messages[0]);
    const csv = [headers.join(",")];

    // write each row, but take into account that some messages may have quotes, commas, or newlines
    for (const message of messages) {
        const row = [];
        for (const header of headers) {
            let value = message[header];
            if (typeof value === "string") {
                value = value.replaceAll('"', '""');
                if (value.includes(",") || value.includes("\n")) {
                    value = `"${value}"`;
                }
            }
            row.push(value);
        }
        csv.push(row.join(","));
    }

    return csv.join("\n");
}

/**
 * Create ASCII art banner with title and group name
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} groupName - Group name (optional)
 * @param {Object} i18n - Translation object (optional)
 * @returns {Array<string>} - Array of banner lines
 */
function createBanner(startDate, endDate, groupName, i18n = null) {
    const welcome = i18n ? i18n.t("messages.welcomeToYour") : "Welcome to Your";
    const title = getWrappedTitle(startDate, endDate);
    const lines = [];
    const boxWidth = 4 + Math.max(welcome.length, title.length, groupName ? groupName.length : 0, 46);

    lines.push(`╔${"═".repeat(boxWidth)}╗`);
    lines.push(`║${"".padStart(boxWidth)}║`);
    lines.push(`║${welcome.padStart((boxWidth + welcome.length) / 2).padEnd(boxWidth)}║`);
    lines.push(`║${title.padStart((boxWidth + title.length) / 2).padEnd(boxWidth)}║`);
    if (groupName) {
        lines.push(`║${groupName.padStart((boxWidth + groupName.length) / 2).padEnd(boxWidth)}║`);
    }
    lines.push(`║${"".padStart(boxWidth)}║`);
    lines.push(`╚${"═".repeat(boxWidth)}╝`);

    return lines;
}

module.exports = {
    regexEscape,
    detectChatFormat,
    getMessageRegex,
    parseMessageMatch,
    getSystemMessageType,
    isQuestion,
    hasMedia,
    extractTags,
    extractEmojis,
    extractWords,
    getTopEntries,
    parseVcf,
    getWrappedTitle,
    loadChatFile,
    extractGroupName,
    parseChatMessages,
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
    createBanner,
};
