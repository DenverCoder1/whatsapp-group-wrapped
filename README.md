# WhatsApp Group Wrapped

Create a summary of stats from a WhatsApp group export

Get yours at [https://whatsappwrapped.demolab.com](https://whatsappwrapped.demolab.com/)!

## Developer Usage

### Web Interface (PHP)

The web interface in the `api/` directory allows you to upload a WhatsApp chat export file and see the generated stats in your browser.

1. Make sure you have PHP and Node.js installed on your computer
2. Start a PHP server in the project directory:

```bash
php -S localhost:8000 -t api -c api/php.ini
```

1. Open your browser to `http://localhost:8000`
2. Upload your WhatsApp chat export (.txt or .zip file)
3. Configure your date range and top count
4. Click "Generate Wrapped" to see your stats
5. Download the results if desired

**Note for large files:** If you encounter upload errors with large chat exports, use the command with `-c php.ini` as shown above. The included `php.ini` file increases upload limits to 100MB and allows longer processing times.

### Command Line (Node.js)

The command line script in the `script/` directory allows you to generate the WhatsApp Group Wrapped summary directly in the terminal and is the same script used by the web interface.

1. Export a WhatsApp group chat from the WhatsApp app on your phone:
    - Open the group chat
    - Tap the 3 dots at the top, then "More > Export chat"
    - Choose "Without media"
    - Share the chat export to your computer
2. Make sure `node` is installed on your computer (https://nodejs.org/)
3. **(Optional)** Create `script/config.js` to map phone numbers to names:
    - Copy `script/example.config.js` to `script/config.js`
    - Populate `TAG_TO_NAME` with a mapping of phone numbers to names (e.g., `"@12025551212": "John Doe"`)
    - This is only needed if you want to display names instead of phone numbers in sections where contact names are not available
4. Run the script with the path to your exported chat file.

```bash
node script/main.js <file> [startDate] [endDate] [topCount] [outputFormat] [language]
```

**Parameters:**
- `file` (required): Path to the WhatsApp chat export file (.txt or .zip)
- `startDate` (optional): Start date in YYYY-MM-DD format
  - Default: January 1st of last year (or current year if run in December)
- `endDate` (optional): End date in YYYY-MM-DD format
  - Default: December 31st of last year (or current year if run in December)
- `topCount` (optional): Number of top entries to show in lists
  - Default: 25
- `outputFormat` (optional): Output format - `text` or `json`
  - Default: text
- `language` (optional): Language code for output translations - `en`, `he`, etc.
  - Default: en

**Examples:**

```bash
# Basic usage - uses smart defaults for year
node script/main.js chat.zip

# Custom date range for a specific year
node script/main.js chat.zip 2025-01-01 2025-12-31

# Show top 10 entries and output as JSON
node script/main.js chat.zip 2025-01-01 2025-12-31 10 json

# Generate output in Hebrew
node script/main.js chat.zip 2025-01-01 2025-12-31 25 text he

# Skip optional middle arguments with empty strings
node script/main.js chat.zip '' '' '' text he
```

5. The script will output a summary of the chat to the terminal and save results to the `output/` directory

## Language Support & Translations

The tool supports multiple languages for output. Currently available languages:

- **English** (`en`) - Default
- **Hebrew** (`he`)

### Adding New Translations

To add support for a new language:

1. Create a new file in `script/translations/` named `{language_code}.js` (e.g., `es.js` for Spanish, `fr.js` for French)
2. Copy the structure from `script/translations/en.js`
3. Translate all the strings in the new file
4. The language will automatically be available - just pass its code as the language parameter

## Example output

```
╔══════════════════════════════════════════════════╗
║                                                  ║
║                 Welcome to Your                  ║
║           WhatsApp Group Wrapped 2025            ║
║              Pomegranate Community               ║
║                                                  ║
╚══════════════════════════════════════════════════╝

Top senders:
Jeffrey Thomas - 158 messages
Susan Smith - 129 messages
Eric Thomas - 113 messages
Arnold Palmer - 111 messages
Daryl Williams - 106 messages
Annie Levin - 10 messages
Joe Smith - 7 messages
Mary Williams - 6 messages
Nancy Johnson - 5 messages
Amy Gross - 4 messages

Top media senders:
Susan Smith - 116 messages with media
Eric Thomas - 103 messages with media
Daryl Williams - 100 messages with media
Arnold Palmer - 86 messages with media
Jeffrey Thomas - 47 messages with media
Mary Williams - 0 messages with media
Joe Smith - 0 messages with media
Annie Levin - 0 messages with media
Amy Gross - 0 messages with media
Nancy Johnson - 0 messages with media

Total messages with media: 452 

Top question askers:
Jeffrey Thomas - 6 questions asked
Arnold Palmer - 3 questions asked
Annie Levin - 3 questions asked
Susan Smith - 3 questions asked
Eric Thomas - 1 question asked
Amy Gross - 1 question asked
Daryl Williams - 1 question asked

Top taggers:
Susan Smith - 4 tags sent
Jeffrey Thomas - 2 tags sent
Mary Williams - 2 tags sent
Annie Levin - 1 tag sent
Daryl Williams - 1 tag sent
Arnold Palmer - 0 tags sent
Joe Smith - 0 tags sent
Eric Thomas - 0 tags sent
Amy Gross - 0 tags sent
Nancy Johnson - 0 tags sent

Top taggees:
@⁨Eric Thomas⁩ - tagged 4 times
@⁨Joe Smith⁩ - tagged 3 times
@⁨Mary Williams⁩ - tagged 1 time
@⁨Arnold Palmer⁩ - tagged 1 time
@⁨Annie Levin⁩ - tagged 1 time

Total messages: 649 

Messages deleted: 6 

Messages deleted by admin: 2 

Daily average: 1.78 

Message senders: 10 

Most Active Hours:
14:00 - 65 messages
11:00 - 63 messages
12:00 - 63 messages
13:00 - 60 messages
15:00 - 59 messages
19:00 - 58 messages
10:00 - 57 messages
16:00 - 56 messages
18:00 - 53 messages
17:00 - 52 messages
9:00 - 43 messages
8:00 - 14 messages
20:00 - 6 messages

Most Active Days:
Wednesday - 115 messages
Thursday - 103 messages
Tuesday - 99 messages
Monday - 98 messages
Friday - 82 messages
Saturday - 80 messages
Sunday - 72 messages

Most Active Months:
January - 152 messages
February - 87 messages
March - 58 messages
April - 44 messages
June - 44 messages
July - 44 messages
August - 44 messages
September - 44 messages
October - 44 messages
November - 44 messages
May - 33 messages
December - 11 messages

Members joined: 5 

Total words sent: 975 

Words per message: 5.1 

Top Words:
everyone - 40 times
morning - 31 times
community - 31 times
for - 26 times
great - 25 times
the - 22 times
happy - 21 times
celebration - 20 times
good - 20 times
a - 17 times
celebrations - 16 times
file - 15 times
attached - 15 times
this - 14 times
you - 12 times
to - 11 times
i'll - 10 times
time - 9 times
have - 9 times
anyone - 8 times
another - 8 times
day - 8 times
is - 7 times
next - 7 times
i - 7 times

Top Uncommon Words:
everyone - 40 times
community - 31 times
celebration - 20 times
celebrations - 16 times
file - 15 times
attached - 15 times
anyone - 8 times
another - 8 times
today - 7 times
thanks - 6 times
coming - 5 times
looking - 5 times
tonight - 5 times
weekend - 5 times
excited - 4 times
smith - 4 times
moving - 4 times
phone - 4 times
amazing - 4 times
let's - 4 times
eric - 4 times
thomas - 4 times
month's - 4 times
friday - 4 times
needs - 3 times

Top Emoji Senders:
Jeffrey Thomas - 142 emojis
Arnold Palmer - 32 emojis
Annie Levin - 6 emojis
Joe Smith - 5 emojis
Mary Williams - 4 emojis
Eric Thomas - 2 emojis
Amy Gross - 0 emojis
Nancy Johnson - 0 emojis
Susan Smith - 0 emojis
Daryl Williams - 0 emojis

Top Emojis:
🎉 - 27 times
📣 - 27 times
🍷 - 14 times
🔥 - 12 times
🕯️ - 9 times
🍕 - 2 times

Number of unique emojis: 6 

Total unique phone numbers sent as contacts: 6

Top 6 most shared contacts:
1. Bob's Phone Repair (+12015550937) - shared 5 times
   Also known as: Bob's Phone Repair (2), Bob Phone & Laptop (1), Robert Brown - Tech Repairs (1), Robert Brown (1)
2. J Johnson (+12015550207) - shared 3 times
   Also known as: J Johnson (1), J. Johnson Van (1), John Movers (1)
3. A. Moving Co. (+12015550409) - shared 3 times
   Also known as: A. Moving Co. (1), Aaron's Moving Service (1), Aaron Mover (1)
4. Mike (+12015550224) - shared 2 times
5. Daniel Smith (Technician) (+12015550142) - shared 1 time
6. Sarah Davis Alterations (+12015550909) - shared 1 time

Contacts shared by multiple people: 4
Contacts with different names: 3
```

## Troubleshooting

### No results or parsing errors

If your chat export returns no results or fails to parse, the issue is likely due to an unsupported date/time format. WhatsApp exports use different formats depending on your phone's language and region settings.

**Solution:** Change your phone's language settings to English before exporting the chat:

1. Go to your phone's Settings → Language & Region
2. Change the language to English (US or UK)
3. Open WhatsApp and export the chat again
4. After exporting, you can change your phone's language back

This ensures the chat export uses a date/time format that the parser recognizes.

### Other common issues

- **Upload errors with large files**: Use the PHP server with the `-c php.ini` flag as shown in the setup instructions to increase upload limits.
- **Missing sender names**: If senders appear as phone numbers, use the `TAG_TO_NAME` configuration to map phone numbers to names.

## What's next?

Upcoming features and improvements may include:

- Support for assigning custom names to senders in the output
- More detailed analytics and visualizations
- More language support

## License

MIT License - see [LICENSE](LICENSE) for more details
