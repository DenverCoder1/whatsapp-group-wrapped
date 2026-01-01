#!/usr/bin/env node

/**
 * Test runner for WhatsApp Group Wrapped
 * Tests both .txt and .zip file inputs
 */

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function runTest(testName, inputFile, expectedOutput) {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`Running test: ${testName}`, 'cyan');
    log('='.repeat(60), 'cyan');
    
    try {
        // Run the main.js script
        const command = `node main.js "${inputFile}"`;
        log(`Command: ${command}`, 'blue');
        
        const output = execSync(command, {
            cwd: path.join(__dirname, '..'),
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        // Read expected output
        const expected = fs.readFileSync(expectedOutput, 'utf8');
        
        // Compare outputs (exact match for both TXT and ZIP)
        if (output === expected) {
            log(`✓ ${testName} PASSED`, 'green');
            return { passed: true, test: testName };
        } else {
            log(`✗ ${testName} FAILED`, 'red');
            log('\nExpected output length: ' + expected.length, 'yellow');
            log('Actual output length: ' + output.length, 'yellow');
            
            // Find first difference
            for (let i = 0; i < Math.min(expected.length, output.length); i++) {
                if (expected[i] !== output[i]) {
                    const start = Math.max(0, i - 50);
                    const end = Math.min(expected.length, i + 50);
                    log('\nFirst difference at position ' + i + ':', 'yellow');
                    log('Expected: ' + JSON.stringify(expected.substring(start, end)), 'yellow');
                    log('Actual:   ' + JSON.stringify(output.substring(start, end)), 'yellow');
                    break;
                }
            }
            
            // Write actual output to file for comparison
            const actualOutputFile = path.join(__dirname, `actual-${testName.replaceAll(/\s+/g, '-')}.txt`);
            fs.writeFileSync(actualOutputFile, output);
            log(`\nActual output written to: ${actualOutputFile}`, 'blue');
            log(`Compare with: diff "${expectedOutput}" "${actualOutputFile}"`, 'blue');
            
            return { passed: false, test: testName };
        }
    } catch (error) {
        log(`✗ ${testName} ERROR`, 'red');
        log('Error message: ' + error.message, 'red');
        if (error.stderr) {
            log('stderr: ' + error.stderr.toString(), 'red');
        }
        return { passed: false, test: testName, error: error.message };
    }
}

function createZipFile() {
    log('\nCreating ZIP file for testing...', 'cyan');
    const testDir = path.join(__dirname, 'WhatsApp Chat with Pomegranate Community');
    const zipFile = path.join(__dirname, 'WhatsApp Chat with Pomegranate Community.zip');
    
    try {
        // Remove existing zip if it exists
        if (fs.existsSync(zipFile)) {
            fs.unlinkSync(zipFile);
        }
        
        // Try creating zip file using Python (most reliable cross-platform)
        try {
            const pythonScript = `
import zipfile
import os

source_dir = "${testDir.replace(/\\/g, '\\\\')}"
zip_path = "${zipFile.replace(/\\/g, '\\\\')}"

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(source_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, source_dir)
            zipf.write(file_path, arcname)
`;
            execSync(`python3 -c ${JSON.stringify(pythonScript)}`, {
                stdio: 'pipe'
            });
            log('✓ ZIP file created successfully', 'green');
            return true;
        } catch (pythonError) {
            console.error('⚠ Could not create ZIP file using Python:', pythonError.message);
            // Try zip command as fallback
            try {
                execSync(`cd "${testDir}" && zip -r "../WhatsApp Chat with Pomegranate Community.zip" .`, {
                    stdio: 'pipe'
                });
                log('✓ ZIP file created successfully', 'green');
                return true;
            } catch (zipError) {
                console.error('⚠ Could not create ZIP file using zip command:', zipError.message);
                log('⚠ Could not create ZIP file', 'yellow');
                log('  Install zip with: sudo pacman -S zip', 'yellow');
                return false;
            }
        }
    } catch (error) {
        log('✗ Error creating ZIP file: ' + error.message, 'red');
        return false;
    }
}

// Main test execution
function main() {
    log('\n' + '='.repeat(60), 'cyan');
    log('WhatsApp Group Wrapped - Test Suite', 'cyan');
    log('='.repeat(60) + '\n', 'cyan');
    
    const testDir = path.join(__dirname);
    const expectedOutputTxt = path.join(testDir, 'expected-TXT-File-Test.txt');
    const expectedOutputZip = path.join(testDir, 'expected-ZIP-File-Test.txt');
    const txtFile = path.join(testDir, 'WhatsApp Chat with Pomegranate Community', 'WhatsApp Chat with Pomegranate Community.txt');
    const zipFile = path.join(testDir, 'WhatsApp Chat with Pomegranate Community.zip');
    
    // Check if expected output exists
    if (!fs.existsSync(expectedOutputTxt)) {
        log('✗ Expected output file not found: ' + expectedOutputTxt, 'red');
        process.exit(1);
    }
    if (!fs.existsSync(expectedOutputZip)) {
        log('✗ Expected output file not found: ' + expectedOutputZip, 'red');
        process.exit(1);
    }
    
    // Check if txt file exists
    if (!fs.existsSync(txtFile)) {
        log('✗ Test chat file not found: ' + txtFile, 'red');
        process.exit(1);
    }
    
    const results = [];
    
    // Test 1: Text file input
    results.push(runTest('TXT File Test', txtFile, expectedOutputTxt));
    
    // Test 2: ZIP file input
    if (fs.existsSync(zipFile)) {
        fs.unlinkSync(zipFile);
    }
    if (fs.existsSync(zipFile)) {
        results.push(runTest('ZIP File Test', zipFile, expectedOutputZip));
    } else {
        const zipCreated = createZipFile();
        if (zipCreated && fs.existsSync(zipFile)) {
            results.push(runTest('ZIP File Test', zipFile, expectedOutputZip));
        } else {
            log('\n⚠ Skipping ZIP file test (file not available)', 'yellow');
        }
    }
    
    // Summary
    log('\n' + '='.repeat(60), 'cyan');
    log('Test Summary', 'cyan');
    log('='.repeat(60), 'cyan');
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    results.forEach(result => {
        const status = result.passed ? '✓ PASS' : '✗ FAIL';
        const color = result.passed ? 'green' : 'red';
        log(`${status}: ${result.test}`, color);
        if (result.error) {
            log(`  Error: ${result.error}`, 'red');
        }
    });
    
    log(`\nTotal: ${results.length} tests`, 'blue');
    log(`Passed: ${passed}`, 'green');
    log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
    
    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
}

// Run tests
main();
