// Mapping of phone number tags to names (including '@' and country code)
// This allows displaying names instead of phone numbers in the top taggees output
const TAG_TO_NAME = {
    "@12025551212": "John Doe",
};

if (typeof module != "undefined" && module.exports) {
    module.exports = {
        TAG_TO_NAME,
    };
}
