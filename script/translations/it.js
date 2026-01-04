/**
 * Italian translations
 * TODO: Review for accuracy
 */

module.exports = {
    // Language metadata
    code: 'it',
    name: 'Italiano',
    rtl: false,
    
    // Pluralization rules
    pluralize: (count, singular, plural = null) => {
        if (count === 1) return singular;
        // Check for custom plural in unitPlurals
        if (plural) return plural;
        return singular;
    },

    // Day names (0-6, Sunday-Saturday)
    days: [
        'Domenica',
        'Lunedì',
        'Martedì',
        'Mercoledì',
        'Giovedì',
        'Venerdì',
        'Sabato'
    ],

    // Month names (0-11, January-December)
    months: [
        'Gennaio',
        'Febbraio',
        'Marzo',
        'Aprile',
        'Maggio',
        'Giugno',
        'Luglio',
        'Agosto',
        'Settembre',
        'Ottobre',
        'Novembre',
        'Dicembre'
    ],

    // Section headers
    sections: {
        topSenders: 'Mittenti principali',
        topMediaSenders: 'Mittenti principali di media',
        topQuestionAskers: 'Chi fa più domande',
        topTaggers: 'Chi menziona di più',
        topTaggees: 'I più menzionati',
        messageStats: 'Statistiche messaggi',
        memberStats: 'Statistiche membri',
        mostActiveHours: 'Ore più attive',
        mostActiveDays: 'Giorni più attivi',
        mostActiveMonths: 'Mesi più attivi',
        topWords: 'Parole più usate',
        topUncommonWords: 'Parole meno comuni più usate',
        wordStats: 'Statistiche parole',
        topEmojiSenders: 'Chi usa più emoji',
        topEmojis: 'Emoji più usate',
        topContactsShared: 'Contatti più condivisi'
    },

    // Unit labels
    units: {
        message: 'messaggio',
        messageWithMedia: 'messaggio con media',
        question: 'domanda',
        tag: 'menzione',
        time: 'volta',
        emoji: 'emoji'
    },

    // Plural overrides (when plural form is irregular)
    unitPlurals: {
        message: 'messaggi',
        messageWithMedia: 'messaggi con media',
        question: 'domande',
        tag: 'menzioni',
        time: 'volte',
        emoji: 'emoji'
    },

    // Stats labels
    stats: {
        totalMessages: 'Totale messaggi',
        messagesWithMedia: 'Messaggi con media',
        messagesDeleted: 'Messaggi eliminati',
        messagesDeletedByAdmin: 'Messaggi eliminati dall\'amministratore',
        dailyAverage: 'Media giornaliera',
        messageSenders: 'Mittenti di messaggi',
        membersJoined: 'Membri aggiunti',
        membersLeft: 'Membri usciti',
        messagesPinned: 'Messaggi fissati',
        totalWordsent: 'Totale parole inviate',
        wordsPerMessage: 'Parole per messaggio',
        numberOfUniqueEmojis: 'Numero di emoji uniche',
        uniquePhoneNumbers: 'Totale numeri di telefono unici inviati come contatti',
        contactsSharedByMultiple: 'Contatti condivisi da più persone',
        contactsWithDifferentNames: 'Contatti con nomi diversi'
    },

    // Action verbs and descriptions
    actions: {
        asked: 'chieste',
        sent: 'inviate',
        tagged: 'menzionato',
        shared: 'condiviso'
    },

    // Format strings (use {0}, {1}, etc. for placeholders)
    formats: {
        xMessages: '{count} {unit}',
        taggedXTime: 'menzionato {count} {unit}',
        sharedXTime: 'condiviso {count} {unit}',
        topXMostShared: 'I {count} contatti più condivisi',
        hourFormat: '{hour}:00'
    },

    // Messages
    messages: {
        totalMessagesWithMedia: 'Totale messaggi con media',
        alsoKnownAs: 'Conosciuto anche come',
        welcomeToYour: 'Benvenuto al tuo'
    }
};
