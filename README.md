# WhatsApp Group Wrapped

Create a summary of stats from a WhatsApp group export

## Usage

1. Export a WhatsApp group chat from the WhatsApp app on your phone:
    - Open the group chat
    - Tap the group name at the top
    - Scroll down and tap "Export chat"
    - Choose "Without media"
    - Share the chat export to your computer
2. Make sure `node` is installed on your computer (https://nodejs.org/)
3. Copy `example.config.js` to `config.js` and fill in values as needed:
    - Set `FILTERS.startDate` to contain the date you want to start counting messages from (ensure the year is correct)
    - Set `FILTERS.endDate` to contain the date you want to stop counting messages from
    - Set `TOP_COUNT` to the number of entries to show in the top lists
    - Optionally, populate `TAG_TO_NAME` with a mapping of phone numbers to names using the provided format as an example
4. Run the following command in your terminal:

```bash
node main.js 'path/to/WhatsApp Chat with Group Name.txt'
```

Replace the path with the path to the exported chat file. If, for example, the chat file is in the same directory as the script and is named `chat.txt`, you would run:

```bash
node main.js 'chat.txt'
```

5. The script will output a summary of the chat to the terminal

## Example output

```
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
Nancy Johnson - tagged 4 times
Daryl Williams - tagged 4 times
Joe Smith - tagged 3 times
Mary Williams - tagged 3 times
Eric Thomas - tagged 3 times
Annie Levin - tagged 2 times

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
```

## License

MIT License - see [LICENSE](LICENSE) for more details
