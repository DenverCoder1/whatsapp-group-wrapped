/**
 * Test configuration for WhatsApp Group Wrapped
 * This configuration is used for running tests
 */

module.exports = {
    /**
     * Date range filter for messages
     */
    FILTERS: {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
    },

    /**
     * Map phone number tags to readable names
     * Format: "+1 234-567-8900": "Name"
     */
    TAG_TO_NAME: {},

    /**
     * Number of top entries to show in rankings
     */
    TOP_COUNT: 6,
};
