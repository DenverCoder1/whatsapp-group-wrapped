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
    return /^(\d{1,2})\/(\d{1,2})\/(\d{2}), (\d{1,2}):(\d{2})(?: (AM|PM))? (?:- ([^:]+)(?::) )?/;
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
    } else if (chatFormat === 3 || chatFormat === 4) {
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
    if (tagToName && /[\d\s+-]/.test(sender) && tagToName[`@${senderDigits}`]) {
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
    // Member joins - multilingual patterns
    const joinPatterns = [
        // English
        `added ${message.sender}`,
        "joined using this group's invite link",
        `${message.sender} was added`,
        "joined using a group link",
        // Spanish
        `añadió a ${message.sender}`,
        "se unió usando el enlace de invitación",
        // German
        `hat ${message.sender} hinzugefügt`,
        "ist über Gruppeneinladungslink beigetreten",
        // French
        `a ajouté ${message.sender}`,
        "a rejoint via le lien d'invitation",
        // Italian
        `ha aggiunto ${message.sender}`,
        "entrato tramite link di invito",
        // Portuguese
        `adicionou ${message.sender}`,
        "entrou usando o link de convite",
        // Russian
        `добавил(а) ${message.sender}`,
        "присоединился(лась) по ссылке",
        // Hebrew
        `צירף/ה את`,
        `הצטרף/ה לקבוצה`,
        `נוספ/ה`,
    ];

    if (
        new RegExp(joinPatterns.map(regexEscape).join("|")).test(message.text) ||
        (!message.sender && message.text.includes("added"))
    ) {
        return "member_joined";
    }

    // Member leaves - multilingual patterns
    const leavePatterns = [
        // English
        `${message.sender} left`,
        `${message.sender} was removed`,
        // Spanish
        `${message.sender} salió`,
        `${message.sender} fue eliminado`,
        // German
        `${message.sender} hat die Gruppe verlassen`,
        `${message.sender} wurde entfernt`,
        // French
        `${message.sender} est parti`,
        `${message.sender} a été retiré`,
        // Italian
        `${message.sender} è uscito`,
        `${message.sender} è stato rimosso`,
        // Portuguese
        `${message.sender} saiu`,
        `${message.sender} foi removido`,
        // Russian
        `${message.sender} вышел(ла)`,
        `${message.sender} был(а) удален(а)`,
        // Hebrew
        `הוסר/ה`,
        `יצא/ה`,
    ];

    if (
        new RegExp(leavePatterns.map(regexEscape).join("|")).test(message.text) ||
        (!message.sender && message.text.includes("left"))
    ) {
        return "member_left";
    }

    // Pinned messages - multilingual patterns
    const pinnedPatterns = [
        "pinned a message",
        "fijó un mensaje", // Spanish
        "hat eine Nachricht angepinnt", // German
        "a épinglé un message", // French
        "ha fissato un messaggio", // Italian
        "fixou uma mensagem", // Portuguese
        "закрепил(а) сообщение", // Russian
        "הודעה הוצמדה על ידי", // Hebrew
    ];

    if (pinnedPatterns.some(pattern => message.text.includes(pattern))) {
        return "pinned_message";
    }

    // Encryption message - multilingual patterns
    const encryptionPatterns = [
        "Messages and calls are end-to-end encrypted",
        "Los mensajes y las llamadas están cifrados de extremo a extremo", // Spanish
        "Nachrichten und Anrufe sind Ende-zu-Ende-verschlüsselt", // German
        "Les messages et les appels sont chiffrés de bout en bout", // French
        "I messaggi e le chiamate sono crittografati end-to-end", // Italian
        "As mensagens e as chamadas têm encriptação de ponta a ponta", // Portuguese
        "Сообщения и звонки защищены сквозным шифрованием", // Russian
        "הודעות ושיחות מוצפנות מקצה לקצה", // Hebrew
    ];

    // Other system messages - multilingual patterns
    const systemPatterns = [
        `${message.sender} left`,
        `${message.sender} was removed`,
        "changed this group's icon",
        "changed to +",
        "changed the subject from",
        "changed their phone number",
        "changed the group description",
        "changed this group's settings",
        "deleted this group's icon",
        "deleted this group's description",
        "removed the group description",
        "turned on admin approval",
        `${message.sender} created this group`,
        `${message.sender} pinned a message`,
        // Spanish
        "cambió el ícono del grupo",
        "cambió el asunto",
        "cambió la descripción del grupo",
        "eliminó el ícono del grupo",
        "creó el grupo",
        // German
        "hat das Gruppenbild geändert",
        "hat den Betreff geändert",
        "hat die Gruppenbeschreibung geändert",
        "hat die Gruppe erstellt",
        // French
        "a changé l'icône du groupe",
        "a changé le sujet",
        "a changé la description du groupe",
        "a créé le groupe",
        // Italian
        "ha cambiato l'immagine del gruppo",
        "ha cambiato l'oggetto",
        "ha cambiato la descrizione del gruppo",
        "ha creato il gruppo",
        // Portuguese
        "alterou o ícone do grupo",
        "alterou o assunto",
        "alterou a descrição do grupo",
        "criou o grupo",
        // Russian
        "изменил(а) значок группы",
        "изменил(а) название",
        "изменил(а) описание группы",
        "создал(а) группу",
        // Hebrew
        `שינה/תה את תמונת הקבוצה`,
        `שינה/תה את נושא הקבוצה`,
        `שינה/תה את תיאור הקבוצה`,
        `שינה/תה את הגדרות הקבוצה`,
        `מחק/ה את תמונת הקבוצה`,
        `מחק/ה את תיאור הקבוצה`,
        `יצר/ה את הקבוצה`,
        `תיאור הקבוצה השתנה`,
        `החליף/ה את תמונת קבוצה`,
        `הטיימר של ההודעות`,
        `מצב הודעות זמניות`,
    ];

    if (
        new RegExp([...encryptionPatterns, ...systemPatterns].map(regexEscape).join("|")).test(message.text) ||
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
    // Comprehensive multilingual media patterns
    const patterns = [
        // English
        "<media omitted>", "<image omitted>", "image omitted", "<video omitted>", "video omitted",
        "<document omitted>", "document omitted", "<audio omitted>", "audio omitted",
        "<GIF omitted>", "GIF omitted", "<sticker omitted>", "sticker omitted",
        // Spanish
        "<multimedia omitido>", "<Archivo omitido>", "<imagen omitida>", "imagen omitida",
        "<video omitido>", "video omitido", "<documento omitido>", "documento omitido",
        "<audio omitido>", "audio omitido", "<GIF omitido>", "GIF omitido",
        "<sticker omitido>", "sticker omitido",
        // Italian
        "<media omessi>", "<Media omesso>", "<immagine omessa>", "immagine omessa",
        "<video omesso>", "video omesso", "<documento omesso>", "documento omesso",
        "<audio omesso>", "audio omesso", "<GIF esclusa>", "GIF esclusa",
        "<sticker non incluso>", "sticker non incluso",
        // Hebrew
        "<המדיה לא נכללה>", "<מדיה הושמטה>",
        // German
        "<medien ausgeschlossen>", "<Medien weggelassen>",
        // French
        "<médias omis>", "<Fichier omis>",
        // Portuguese
        "<ficheiro não revelado>", "<Mídia omitida>",
        // Russian
        "<без медиафайлов>", "<Файл пропущен>",
        // Arabic
        "<تم استبعاد الوسائط>", "<تم استبعاد الوسائط>",
        // Chinese
        "<忽略多媒體檔>", "<省略多媒体文件>",
        // Japanese
        "<メディアなし>", "<メディアは含まれていません>",
        // Korean
        "<미디어 파일 제외됨>", "<미디어 파일을 생략한 대화내용>",
        // Dutch
        "<media weggelaten>", "<Media weggelaten>",
        // Polish
        "<pominięto multimedia>", "<pliki pominięto>",
        // Turkish
        "<medya dahil edilmedi>", "<Medya atlanmış>",
        // Hindi
        "<मीडिया के बिना>",
        // Bengali
        "<মিডিয়া বাদ দেওয়া হয়েছে>", "<মিডিয়া বাদ দেওয়া হয়েছে>",
        // Indonesian
        "<media tidak disertakan>",
        // Vietnamese
        "<bỏ qua tệp phương tiện>", "<Bỏ qua Media>",
        // Thai
        "<ไฟล์สื่อถูกลบ>", "<สื่อถูกลบ>",
        // Swedish
        "<media utelämnat>", "<Media har utelämnats>",
        // Norwegian
        "<media utelatt>", "<Uten vedlegg>",
        // Danish
        "<medier udeladt>", "<Mediefil udeladt>",
        // Finnish
        "<media jätettiin pois>", "<Media jätetty pois>",
        // Czech
        "<média vynechány>", "< Média vynechána >",
        // Hungarian
        "<média elhagyva>", "<Hiányzó médiafájl>",
        // Romanian
        "<conținut media omis>",
        // Ukrainian
        "<медіа пропущено>",
        // Greek
        "<αρχείο παραλήφθηκε>", "<Εξαίρεση πολυμέσων>",
        // Bulgarian
        "<Без файл>",
        // Serbian
        "<медији су изостављени>",
        // Croatian
        "<medijski zapis izostavljen>", "<Medijski zapis izostavljen>",
        // Slovak
        "<Médiá vynechané>",
        // Slovenian
        "<datoteke izpuščene>", "<Medij izpuščen>",
        // Lithuanian
        "<medija praleista>", "<Praleistas medijos turinys>",
        // Latvian
        "<nav iekļauta multivide>", "<Bez multivides>",
        // Estonian
        "<meedia välja jäetud>", "<Meedia ära jäetud>",
        // Afrikaans
        "<media weggelaat>",
        // Swahili
        "<media hazijajumuishwa>", "<Media imerukwa>",
        // Filipino/Tagalog
        "<ınalis ang media>", "<Walang kalakip na media>",
        // Malay
        "<media dikecualikan>", "<Media disingkirkan>",
        // Tamil
        "<கோப்புகள் விடப்பட்டன>", "< ஊடகங்கள் நீக்கப்பட்டது >",
        // Telugu
        "<మీడియా విస్మరించబడింది>", "<మాధ్యమం విస్మరించబడింది>",
        // Kannada
        "<ಮಾಧ್ಯಮ ಕೈಬಿಡಲಾಗಿದೆ>",
        // Malayalam
        "<മീഡിയ ഒഴിവാക്കി>",
        // Marathi
        "<मीडिया वगळण्यात आला>", "<मीडिया वगळले>",
        // Gujarati
        "<મિડિયા છોડી મૂકાયું>", "<મીડિયા અવગણવામાં આવ્યા>",
        // Punjabi
        "<ਮੀਡੀਆ ਛੱਡਿਆ>", "<ਮੀਡੀਆ ਛਡਿਆ ਗਿਆ>",
        // Urdu
        "<میڈیا چھوڑ دیا گیا>", "<میڈیا ہٹا دیا گیا>",
        // Persian/Farsi
        "<رسانه حذف شد>", "< پيوست نما/آهنگ حذف شد >",
        // Azerbaijani
        "<media buraxıldı>", "<Media çıxarılmışdır>",
        // Kazakh
        "<файлдар қосылмаған>", "<Файл қосылған жоқ>",
        // Uzbek
        "<fayl o'tkazib yuborildi>",
        // Macedonian
        "<без фајлови>", "<Без фајл>",
        // Albanian
        "<media u hoq>", "<Media hequr>",
        // Catalan
        "<fitxers multimèdia omesos>", "<Mitjans omesos>",
        // Lao
        "<ບໍ່ລວມມີເດຍ>",
    ];
    return patterns.some(pattern => text.toLowerCase().includes(pattern.toLowerCase()));
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
    // Remove edited message indicators in multiple languages
    const editedPatterns = [
        "<This message was edited>",
        "<Este mensaje fue editado>", // Spanish
        "<Diese Nachricht wurde bearbeitet>", // German
        "<Ce message a été modifié>", // French
        "<Questo messaggio è stato modificato>", // Italian
        "<Esta mensagem foi editada>", // Portuguese
        "<Это сообщение изменено>", // Russian
        "<ההודעה נערכה>", // Hebrew
    ];
    
    let cleanedText = text;
    for (const pattern of editedPatterns) {
        cleanedText = cleanedText.replaceAll(new RegExp(String.raw`\s+${regexEscape(pattern)}`, "g"), "");
    }
    
    const messageWords = cleanedText.split(/\s+/);
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
        // Remove various bad characters: NNBSP, LRM, LTR mark, RLM, etc.
        const chat = chatFile.content.toString("utf8").replaceAll(/[\u202a\u200e\u202c\xa0\u202f\u200f]/g, " ");
        return { chat, fileName: chatFile.filename };
    } else {
        // Remove various bad characters: NNBSP, LRM, LTR mark, RLM, etc.
        const chat = fs.readFileSync(filePath, "utf8").replaceAll(/[\u202a\u200e\u202c\xa0\u202f\u200f]/g, " ");
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
    
    // Multilingual filename patterns
    const patterns = [
        // English
        /WhatsApp[_ ]Chat[_ ]with[_ ](.+?)(?:[_ ]\(\d+\))?\.(txt|zip)$/i,
        /WhatsApp[_ ]Chat[_ ]-[_ ](.+?)(?:[_ ]\(\d+\))?\.(txt|zip)$/i,
        // Spanish
        /Chat[_ ]de[_ ]WhatsApp[_ ]con[_ ](.+?)(?:[_ ]\(\d+\))?\.(txt|zip)$/i,
        // Russian
        /Чат[_ ]WhatsApp[_ ]с[_ ](.+?)(?:[_ ]\(\d+\))?\.(txt|zip)$/i,
        // Italian
        /Chat[_ ]WhatsApp[_ ]con[_ ](.+?)(?:[_ ]\(\d+\))?\.(txt|zip)$/i,
        // Portuguese
        /Conversa[_ ](?:no|do)[_ ]WhatsApp[_ ]com[_ ](.+?)(?:[_ ]\(\d+\))?\.(txt|zip)$/i,
        // German
        /WhatsApp[_ ]Chat[_ ]mit[_ ](.+?)(?:[_ ]\(\d+\))?\.(txt|zip)$/i,
        // French
        /Discussion[_ ]WhatsApp[_ ]avec[_ ](.+?)(?:[_ ]\(\d+\))?\.(txt|zip)$/i,
        // Hebrew
        /\u05e6['׳]?\u05d0\u05d8[_ ]WhatsApp[_ ]\u05e2\u05dd[_ ](.+?)(?:[_ ]\(\d+\))?\.(txt|zip)$/i,
    ];
    
    for (const pattern of patterns) {
        const match = pattern.exec(fileName);
        if (match) {
            // Replace underscores with spaces and trim
            return match[1].replaceAll("_", " ").trim();
        }
    }
    
    return "";
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
            // English
            message.text === "This message was deleted" ||
            message.text === "You deleted this message" ||
            // Spanish
            message.text === "Este mensaje fue eliminado" ||
            message.text === "Eliminaste este mensaje" ||
            // German
            message.text === "Diese Nachricht wurde gelöscht" ||
            message.text === "Du hast diese Nachricht gelöscht" ||
            // French
            message.text === "Ce message a été supprimé" ||
            message.text === "Vous avez supprimé ce message" ||
            // Italian
            message.text === "Questo messaggio è stato eliminato" ||
            message.text === "Hai eliminato questo messaggio" ||
            // Portuguese
            message.text === "Esta mensagem foi apagada" ||
            message.text === "Você apagou esta mensagem" ||
            // Russian
            message.text === "Это сообщение удалено" ||
            message.text === "Вы удалили это сообщение" ||
            // Hebrew (with directional marks removed)
            message.text.replaceAll(/[\u200e\u200f]/g, "") === "הודעה זו נמחקה" ||
            message.text.replaceAll(/[\u200e\u200f]/g, "") === "מחקת הודעה זו";

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
            // Skip messages with media in any language (use hasMedia function)
            if (hasMedia(message.text)) {
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
    // Pattern matches filenames with word chars, spaces, dots, parens, ampersands, hyphens, apostrophes
    const vcfPattern = /([\w\s.()&'-]+\.vcf)/gi;

    // Track generic contact filenames (e.g., "2 contacts.vcf") and skip if they appear multiple times
    // We can't actually know if they are the same file or different files with the same generic name
    const contactKeywords = [
        "contacts",
        "contatti", // Italian
        "אנשי קשר", // Hebrew
    ];
    const genericContactPattern = new RegExp(String.raw`^(\d+\s+)?(${contactKeywords.map(regexEscape).join("|")})\.vcf$`, "i");
    const genericFileOccurrences = new Map();

    for (const message of messages) {
        if (!message.text) continue;
        const matches = message.text.matchAll(vcfPattern);
        for (const match of matches) {
            const filename = match[1].trim();
            if (!vcfFileMap.has(filename)) {
                continue;
            }

            // Check if this is a generic contact filename
            if (genericContactPattern.test(filename)) {
                const count = (genericFileOccurrences.get(filename) || 0) + 1;
                genericFileOccurrences.set(filename, count);
                // Skip if this generic filename appears more than once
                if (count > 1) {
                    continue;
                }
            }

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
