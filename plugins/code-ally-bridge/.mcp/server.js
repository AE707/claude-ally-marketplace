#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function allyWrite(filePath, content) {
  return new Promise((resolve) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const command = `Create a file at ${filePath} with content: ${content.substring(0, 500)}`;
    const allyCmd = `ally --execute "${command.replace(/"/g, '\\"')}" --yes-to-all`;
    
    exec(allyCmd, { maxBuffer: 10 * 1024 * 1024 }, (error) => {
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

async function allyMkdir(folderPath) {
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

async function allyExec(command) {
  return new Promise((resolve) => {
    const allyCmd = `ally --execute "Execute shell command: ${command}" --yes-to-all`;
    
    exec(allyCmd, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: error.message, output: stderr });
      } else {
        resolve({ success: true, output: stdout });
      }
    });
  });
}

process.stdin.on('data', async (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      try {
        const req = JSON.parse(line);
        if (req.method === 'tools/call') {
          const { name, arguments: args } = req.params;
          let result;
          
          if (name === 'ally_write') {
            result = await allyWrite(args.path, args.content);
          } else if (name === 'ally_mkdir') {
            result = await allyMkdir(args.path);
          } else if (name === 'ally_exec') {
            result = await allyExec(args.command);
          } else {
            result = { error: `Unknown tool: ${name}` };
          }
          
          process.stdout.write(JSON.stringify({
            jsonrpc: '2.0',
            id: req.id,
            result: { content: [{ type: 'text', text: JSON.stringify(result) }] }
          }) + '\n');
        }
      } catch(e) {}
    }
  }
});

console.error('Code Ally Bridge MCP Server running');