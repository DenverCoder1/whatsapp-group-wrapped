/**
 * ZIP file extraction utilities
 */

const fs = require("fs");
const zlib = require("zlib");

/**
 * Validates that a buffer is a valid ZIP file
 * @param {Buffer} buffer - Buffer to validate
 * @throws {Error} If the buffer is not a valid ZIP file
 */
function validateZipFile(buffer) {
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
        throw new Error("Invalid ZIP file");
    }
}

/**
 * Calculates the actual compressed size of a file in the ZIP
 * @param {Buffer} zipBuffer - The ZIP file buffer
 * @param {number} dataOffset - Offset where the compressed data starts
 * @param {number} compressedSize - Compressed size from the header
 * @param {number} flags - Flags from the local file header
 * @returns {number} The actual compressed size
 */
function calculateCompressedSize(zipBuffer, dataOffset, compressedSize, flags) {
    const hasDataDescriptor = (flags & 0x08) !== 0;
    
    if (hasDataDescriptor || compressedSize === 0) {
        // Find the next local file header or central directory header
        let searchOffset = dataOffset;
        while (searchOffset < zipBuffer.length - 4) {
            const sig = zipBuffer.readUInt32LE(searchOffset);
            // Local file header or central directory header
            if (sig === 0x04034b50 || sig === 0x02014b50) {
                return searchOffset - dataOffset;
            }
            searchOffset++;
        }
        return zipBuffer.length - dataOffset;
    }
    
    return compressedSize;
}

/**
 * Decompresses data based on the compression method
 * @param {Buffer} compressedData - The compressed data buffer
 * @param {number} compressionMethod - The compression method (0 = none, 8 = DEFLATE)
 * @returns {string} The decompressed content as UTF-8 string
 * @throws {Error} If compression method is unsupported or decompression fails
 */
function decompressData(compressedData, compressionMethod) {
    if (compressionMethod === 0) {
        // No compression
        return compressedData.toString("utf8");
    } else if (compressionMethod === 8) {
        // DEFLATE compression
        try {
            return zlib.inflateRawSync(compressedData).toString("utf8");
        } catch (e) {
            throw new Error(`Failed to decompress file: ${e.message}`);
        }
    } else {
        throw new Error(`Unsupported compression method: ${compressionMethod}`);
    }
}

/**
 * Parses a ZIP file and extracts file entries
 * @param {Buffer} zipBuffer - The ZIP file buffer
 * @param {string|null} extension - File extension to filter by (e.g., '.txt'), or null for all files
 * @returns {Array<{filename: string, content: string}>} Array of file entries with filename and content
 */
function parseZipEntries(zipBuffer, extension = null) {
    const entries = [];
    let offset = 0;

    while (offset < zipBuffer.length - 30) {
        // Look for local file header signature (0x04034b50)
        if (zipBuffer.readUInt32LE(offset) === 0x04034b50) {
            const flags = zipBuffer.readUInt16LE(offset + 6);
            const compressionMethod = zipBuffer.readUInt16LE(offset + 8);
            const compressedSize = zipBuffer.readUInt32LE(offset + 18);
            const filenameLength = zipBuffer.readUInt16LE(offset + 26);
            const extraFieldLength = zipBuffer.readUInt16LE(offset + 28);

            const filename = zipBuffer.toString("utf8", offset + 30, offset + 30 + filenameLength);

            // Check if this file matches the extension filter
            const matchesExtension = extension === null || 
                                     filename.toLowerCase().endsWith(extension.toLowerCase());

            if (matchesExtension && !filename.endsWith('/')) {
                const dataOffset = offset + 30 + filenameLength + extraFieldLength;
                const actualCompressedSize = calculateCompressedSize(
                    zipBuffer, 
                    dataOffset, 
                    compressedSize, 
                    flags
                );
                
                const compressedData = zipBuffer.slice(dataOffset, dataOffset + actualCompressedSize);
                const content = decompressData(compressedData, compressionMethod);
                
                entries.push({ filename, content });
            }

            offset += 30 + filenameLength + extraFieldLength + (compressedSize || 1);
        } else {
            offset++;
        }
    }

    return entries;
}

/**
 * Extracts all files with a specific extension from a ZIP file
 * @param {string} zipFilePath - Path to the ZIP file
 * @param {string} extension - File extension to extract (e.g., '.vcf', '.txt')
 * @returns {Array<{filename: string, content: string}>} Array of extracted files
 * @throws {Error} If the file is not a valid ZIP or no matching files are found
 */
function extractFilesByExtension(zipFilePath, extension) {
    const zipBuffer = fs.readFileSync(zipFilePath);
    validateZipFile(zipBuffer);
    
    const entries = parseZipEntries(zipBuffer, extension);
    
    if (entries.length === 0) {
        throw new Error(`No ${extension} files found in ZIP archive`);
    }
    
    return entries;
}

/**
 * Extracts the first file with a specific extension from a ZIP file
 * @param {string} zipFilePath - Path to the ZIP file
 * @param {string} extension - File extension to extract (e.g., '.vcf', '.txt')
 * @returns {string} Content of the first matching file found
 * @throws {Error} If the file is not a valid ZIP or no matching file is found
 */
function extractFirstFileByExtension(zipFilePath, extension) {
    const entries = extractFilesByExtension(zipFilePath, extension);
    return entries[0];
}

module.exports = { 
    extractFilesByExtension,
    extractFirstFileByExtension,
    parseZipEntries,
    validateZipFile
};
