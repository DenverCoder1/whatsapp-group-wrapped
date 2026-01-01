# WhatsApp Group Wrapped - Test Suite

This directory contains the test suite for the WhatsApp Group Wrapped analyzer.

## Directory Structure

```
test/
├── README.md                           # This file
├── run-tests.js                        # Test runner script
├── expected-TXT-File-Test.txt          # Expected output for TXT file test
├── expected-ZIP-File-Test.txt          # Expected output for ZIP file test
└── WhatsApp Chat with Pomegranate Community/
    ├── WhatsApp Chat with Pomegranate Community.txt  # Test chat export
    └── *.vcf                           # Test contact files (46 files)
```

## Running Tests

### Run all tests:
```bash
cd whatsapp-group-wrapped
node test/run-tests.js
```

Or make it executable and run directly:
```bash
chmod +x test/run-tests.js
./test/run-tests.js
```

### What gets tested:

1. **TXT File Test**: Tests `main.js` with the `.txt` chat export file directly
2. **ZIP File Test**: Tests `main.js` with a `.zip` file containing the chat and VCF files

## Troubleshooting

### ZIP test is skipped
If the ZIP file test is skipped, install the `zip` utility:
```bash
sudo pacman -S zip  # Arch Linux
sudo apt install zip  # Ubuntu/Debian
```

### Test fails with differences
1. Check the generated `actual-*.txt` files in the test directory
2. Compare with expected output:
   ```bash
   diff test/expected-TXT-File-Test.txt test/actual-TXT-File-Test.txt
   diff test/expected-ZIP-File-Test.txt test/actual-ZIP-File-Test.txt
   ```
3. Review the first difference location shown in test output

### Config differences
Make sure `config.js` is set up for the full year 2025:
```javascript
startDate: new Date("2025-01-01"),
endDate: new Date("2025-12-31")
```
