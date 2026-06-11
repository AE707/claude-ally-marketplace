#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function handleFileWrite(filePath, content) {
  console.error(`[CodeAllyBridge] Writing file: ${filePath}`);
  
  return new Promise((resolve) => {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create a temporary file with the content
    const tempFile = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `claude-ally-${Date.now()}.txt`);
    fs.writeFileSync(tempFile, content, 'utf8');
    
    // Use Code Ally to write the file
    const command = `Create a file at ${filePath} with content from ${tempFile}`;
    const allyCmd = `ally --execute "${command.replace(/"/g, '\\"')}" --yes-to-all`;
    
    exec(allyCmd, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      // Clean up temp file
      try { fs.unlinkSync(tempFile); } catch(e) {}
      
      if (error) {
        // Fallback: write directly
        try {
          fs.writeFileSync(filePath, content, 'utf8');
          resolve({ success: true, path: filePath, method: 'fallback' });
        } catch (err) {
          resolve({ success: false, error: err.message });
        }
      } else {
        resolve({ success: true, path: filePath, method: 'code-ally' });
      }
    });
  });
}

// Read input from stdin
let input = '';
process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', async () => {
  try {
    const request = JSON.parse(input);
    const result = await handleFileWrite(request.filePath, request.content);
    console.log(JSON.stringify(result));
  } catch (err) {
    console.error('Error:', err.message);
    console.log(JSON.stringify({ success: false, error: err.message }));
  }
});