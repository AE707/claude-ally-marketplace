const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function writeFileWithAlly(filePath, content) {
  return new Promise((resolve) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const command = `Create a file at ${filePath} with content: ${content.substring(0, 500)}`;
    const allyCmd = `ally --execute "${command.replace(/"/g, '\\"')}" --yes-to-all`;
    
    exec(allyCmd, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
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

async function createFolderWithAlly(folderPath) {
  return new Promise((resolve) => {
    const command = `Create a folder at ${folderPath}`;
    const allyCmd = `ally --execute "${command.replace(/"/g, '\\"')}" --yes-to-all`;
    
    exec(allyCmd, (error) => {
      if (error) {
        try {
          fs.mkdirSync(folderPath, { recursive: true });
          resolve({ success: true, path: folderPath, method: 'fallback' });
        } catch (err) {
          resolve({ success: false, error: err.message });
        }
      } else {
        resolve({ success: true, path: folderPath, method: 'code-ally' });
      }
    });
  });
}

module.exports = { writeFileWithAlly, createFolderWithAlly };