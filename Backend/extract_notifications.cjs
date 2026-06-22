const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

async function walk(dir, fileList = []) {
  const files = await readdir(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'scratch') {
        await walk(filePath, fileList);
      }
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function extract() {
  const srcDir = path.join(__dirname, 'src');
  const files = await walk(srcDir);
  
  const results = [];
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    // We'll look for blocks of notifyOwnerSafely or notifyOwnersSafely
    const regex = /(notifyOwnerSafely|notifyOwnersSafely)\s*\(([^;]*)\)/gs;
    
    let match;
    while ((match = regex.exec(content)) !== null) {
      const type = match[1];
      const args = match[2];
      
      const titleMatch = args.match(/title\s*:\s*[`"']([^`"']+)[`"']/);
      const bodyMatch = args.match(/body\s*:\s*[`"']([^`"']+)[`"']/);
      
      if (titleMatch || bodyMatch) {
          results.push({
              file: path.relative(srcDir, file),
              type,
              title: titleMatch ? titleMatch[1] : 'N/A',
              body: bodyMatch ? bodyMatch[1] : 'N/A'
          });
      }
    }
  }
  
  console.log(JSON.stringify(results, null, 2));
}

extract().catch(console.error);
