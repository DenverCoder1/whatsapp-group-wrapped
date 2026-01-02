# WhatsApp Group Wrapped

Create a summary of stats from a WhatsApp group export

## Usage

### Web Interface (PHP)

For a user-friendly web interface:

1. Make sure you have PHP and Node.js installed on your computer
2. Copy `script/example.config.js` to `script/config.js` (the web interface will temporarily override some settings)
3. Start a PHP server in the project directory:

```bash
php -S localhost:8000 -t api -c php.ini
```

1. Open your browser to `http://localhost:8000`
2. Upload your WhatsApp chat export (.txt or .zip file)
3. Configure your date range and top count
4. Click "Generate Wrapped" to see your stats
5. Download the results if desired

**Note for large files:** If you encounter upload errors with large chat exports, use the command with `-c php.ini` as shown above. The included `php.ini` file increases upload limits to 100MB and allows longer processing times.

### Command Line (Node.js)

1. Export a WhatsApp group chat from the WhatsApp app on your phone:
    - Open the group chat
    - Tap the 3 dots at the top, then "More > Export chat"
    - Choose "Without media"
    - Share the chat export to your computer
2. Make sure `node` is installed on your computer (https://nodejs.org/)
3. Copy `script/example.config.js` to `script/config.js` and fill in values as needed:
    - Set `FILTERS.startDate` to contain the date you want to start counting messages from (ensure the year is correct)
    - Set `FILTERS.endDate` to contain the date you want to stop counting messages from
    - Set `TOP_COUNT` to the number of entries to show in the top lists
    - Optionally, populate `TAG_TO_NAME` with a mapping of phone numbers to names using the provided format as an example
4. Run the script with the path to your exported chat file:

```bash
node script/main.js 'path/to/WhatsApp Chat with Group Name.txt'
```

Or from the `script` directory:

```bash
node main.js 'path/to/WhatsApp Chat with Group Name.txt'
```

Replace the path with the path to the exported chat file. If, for example, the chat file is in the same directory as the script and is named `chat.txt`, you would run:

```bash
node script/main.js 'chat.txt'
```

You can also provide a zip file containing the chat export and contact cards (.vcf files). The script will extract the chat text file from the zip to process as well as provide an analysis of contact cards shared in the chat.

```bash
node script/main.js 'path/to/WhatsApp Chat with Group Name.zip'
```

5. The script will output a summary of the chat to the terminal and save results to the `output/` directory

## Example output

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║                      Welcome to Your                      ║
║                WhatsApp Group Wrapped 2025                ║
║                   Pomegranate Community                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

Top senders:
Jeffrey Thomas - 127 messages
Susan Smith - 91 messages
Eric Thomas - 65 messages
Arnold Palmer - 57 messages
Daryl Williams - 50 messages
Annie Levin - 21 messages

Top media senders:
Susan Smith - 64 messages with media
Jeffrey Thomas - 63 messages with media
Eric Thomas - 46 messages with media
Daryl Williams - 45 messages with media
Arnold Palmer - 24 messages with media
Doris Baker - 15 messages with media

Total messages with media: 339

Top question askers:
Jeffrey Thomas - 3 questions asked
Arnold Palmer - 3 questions asked
Eric Thomas - 2 questions asked
Daryl Williams - 1 questions asked
Amy Gross - 1 questions asked

Top taggers:
Susan Smith - 21 tags sent
Jeffrey Thomas - 11 tags sent
Joe Smith - 4 tags sent
Eric Thomas - 3 tags sent
Daryl Williams - 2 tags sent
Mary Williams - 2 tags sent

Top taggees:
@Nancy Johnson - tagged 4 times
@Daryl Williams - tagged 4 times
@Joe Smith - tagged 3 times
@Mary Williams - tagged 3 times
@Eric Thomas - tagged 3 times
@Annie Levin - tagged 2 times

Total messages: 579

Daily messages: 1.58

Message senders: 29

Top active hours of the day:
15:00 - 76 messages
14:00 - 63 messages
19:00 - 54 messages
12:00 - 47 messages
13:00 - 47 messages
17:00 - 42 messages

Top active days of the week:
Wednesday - 114 messages
Monday - 102 messages
Sunday - 99 messages
Tuesday - 91 messages
Friday - 87 messages
Thursday - 75 messages
Saturday - 11 messages

Top active months of the year:
January - 58 messages
September - 58 messages
July - 56 messages
June - 55 messages
November - 54 messages
October - 53 messages
February - 52 messages
August - 52 messages
April - 45 messages
March - 43 messages
May - 43 messages
December - 10 messages

Members who joined: 341

Members who left: 20 

Messages pinned: 9

Total number of words sent: 7967

Average number of words per message: 36.55

Top words:
to - 320 times
and - 239 times
the - 226 times
a - 188 times
for - 167 times
up - 121 times

Top uncommon words:
tonight - 38 times
community - 35 times
everyone - 29 times
celebrate - 28 times
celebration - 27 times
excited - 26 times

Top emoji senders:
Arnold Palmer - 116 emojis
Jeffrey Thomas - 105 emojis
Susan Smith - 80 emojis
Daryl Williams - 54 emojis
Eric Thomas - 49 emojis
Amy Gross - 24 emojis

Top emojis:
🎉 - 29 times
📣 - 14 times
🕯️ - 12 times
🍷 - 11 times
🔥 - 8 times
🍕 - 7 times

Total unique phone numbers sent as contacts: 484

Top 6 most shared contacts:
1. Smith Appliance Repair (201-555-0142) - shared 10 times
   Also known as: Smith Appliance Repair (2), Danny Smith (2), Daniel Smith Handyman (1), Smith's Appliance Service (1), Daniel Smith (Technician) (1), Danny Smith Appliance Repair (1), Daniel Smith Repairs (1), Danny Smith Appliances (1)
2. Johnson Handyman Services (201-555-0207) - shared 9 times
   Also known as: Johnson Handyman Services (2), John Movers (1), J. Johnson Van (1), Johnson Moving (1), Johnson Van & Mover (1), J Johnson (1), Johnson Small Moving (1), Johnson's Handyman (1)
3. Mike Williams (201-555-0224) - shared 7 times
   Also known as: Mike Williams (2), Michael W. (1), M. Williams (1), Mike Williams Electrician (1), Mike (1), Mike Williams Handyman (1)
4. Sarah Davis (201-555-0909) - shared 7 times
   Also known as: Sarah Davis (1), Sarah Seamstress (1), Sarah Jane Davis (1), Sarah Davis Alterations (1), Sarah Davis Seamstress (1), Sarah Davis Tailor (1), Sarah Jane Davis Seamstress (1)
5. Robert Brown (201-555-0937) - shared 7 times
   Also known as: Robert Brown (1), Bob's Phone Repair (1), Bob Phone & Laptop (1), Robert Brown Phone Repair (1), Robert Brown - Tech Repairs (1), Robert Brown (1), Bob's Tech Repairs (1)
6. Aaron Movers (201-555-0409) - shared 6 times
   Also known as: Aaron Movers (2), Aaron's Moving Service (1), Aaron Mover (1), A. Moving Co. (1), Aaron Moving Guy (1)

Contacts shared by multiple people: 68
Contacts with different names: 65
```

## What's next?

Upcoming features and improvements may include:

- Support for more languages
- Generate an image or video summary of the stats for sharing
- More detailed analytics and visualizations

## License

MIT License - see [LICENSE](LICENSE) for more details
