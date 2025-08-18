import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to create a simple HTML version that can be printed to PDF
function createHTMLFromMarkdown(markdownContent) {
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Telugu Learning Application - Speech Dictation Documentation</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            font-size: 2.5em;
        }
        
        h2 {
            color: #34495e;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 8px;
            margin-top: 30px;
            font-size: 1.8em;
        }
        
        h3 {
            color: #2c3e50;
            margin-top: 25px;
            font-size: 1.4em;
        }
        
        h4 {
            color: #34495e;
            margin-top: 20px;
            font-size: 1.2em;
        }
        
        code {
            background-color: #f8f9fa;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            color: #e74c3c;
        }
        
        pre {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            border-left: 4px solid #3498db;
            margin: 15px 0;
        }
        
        pre code {
            background: none;
            padding: 0;
            color: #333;
        }
        
        blockquote {
            border-left: 4px solid #3498db;
            margin: 15px 0;
            padding-left: 15px;
            color: #7f8c8d;
            font-style: italic;
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 15px 0;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background-color: #3498db;
            color: white;
            font-weight: bold;
        }
        
        tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        
        ul, ol {
            margin: 15px 0;
            padding-left: 30px;
        }
        
        li {
            margin: 8px 0;
        }
        
        .toc {
            background-color: #ecf0f1;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .toc ul {
            list-style-type: none;
            padding-left: 0;
        }
        
        .toc li {
            margin: 5px 0;
        }
        
        .toc a {
            color: #2c3e50;
            text-decoration: none;
        }
        
        .toc a:hover {
            color: #3498db;
        }
        
        .file-structure {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            white-space: pre;
            overflow-x: auto;
        }
        
        .flow-diagram {
            background-color: #e8f4fd;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #3498db;
        }
        
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        
        .success {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        
        .error {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        
        @media print {
            body {
                font-size: 12pt;
                line-height: 1.4;
            }
            
            h1 { font-size: 24pt; }
            h2 { font-size: 18pt; }
            h3 { font-size: 14pt; }
            h4 { font-size: 12pt; }
            
            pre {
                font-size: 10pt;
                page-break-inside: avoid;
            }
            
            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <div class="content">
        ${markdownContent}
    </div>
    
    <script>
        // Add page breaks for better PDF formatting
        document.addEventListener('DOMContentLoaded', function() {
            const h1Elements = document.querySelectorAll('h1');
            h1Elements.forEach((h1, index) => {
                if (index > 0) {
                    h1.classList.add('page-break');
                }
            });
        });
    </script>
</body>
</html>`;

  return htmlTemplate;
}

// Function to convert markdown to HTML (simple conversion)
function markdownToHTML(markdown) {
  let html = markdown;
  
  // Convert headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Convert code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  
  // Convert inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Convert lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  
  // Wrap lists in ul/ol tags
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  
  // Convert bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Convert file structure blocks
  html = html.replace(/```\n([\s\S]*?)```/g, '<div class="file-structure">$1</div>');
  
  // Convert flow diagrams
  html = html.replace(/#### (\d+\. .*)/g, '<div class="flow-diagram"><h4>$1</h4>');
  html = html.replace(/(<div class="flow-diagram">.*?)(\n\n)/gs, '$1</div>$2');
  
  // Convert warning/success/error blocks
  html = html.replace(/⚠️ (.*)/g, '<div class="warning">⚠️ $1</div>');
  html = html.replace(/✅ (.*)/g, '<div class="success">✅ $1</div>');
  html = html.replace(/❌ (.*)/g, '<div class="error">❌ $1</div>');
  
  // Convert line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  
  // Wrap in paragraphs
  html = '<p>' + html + '</p>';
  
  return html;
}

// Main function
function generatePDFDocumentation() {
  try {
    // Read the markdown file
    const markdownPath = path.join(__dirname, 'SPEECH_DICTATION_DOCUMENTATION.md');
    const markdownContent = fs.readFileSync(markdownPath, 'utf8');
    
    // Convert markdown to HTML
    const htmlContent = markdownToHTML(markdownContent);
    
    // Create full HTML document
    const fullHTML = createHTMLFromMarkdown(htmlContent);
    
    // Write HTML file
    const htmlPath = path.join(__dirname, 'SPEECH_DICTATION_DOCUMENTATION.html');
    fs.writeFileSync(htmlPath, fullHTML);
    
    console.log('✅ HTML documentation generated successfully!');
    console.log(`📄 HTML file: ${htmlPath}`);
    console.log('');
    console.log('📋 To convert to PDF:');
    console.log('1. Open the HTML file in a web browser');
    console.log('2. Press Ctrl+P (or Cmd+P on Mac)');
    console.log('3. Select "Save as PDF" as destination');
    console.log('4. Choose your preferred settings and save');
    console.log('');
    console.log('🎯 Alternative: Use browser print-to-PDF feature for best results');
    
  } catch (error) {
    console.error('❌ Error generating documentation:', error.message);
  }
}

// Run the script
generatePDFDocumentation();
