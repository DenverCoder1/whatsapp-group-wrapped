/**
 * Hebrew translations (עברית)
 */

module.exports = {
    // Language metadata
    code: 'he',
    name: 'עברית',
    rtl: true,
    
    // Pluralization rules for Hebrew (more complex than English)
    pluralize: (count, singular, plural = null) => {
        // Hebrew has specific plural forms that we handle with a lookup
        const pluralForms = {
            'הודעה': 'הודעות',
            'הודעה עם מדיה': 'הודעות עם מדיה',
            'שאלה': 'שאלות',
            'תיוג': 'תיוגים',
            'פעם': 'פעמים',
            'אימוג\'י': 'אימוג\'י'
        };
        
        if (count === 1) return singular;
        
        // Use provided plural or lookup in pluralForms
        if (plural) return plural;
        if (pluralForms[singular]) return pluralForms[singular];
        
        // Fallback for unknown words
        return singular;
    },

    // Verb conjugation for Hebrew (singular vs plural)
    conjugateVerb: (count, verb) => {
        const verbForms = {
            'נשאל': { singular: 'נשאלה', plural: 'נשאלו' },
            'נשלח': { singular: 'נשלח', plural: 'נשלחו' },
            'תויג': { singular: 'תויג', plural: 'תויגו' },
            'שותף': { singular: 'שותף', plural: 'שותפו' }
        };
        
        if (count === 1 && verbForms[verb]) return verbForms[verb].singular;
        if (verbForms[verb]) return verbForms[verb].plural;
        return verb;
    },

    // Day names (0-6, Sunday-Saturday)
    days: [
        'יום ראשון',
        'יום שני',
        'יום שלישי',
        'יום רביעי',
        'יום חמישי',
        'יום שישי',
        'שבת'
    ],

    // Month names (0-11, January-December)
    months: [
        'ינואר',
        'פברואר',
        'מרץ',
        'אפריל',
        'מאי',
        'יוני',
        'יולי',
        'אוגוסט',
        'ספטמבר',
        'אוקטובר',
        'נובמבר',
        'דצמבר'
    ],

    // Section headers
    sections: {
        topSenders: 'השולחים המובילים',
        topMediaSenders: 'שולחי המדיה המובילים',
        topQuestionAskers: 'שואלי השאלות המובילים',
        topTaggers: 'המתייגים המובילים',
        topTaggees: 'המתוייגים המובילים',
        messageStats: 'סטטיסטיקות הודעות',
        memberStats: 'סטטיסטיקות חברים',
        mostActiveHours: 'השעות הכי פעילות',
        mostActiveDays: 'הימים הכי פעילים',
        mostActiveMonths: 'החודשים הכי פעילים',
        topWords: 'המילים הכי נפוצות',
        topUncommonWords: 'המילים הנדירות הכי נפוצות',
        wordStats: 'סטטיסטיקות מילים',
        topEmojiSenders: 'שולחי האימוג\'י המובילים',
        topEmojis: 'האימוג\'י המובילים',
        topContactsShared: 'אנשי הקשר ששותפו הכי הרבה'
    },

    // Unit labels
    units: {
        message: 'הודעה',
        messageWithMedia: 'הודעה עם מדיה',
        question: 'שאלה',
        tag: 'תיוג',
        time: 'פעם',
        emoji: 'אימוג\'י'
    },

    // Stats labels
    stats: {
        totalMessages: 'סה"כ הודעות',
        messagesWithMedia: 'הודעות עם מדיה',
        messagesDeleted: 'הודעות שנמחקו',
        messagesDeletedByAdmin: 'הודעות שנמחקו על ידי מנהל',
        dailyAverage: 'ממוצע יומי',
        messageSenders: 'שולחי הודעות',
        membersJoined: 'חברים שהצטרפו',
        membersLeft: 'חברים שעזבו',
        messagesPinned: 'הודעות מוצמדות',
        totalWordsent: 'סה"כ מילים שנשלחו',
        wordsPerMessage: 'מילים להודעה',
        numberOfUniqueEmojis: 'מספר אימוג\'י ייחודיים',
        uniquePhoneNumbers: 'סה"כ מספרי טלפון ייחודיים שנשלחו כאנשי קשר',
        contactsSharedByMultiple: 'אנשי קשר ששותפו על ידי מספר אנשים',
        contactsWithDifferentNames: 'אנשי קשר עם שמות שונים'
    },

    // Action verbs (base forms for conjugation)
    actions: {
        asked: 'נשאל',      // to be asked
        sent: 'נשלח',       // to be sent
        tagged: 'תויג',     // to be tagged
        shared: 'שותף'      // to be shared
    },

    // Format strings (use {0}, {1}, etc. for placeholders)
    formats: {
        xMessages: '{count} {unit}',
        taggedXTime: 'תויג {count} {unit}',
        sharedXTime: 'שותפו {count} {unit}',
        topXMostShared:  '{count} אנשי קשר ששותפו הכי הרבה',
        hourFormat: '{hour}:00'
    },

    // Messages
    messages: {
        totalMessagesWithMedia: 'סה"כ הודעות עם מדיה',
        alsoKnownAs: 'שמות אחרים'
    }
};
