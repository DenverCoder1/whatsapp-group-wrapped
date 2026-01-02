// Date range to filter messages by
const FILTERS = {
    startDate: new Date("2025-01-01T00:00:00"),
    endDate: new Date("2025-12-31T23:59:59"),
};

// Number of top items to show per category
const TOP_COUNT = 6;

// Mapping of phone number tags to names (including '@' and country code)
// This allows displaying names instead of phone numbers in the top taggees output
const TAG_TO_NAME = {
    "@12025551212": "John Doe",
};

if (typeof module != "undefined" && module.exports) {
    module.exports = {
        FILTERS,
        TAG_TO_NAME,
        TOP_COUNT,
    };
}
