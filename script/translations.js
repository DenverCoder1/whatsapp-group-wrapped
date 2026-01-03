/**
 * Translation loader and manager
 * Handles loading and accessing translations for different languages
 */

const fs = require('node:fs');
const path = require('node:path');

class Translations {
    constructor(languageCode = 'en') {
        this.languageCode = languageCode;
        this.translations = null;
        this.load(languageCode);
    }

    /**
     * Load translations for a specific language
     * @param {string} languageCode - Language code (e.g., 'en', 'he')
     */
    load(languageCode) {
        const translationPath = path.join(__dirname, 'translations', `${languageCode}.js`);
        
        if (!fs.existsSync(translationPath)) {
            console.warn(`Translation file not found for language '${languageCode}', falling back to English`);
            this.languageCode = 'en';
            this.translations = require('./translations/en.js');
            return;
        }

        this.languageCode = languageCode;
        this.translations = require(translationPath);
    }

    /**
     * Get a translation value using dot notation path
     * @param {string} key - Dot-notated path (e.g., 'sections.topSenders')
     * @param {Object} params - Optional parameters for string formatting
     * @returns {string} - Translated string
     */
    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                console.warn(`Translation key not found: ${key}`);
                return key;
            }
        }

        // If value is a string and params are provided, replace placeholders
        if (typeof value === 'string' && Object.keys(params).length > 0) {
            return this.format(value, params);
        }

        return value;
    }

    /**
     * Format a string with parameters
     * Replaces {key} placeholders with values from params object
     * @param {string} template - Template string with {key} placeholders
     * @param {Object} params - Parameters to replace
     * @returns {string} - Formatted string
     */
    format(template, params) {
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    /**
     * Get pluralized form
     * @param {number} count - The count
     * @param {string} singular - Singular form
     * @param {string} plural - Optional plural form
     * @returns {string} - Pluralized string
     */
    pluralize(count, singular, plural = null) {
        // Check if there's a custom plural in unitPlurals
        if (!plural && this.translations.unitPlurals) {
            // Try to find the singular in units to get its key
            for (const [key, value] of Object.entries(this.translations.units || {})) {
                if (value === singular && this.translations.unitPlurals[key]) {
                    plural = this.translations.unitPlurals[key];
                    break;
                }
            }
        }
        
        if (this.translations.pluralize) {
            return this.translations.pluralize(count, singular, plural);
        }
        // Fallback pluralization
        return count === 1 ? singular : (plural || singular + 's');
    }

    /**
     * Conjugate a verb based on count (for languages with verb agreement)
     * @param {number} count - The count
     * @param {string} verb - Base verb form
     * @returns {string} - Conjugated verb
     */
    conjugateVerb(count, verb) {
        if (this.translations.conjugateVerb) {
            return this.translations.conjugateVerb(count, verb);
        }
        // Fallback - return verb as-is
        return verb;
    }

    /**
     * Get day name by index (0-6)
     * @param {number} day - Day index (0-6, Sunday-Saturday)
     * @returns {string} - Day name
     */
    getDayName(day) {
        return this.t('days')[day] || `Day ${day}`;
    }

    /**
     * Get month name by index (1-12)
     * @param {number} month - Month number (1-12)
     * @returns {string} - Month name
     */
    getMonthName(month) {
        return this.t('months')[month - 1] || `Month ${month}`;
    }

    /**
     * Get the language code
     * @returns {string} - Language code (e.g., 'en', 'he')
     */
    getLanguageCode() {
        return this.translations.code || this.languageCode;
    }

    /**
     * Get the language name
     * @returns {string} - Language name (e.g., 'English', 'עברית')
     */
    getLanguageName() {
        return this.translations.name || this.languageCode;
    }

    /**
     * Check if the language is RTL (right-to-left)
     * @returns {boolean} - True if RTL, false otherwise
     */
    isRTL() {
        return this.translations.rtl && this.translations.rtl === true;
    }

    /**
     * Get available languages
     * @returns {Array} - Array of available language codes
     */
    static getAvailableLanguages() {
        const translationsDir = path.join(__dirname, 'translations');
        if (!fs.existsSync(translationsDir)) {
            return ['en'];
        }

        return fs.readdirSync(translationsDir)
            .filter(file => file.endsWith('.js'))
            .map(file => file.replace('.js', ''));
    }
}

module.exports = Translations;
