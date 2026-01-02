<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Group Wrapped</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            border: 2px dashed #667eea;
            border-radius: 15px;
            padding: 40px;
            text-align: center;
            margin-bottom: 20px;
            transition: all 0.3s ease;
        }

        .upload-section:hover {
            border-color: #764ba2;
            background: #f0f1ff;
        }

        .upload-section.dragover {
            background: #e8eaff;
            border-color: #764ba2;
        }

        .file-input-wrapper {
            position: relative;
            display: inline-block;
        }

        input[type="file"] {
            display: none;
        }

        .file-label {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        input[type="number"] {
            width: 100%;
            padding: 10px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s ease;
        }

        input[type="date"]:focus,
        input[type="number"]:focus {
            outline: none;
            border-color: #667eea;
        }

        .date-inputs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        button[type="submit"] {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            border-top: 4px solid #667eea;
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
            border-left: 4px solid #667eea;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            font-size: 14px;
            color: #555;
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
                    <label for="topCount">Top Count (number of entries in top lists):</label>
                    <input type="number" id="topCount" name="topCount" value="6" min="1" max="100">
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
                <a href="#" class="download-btn" id="downloadBtn">⬇️ Download</a>
            </div>
            <div class="results-content" id="resultsContent"></div>
        </div>

        <div class="info">
            <strong>💡 How to use:</strong><br>
            1. Export your WhatsApp group chat (without media)<br>
            2. Upload the .txt or .zip file<br>
            3. Set your date range and preferences<br>
            4. Click "Generate Wrapped" to see your stats!
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
            formData.append('topCount', document.getElementById('topCount').value);

            try {
                const response = await fetch('api.php', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    resultsContent.textContent = data.output;
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
    </script>
</body>

</html>