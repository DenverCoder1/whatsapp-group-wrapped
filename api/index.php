<?php
// File routing for Vercel deployment
require_once __DIR__ . '/vercel.php';

$domain = 'whatsappwrapped.demolab.com';
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Group Wrapped</title>

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="favicon.ico">

    <!-- Primary Meta Tags -->
    <meta name="title" content="WhatsApp Group Wrapped">
    <meta name="description" content="Analyze your WhatsApp group chats and get fun statistics about your conversations. Upload your chat export and discover insights about your messaging patterns.">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?= "https://$domain/" ?>">
    <meta property="og:title" content="WhatsApp Group Wrapped">
    <meta property="og:description" content="Analyze your WhatsApp group chats and get fun statistics about your conversations. Upload your chat export and discover insights about your messaging patterns.">
    <meta property="og:image" content="<?= "https://$domain/images/whatsapp-preview.png" ?>">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="<?= "https://$domain/" ?>">
    <meta property="twitter:title" content="WhatsApp Group Wrapped">
    <meta property="twitter:description" content="Analyze your WhatsApp group chats and get fun statistics about your conversations. Upload your chat export and discover insights about your messaging patterns.">
    <meta property="twitter:image" content="<?= "https://$domain/images/whatsapp-preview.png" ?>">

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary-color: #10b981;
            --secondary-color: #059669;
            --background-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: var(--background-gradient);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 800px;
            width: 100%;
            padding: 40px;
        }

        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 10px;
            font-size: 2.5em;
        }

        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
            font-size: 1.1em;
        }

        .upload-section {
            background: #f8f9fa;
            border: 2px dashed var(--primary-color);
            border-radius: 15px;
            padding: 40px;
            text-align: center;
            margin-bottom: 20px;
            transition: all 0.3s ease;
        }

        .upload-section:hover {
            border-color: var(--secondary-color);
            background: #f0fdf4;
        }

        .upload-section.dragover {
            background: #dcfce7;
            border-color: var(--secondary-color);
        }

        .file-input-wrapper {
            position: relative;
            display: inline-block;
        }

        input[type="file"] {
            display: none;
        }

        .file-label {
            background: var(--background-gradient);
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            transition: transform 0.2s ease;
            display: inline-block;
        }

        .file-label:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .file-name {
            margin-top: 15px;
            color: #333;
            font-weight: 500;
        }

        .options {
            margin: 20px 0;
        }

        .option-group {
            margin-bottom: 15px;
        }

        label {
            display: block;
            margin-bottom: 5px;
            color: #555;
            font-weight: 500;
        }

        input[type="date"],
        input[type="number"],
        select {
            width: 100%;
            padding: 10px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s ease;
        }

        input[type="date"]:focus,
        input[type="number"]:focus,
        select:focus {
            outline: none;
            border-color: var(--primary-color);
        }

        .date-inputs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        button[type="submit"] {
            background: var(--background-gradient);
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 25px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: transform 0.2s ease;
        }

        button[type="submit"]:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        button[type="submit"]:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .loading {
            display: none;
            text-align: center;
            margin-top: 20px;
        }

        .loading.active {
            display: block;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid var(--primary-color);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }

        @keyframes spin {
            0% {
                transform: rotate(0deg);
            }

            100% {
                transform: rotate(360deg);
            }
        }

        .results {
            display: none;
            margin-top: 30px;
        }

        .results.active {
            display: block;
        }

        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .gallery.rtl {
            direction: rtl;
        }

        .stat-card {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            transition: transform 0.2s ease;
            position: relative;
        }

        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .stat-card::after {
            content: '📋 Click to copy';
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            opacity: 0;
            transition: opacity 0.2s ease;
            pointer-events: none;
        }

        .stat-card:hover::after {
            opacity: 1;
        }

        .stat-card img {
            width: 100%;
            height: auto;
            display: block;
        }

        .copy-notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
            pointer-events: none;
            z-index: 1000;
        }

        .copy-notification.show {
            opacity: 1;
            transform: translateY(0);
        }

        .results-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .results-header h2 {
            color: #333;
        }

        .download-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.2s ease;
        }

        .download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(40, 167, 69, 0.4);
        }

        .results-content {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            max-height: 500px;
            overflow-y: auto;
            white-space: pre-wrap;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.6;
        }

        .results-content.rtl {
            direction: rtl;
            text-align: right;
        }

        .text-results {
            margin-top: 30px;
        }

        .text-results h3 {
            color: #333;
            margin-bottom: 15px;
        }

        .error {
            background: #fff3cd;
            border: 2px solid #ffc107;
            color: #856404;
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            display: none;
        }

        .error.active {
            display: block;
        }

        .info {
            background: #e7f3ff;
            border-left: 4px solid var(--primary-color);
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            font-size: 14px;
            color: #555;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(102, 126, 234, 0.2);
            color: #666;
            font-size: 14px;
        }

        .footer a {
            color: var(--primary-color);
            text-decoration: none;
            font-weight: 600;
        }

        .footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>

<body>
    <div class="container">
        <h1>📱 WhatsApp Group Wrapped</h1>
        <p class="subtitle">Create a summary of stats from your WhatsApp group export</p>

        <form id="uploadForm" enctype="multipart/form-data">
            <div class="upload-section" id="dropZone">
                <div class="file-input-wrapper">
                    <label for="chatFile" class="file-label">
                        📁 Choose File
                    </label>
                    <input type="file" id="chatFile" name="chatFile" accept=".txt,.zip" required>
                </div>
                <div class="file-name" id="fileName">No file selected</div>
                <p style="margin-top: 10px; color: #888; font-size: 14px;">
                    Supports .txt or .zip files
                </p>
            </div>

            <div class="options">
                <div class="date-inputs">
                    <div class="option-group">
                        <label for="startDate">Start Date:</label>
                        <input type="date" id="startDate" name="startDate" value="2025-01-01">
                    </div>
                    <div class="option-group">
                        <label for="endDate">End Date:</label>
                        <input type="date" id="endDate" name="endDate" value="2025-12-31">
                    </div>
                </div>
                <div class="option-group">
                    <label for="language">Output Language:</label>
                    <select id="language" name="language">
                        <option value="en" selected>English</option>
                        <option value="he">עברית (Hebrew)</option>
                    </select>
                </div>
            </div>

            <button type="submit" id="submitBtn">🚀 Generate Wrapped</button>
        </form>

        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Processing your WhatsApp chat... This may take a moment.</p>
        </div>

        <div class="error" id="error"></div>

        <div class="results" id="results">
            <div class="results-header">
                <h2>📊 Results</h2>
                <a href="#" class="download-btn" id="downloadBtn">⬇️ Download Text</a>
            </div>
            <div class="gallery" id="gallery"></div>
            <div class="text-results">
                <h3>📄 Full Text Results</h3>
                <div class="results-content" id="resultsContent"></div>
            </div>
        </div>

        <div class="copy-notification" id="copyNotification">✓ Image copied to clipboard!</div>

        <div class="info">
            <strong>💡 How to use:</strong><br>
            1. Open your WhatsApp group<br>
            2. Tap the 3 dots menu (⋮) at the top<br>
            3. Click "More" → "Export chat"<br>
            4. Select "Without media"<br>
            5. Upload the .txt or .zip file here<br>
            6. Set your date range and preferences<br>
            7. Click "Generate Wrapped" to see your stats!
        </div>

        <div class="footer">
            <a href="https://github.com/DenverCoder1/whatsapp-group-wrapped" target="_blank">View on GitHub</a>
        </div>
    </div>

    <script>
        const form = document.getElementById('uploadForm');
        const fileInput = document.getElementById('chatFile');
        const fileName = document.getElementById('fileName');
        const loading = document.getElementById('loading');
        const results = document.getElementById('results');
        const resultsContent = document.getElementById('resultsContent');
        const error = document.getElementById('error');
        const submitBtn = document.getElementById('submitBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const dropZone = document.getElementById('dropZone');

        // File input change handler
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                fileName.textContent = this.files[0].name;
            } else {
                fileName.textContent = 'No file selected';
            }
        });

        // Drag and drop handlers
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('dragover');
            });
        });

        dropZone.addEventListener('drop', function(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                fileInput.files = files;
                fileName.textContent = files[0].name;
            }
        });

        // Form submission
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Hide previous results/errors
            results.classList.remove('active');
            error.classList.remove('active');

            // Show loading
            loading.classList.add('active');
            submitBtn.disabled = true;

            // Prepare form data
            const formData = new FormData();
            formData.append('chatFile', fileInput.files[0]);
            formData.append('startDate', document.getElementById('startDate').value);
            formData.append('endDate', document.getElementById('endDate').value);
            formData.append('language', document.getElementById('language').value);

            try {
                const response = await fetch('api.php', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    resultsContent.textContent = data.output;
                    // Generate gallery from JSON data
                    if (data.json && data.json.sections) {
                        generateGalleryFromJson(data.json);
                    } else {
                        console.error('No JSON data available');
                        error.textContent = '❌ Error: No structured data available';
                        error.classList.add('active');
                    }
                    results.classList.add('active');
                    downloadBtn.href = 'api.php?download=' + encodeURIComponent(data.filename);
                } else {
                    error.textContent = '❌ Error: ' + data.error;
                    error.classList.add('active');
                }
            } catch (err) {
                error.textContent = '❌ Error: ' + err.message;
                error.classList.add('active');
            } finally {
                loading.classList.remove('active');
                submitBtn.disabled = false;
            }
        });

        // Parse results and generate gallery from JSON
        function generateGalleryFromJson(jsonData) {
            const gallery = document.getElementById('gallery');
            const resultsContent = document.getElementById('resultsContent');
            gallery.innerHTML = '';

            try {
                console.log('Starting gallery generation from JSON...');
                const sections = jsonData.sections || [];
                const isRTL = jsonData.metadata?.language?.rtl || false;
                console.log('JSON sections:', sections.length, sections);
                console.log('Language RTL:', isRTL);

                // Set RTL classes
                if (isRTL) {
                    gallery.classList.add('rtl');
                    resultsContent.classList.add('rtl');
                } else {
                    gallery.classList.remove('rtl');
                    resultsContent.classList.remove('rtl');
                }

                if (sections.length === 0) {
                    gallery.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No sections found to display</p>';
                    return;
                }

                sections.forEach((section, index) => {
                    try {
                        console.log(`Generating card ${index + 1}:`, section.title);
                        const svgDataUri = generateSVG(section, index, isRTL);
                        const card = document.createElement('div');
                        card.className = 'stat-card';
                        const img = document.createElement('img');
                        img.src = svgDataUri;
                        img.alt = escapeHtml(section.title);
                        img.onerror = function() {
                            console.error('Failed to load image for section:', section.title);
                        };
                        img.onload = function() {
                            console.log('Image loaded successfully:', section.title);
                        };
                        card.appendChild(img);
                        card.addEventListener('click', () => copyImageToClipboard(svgDataUri));
                        gallery.appendChild(card);
                    } catch (sectionErr) {
                        console.error('Error generating card:', sectionErr, section);
                    }
                });
            } catch (err) {
                console.error('Error generating gallery from JSON:', err);
                gallery.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Could not generate image gallery</p>';
            }
        }

        // Helper to escape HTML
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Generate SVG for a section
        function generateSVG(section, sectionIndex = 0, isRTL = false) {
            if (!section || !section.items || section.items.length === 0) {
                throw new Error('Invalid section data');
            }

            // Phone portrait dimensions (9:16 aspect ratio)
            const width = 600;
            const height = 1067; // 16:9 ratio
            const headerHeight = 220;
            const itemHeight = 120;
            const padding = 50;
            const maxItems = Math.min(section.items.length, 5);

            // Each card gets a unique bright color - rotate through all colors
            const colorSchemes = [{
                    bg: '#FF6B9D',
                    text: '#1a1a1a'
                }, // Bright pink
                {
                    bg: '#4ECDC4',
                    text: '#1a1a1a'
                }, // Turquoise
                {
                    bg: '#FFD93D',
                    text: '#1a1a1a'
                }, // Bright yellow
                {
                    bg: '#FF8C42',
                    text: '#1a1a1a'
                }, // Bright orange
                {
                    bg: '#A8E6CF',
                    text: '#1a1a1a'
                }, // Pastel green
                {
                    bg: '#BB9AF7',
                    text: '#1a1a1a'
                }, // Lavender
                {
                    bg: '#FF6B6B',
                    text: '#1a1a1a'
                }, // Coral red
                {
                    bg: '#FFB6C1',
                    text: '#1a1a1a'
                }, // Light pink
                {
                    bg: '#87CEEB',
                    text: '#1a1a1a'
                }, // Sky blue
                {
                    bg: '#98D8C8',
                    text: '#1a1a1a'
                }, // Seafoam
                {
                    bg: '#F7DC6F',
                    text: '#1a1a1a'
                }, // Golden yellow
                {
                    bg: '#F6A6B2',
                    text: '#1a1a1a'
                }, // Soft rose
                {
                    bg: '#95E1D3',
                    text: '#1a1a1a'
                }, // Mint green
                {
                    bg: '#C3B1E1',
                    text: '#1a1a1a'
                }, // Light purple
                {
                    bg: '#FFA07A',
                    text: '#1a1a1a'
                } // Light salmon
            ];

            // Use a different color for each section based on its index
            // We'll need to pass the section index, so use title hash as fallback
            const colorIndex = sectionIndex % colorSchemes.length;
            const colors = colorSchemes[colorIndex];

            let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

            // Solid background
            svg += `<rect width="${width}" height="${height}" fill="${colors.bg}" rx="0"/>`;

            // Header section with icon and title - bigger and more spaced out
            svg += `<text x="${width / 2}" y="120" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="${colors.text}" text-anchor="middle">${escapeXml(section.icon)}</text>`;

            // Title - use foreignObject for proper RTL support
            if (isRTL) {
                svg += `<foreignObject x="0" y="150" width="${width}" height="60">
                    <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                        <div style="font-family: Arial, sans-serif; font-size: 32px; font-weight: bold; color: ${colors.text}; text-align: center; direction: rtl;">${escapeXml(section.title)}</div>
                    </div>
                </foreignObject>`;
            } else {
                svg += `<text x="${width / 2}" y="190" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="${colors.text}" text-anchor="middle">${escapeXml(section.title)}</text>`;
            }

            // Items - bigger text and more spacing
            let startY = headerHeight + padding + 80;
            const showNumbers = section.isRanked || false;
            section.items.slice(0, maxItems).forEach((item, index) => {
                const itemY = startY + (index * itemHeight);

                // Rank circle with dark background - bigger (only for "Top" lists)
                if (showNumbers) {
                    const circleX = isRTL ? width - padding - 25 : padding + 25;
                    svg += `<circle cx="${circleX}" cy="${itemY}" r="32" fill="rgba(0,0,0,0.15)"/>`;
                    svg += `<text x="${circleX}" y="${itemY + 9}" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="${colors.text}" text-anchor="middle">${index + 1}</text>`;
                }

                // Name and value on separate lines
                const nameX = isRTL ?
                    (showNumbers ? width - padding - 80 : width - padding - 25) :
                    (showNumbers ? padding + 80 : padding + 25);
                const textAnchor = isRTL ? 'end' : 'start';
                let displayName = item.name;
                const maxNameLength = showNumbers ? 25 : 33;
                if (displayName.length > maxNameLength) {
                    displayName = displayName.substring(0, maxNameLength) + '...';
                }

                // Use foreignObject for RTL text to get proper HTML/CSS support
                if (isRTL) {
                    const textWidth = showNumbers ? (width - 120 - padding) : (width - 100);

                    // Name on first line
                    svg += `<foreignObject x="50" y="${itemY - 35}" width="${textWidth}" height="35">
                        <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: flex-end;">
                            <div style="font-family: Arial, sans-serif; font-size: 30px; font-weight: 600; color: ${colors.text}; direction: rtl; text-align: right; padding-right: 10px;">${escapeXml(displayName)}</div>
                        </div>
                    </foreignObject>`;

                    // Value on second line
                    svg += `<foreignObject x="50" y="${itemY + 5}" width="${textWidth}" height="35">
                        <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: flex-end;">
                            <div style="font-family: Arial, sans-serif; font-size: 28px; font-weight: bold; color: ${colors.text}; opacity: 0.8; direction: rtl; text-align: right; padding-right: 10px;">${escapeXml(item.value)}</div>
                        </div>
                    </foreignObject>`;
                } else {
                    // Name on first line
                    svg += `<text x="${nameX}" y="${itemY - 10}" font-family="Arial, sans-serif" font-size="30" font-weight="600" fill="${colors.text}" text-anchor="${textAnchor}">${escapeXml(displayName)}</text>`;
                    // Value on second line
                    svg += `<text x="${nameX}" y="${itemY + 32}" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="${colors.text}" opacity="0.8" text-anchor="${textAnchor}">${escapeXml(item.value)}</text>`;
                }
            });

            // Footer decoration
            svg += `<rect x="0" y="${height - 50}" width="${width}" height="50" fill="rgba(0,0,0,0.1)"/>`;
            svg += `<text x="${width / 2}" y="${height - 20}" font-family="Arial, sans-serif" font-size="24" font-weight="600" fill="${colors.text}" text-anchor="middle" direction="ltr" unicode-bidi="embed"><?= $domain ?></text>`;

            svg += `</svg>`;

            // Use charset=utf-8 and encodeURIComponent for proper encoding
            return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        }

        // Helper to escape XML special characters
        function escapeXml(text) {
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        }

        // Helper to format text for RTL display in SVG
        function formatTextForSVG(text, isRTL) {
            if (!isRTL) return escapeXml(text);
            // For RTL, wrap in tspan with proper attributes
            return escapeXml(text);
        }

        // Copy image to clipboard
        async function copyImageToClipboard(dataUri) {
            try {
                // Create an image element from the SVG data URI
                const img = new Image();
                img.src = dataUri;

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });

                // Create a canvas and draw the image
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // Convert canvas to blob
                const blob = await new Promise(resolve => {
                    canvas.toBlob(resolve, 'image/png');
                });

                // Copy to clipboard
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'image/png': blob
                    })
                ]);

                // Show notification
                const notification = document.getElementById('copyNotification');
                notification.classList.add('show');
                setTimeout(() => {
                    notification.classList.remove('show');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy image:', err);
                alert('Failed to copy image. Try right-clicking and selecting "Copy Image" instead.');
            }
        }
    </script>
</body>

</html>