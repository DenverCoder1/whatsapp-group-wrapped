# WhatsApp Group Wrapped - Test Suite

This directory contains the test suite for the WhatsApp Group Wrapped analyzer.

## Directory Structure

```
test/
├── README.md                           # This file
├── run-tests.js                        # Test runner script
├── expected-output.txt                 # Expected output for test cases
└── WhatsApp Chat with Pomegranate Community/
    ├── WhatsApp Chat with Pomegranate Community.txt  # Test chat export
    └── *.vcf                           # Test contact files (46 files)
```

## Running Tests

### Run all tests:
```bash
cd /home/jonah/Documents/GitHub/whatsapp-group-wrapped
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

## Test Data

### Chat File
- **File**: `WhatsApp Chat with Pomegranate Community.txt`
- **Date Range**: December 30, 2024 - December 2025
- **Total Messages**: 579
- **Unique Senders**: 29
- **Group Name**: Pomegranate Community

### Contact Files (VCF)
The test includes 46 VCF files representing 6 unique phone numbers with multiple name variations:

1. **Smith Appliance Repair** (201-555-0142) - 10 variations
2. **Johnson Handyman Services** (201-555-0207) - 9 variations
3. **Mike Williams** (201-555-0224) - 7 variations
4. **Sarah Davis** (201-555-0909) - 7 variations
5. **Robert Brown** (201-555-0937) - 7 variations
6. **Aaron Movers** (201-555-0409) - 6 variations

## Expected Output

The test validates that the analyzer produces the correct statistics:
- Message counts per sender
- Media message counts
- Question counts
- Tag counts (taggers and taggees)
- Time-based statistics (hours, days, months)
- Word statistics
- Emoji statistics
- Contact sharing analysis (duplicate phone numbers with different names)

## Test Runner Features

- Color-coded output (green = pass, red = fail, yellow = warning)
- Detailed failure reporting with diff location
- Automatic ZIP file creation for ZIP tests
- Writes actual output to file for manual comparison on failure
- Exit code 0 on success, 1 on failure (CI/CD friendly)

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
   diff test/expected-output.txt test/actual-TXT-File-Test.txt
   ```
3. Review the first difference location shown in test output

### Config differences
Make sure `config.js` is set up for the full year 2025:
```javascript
startDate: new Date("2025-01-01"),
endDate: new Date("2025-12-31")
```
