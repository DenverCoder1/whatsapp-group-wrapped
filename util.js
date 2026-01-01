const GraphemeSplitter = require("./grapheme-splitter.min.js");
const splitter = new GraphemeSplitter();

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
    let chatFormat = type1Matches > type2Matches ? 1 : 2;
    return type3Matches > type1Matches ? 3 : chatFormat;
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
        new RegExp([`${message.sender} left`, `${message.sender} was removed`].map(regexEscape).join("|")).test(
            message.text
        ) ||
        (!message.sender && message.text.includes("left"))
    ) {
        return "member_left";
    }
    
    // Pinned messages
    if (message.text.endsWith("pinned a message")) {
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
            ]
                .map(regexEscape)
                .join("|")
        ).test(message.text)
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
    return /<Media omitted>|image omitted|video omitted|sticker omitted|GIF omitted/.test(text);
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
    const messageWords = text.replaceAll(/\s+<This message was edited>/g, "").split(/\s+/);
    const cleanWords = [];
    
    for (const word of messageWords) {
        // Remove punctuation from either side of the word and make it lowercase
        const cleanWord = word
            .toLowerCase()
            .replaceAll(/^[^a-z']+/g, "")
            .replaceAll(/[^a-z']+$/g, "")
            .replaceAll("'", "'");
        // Ignore words that contain anything other than letters and apostrophes
        if (/^[a-z']+$/.test(cleanWord)) {
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
};
