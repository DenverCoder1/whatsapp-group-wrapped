/**
 * Japanese translations (日本語)
 * TODO: Review for accuracy
 */

module.exports = {
    // Language metadata
    code: 'ja',
    name: '日本語',
    rtl: false,
    
    // Pluralization rules - Japanese doesn't have plural forms
    pluralize: (count, singular, plural = null) => {
        return singular;
    },

    // Day names (0-6, Sunday-Saturday)
    days: [
        '日曜日',
        '月曜日',
        '火曜日',
        '水曜日',
        '木曜日',
        '金曜日',
        '土曜日'
    ],

    // Month names (0-11, January-December)
    months: [
        '1月',
        '2月',
        '3月',
        '4月',
        '5月',
        '6月',
        '7月',
        '8月',
        '9月',
        '10月',
        '11月',
        '12月'
    ],

    // Section headers
    sections: {
        topSenders: 'トップ送信者',
        topMediaSenders: 'トップメディア送信者',
        topQuestionAskers: 'トップ質問者',
        topTaggers: 'トップタグ付け者',
        topTaggees: 'トップタグ付けられた人',
        messageStats: 'メッセージ統計',
        memberStats: 'メンバー統計',
        mostActiveHours: '最もアクティブな時間',
        mostActiveDays: '最もアクティブな曜日',
        mostActiveMonths: '最もアクティブな月',
        topWords: 'トップワード',
        topUncommonWords: 'トップ珍しいワード',
        wordStats: 'ワード統計',
        topEmojiSenders: 'トップ絵文字送信者',
        topEmojis: 'トップ絵文字',
        topContactsShared: 'トップ共有連絡先'
    },

    // Unit labels
    units: {
        message: 'メッセージ',
        messageWithMedia: 'メディア付きメッセージ',
        question: '質問',
        tag: 'タグ',
        time: '回',
        emoji: '絵文字'
    },

    // Plural overrides (Japanese doesn't change but kept for consistency)
    unitPlurals: {},

    // Stats labels
    stats: {
        totalMessages: '総メッセージ数',
        messagesWithMedia: 'メディア付きメッセージ',
        messagesDeleted: '削除されたメッセージ',
        messagesDeletedByAdmin: '管理者が削除したメッセージ',
        dailyAverage: '1日平均',
        messageSenders: 'メッセージ送信者',
        membersJoined: '参加したメンバー',
        membersLeft: '退出したメンバー',
        messagesPinned: 'ピン留めされたメッセージ',
        totalWordsent: '総送信単語数',
        wordsPerMessage: 'メッセージあたりの単語数',
        numberOfUniqueEmojis: 'ユニーク絵文字数',
        uniquePhoneNumbers: '連絡先として送信されたユニーク電話番号の合計',
        contactsSharedByMultiple: '複数人が共有した連絡先',
        contactsWithDifferentNames: '異なる名前の連絡先'
    },

    // Action verbs and descriptions
    actions: {
        asked: 'した',
        sent: 'した',
        tagged: 'タグ付けされた',
        shared: 'した'
    },

    // Format strings (use {0}, {1}, etc. for placeholders)
    formats: {
        xMessages: '{count}{unit}',
        taggedXTime: '{count}{unit}タグ付けされた',
        sharedXTime: '{count}{unit}した',
        topXMostShared: '最も共有された連絡先トップ{count}',
        hourFormat: '{hour}:00'
    },

    // Messages
    messages: {
        totalMessagesWithMedia: 'メディア付きメッセージの合計',
        alsoKnownAs: '別名',
        welcomeToYour: 'あなたの'
    }
};
