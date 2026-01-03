/**
 * English translations
 */

module.exports = {
    // Language metadata
    code: 'en',
    name: 'English',
    rtl: false,
    
    // Pluralization rules
    pluralize: (count, singular, plural = null) => {
        if (count === 1) return singular;
        // Check for custom plural in unitPlurals
        if (plural) return plural;
        return singular + 's';
    },

    // Day names (0-6, Sunday-Saturday)
    days: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
    ],

    // Month names (0-11, January-December)
    months: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ],

    // Section headers
    sections: {
        topSenders: 'Top senders',
        topMediaSenders: 'Top media senders',
        topQuestionAskers: 'Top question askers',
        topTaggers: 'Top taggers',
        topTaggees: 'Top taggees',
        messageStats: 'Message Stats',
        memberStats: 'Member Stats',
        mostActiveHours: 'Most Active Hours',
        mostActiveDays: 'Most Active Days',
        mostActiveMonths: 'Most Active Months',
        topWords: 'Top Words',
        topUncommonWords: 'Top Uncommon Words',
        wordStats: 'Word Stats',
        topEmojiSenders: 'Top Emoji Senders',
        topEmojis: 'Top Emojis',
        topContactsShared: 'Top Contacts Shared'
    },

    // Unit labels
    units: {
        message: 'message',
        messageWithMedia: 'message with media',
        question: 'question',
        tag: 'tag',
        time: 'time',
        emoji: 'emoji'
    },

    // Plural overrides (when plural form is irregular)
    unitPlurals: {
        messageWithMedia: 'messages with media'
    },

    // Stats labels
    stats: {
        totalMessages: 'Total messages',
        messagesWithMedia: 'Messages with media',
        messagesDeleted: 'Messages deleted',
        messagesDeletedByAdmin: 'Messages deleted by admin',
        dailyAverage: 'Daily average',
        messageSenders: 'Message senders',
        membersJoined: 'Members joined',
        membersLeft: 'Members left',
        messagesPinned: 'Messages pinned',
        totalWordsent: 'Total words sent',
        wordsPerMessage: 'Words per message',
        numberOfUniqueEmojis: 'Number of unique emojis',
        uniquePhoneNumbers: 'Total unique phone numbers sent as contacts',
        contactsSharedByMultiple: 'Contacts shared by multiple people',
        contactsWithDifferentNames: 'Contacts with different names'
    },

    // Action verbs and descriptions
    actions: {
        asked: 'asked',
        sent: 'sent',
        tagged: 'tagged',
        shared: 'shared'
    },

    // Format strings (use {0}, {1}, etc. for placeholders)
    formats: {
        xMessages: '{count} {unit}',
        taggedXTime: 'tagged {count} {unit}',
        sharedXTime: 'shared {count} {unit}',
        topXMostShared: 'Top {count} most shared contacts',
        hourFormat: '{hour}:00'
    },

    // Messages
    messages: {
        totalMessagesWithMedia: 'Total messages with media',
        alsoKnownAs: 'Also known as'
    }
};
