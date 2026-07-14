import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.resolve(__dirname, '../src');

// Walk directory recursively
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

const fileExtensions = ['.ts', '.tsx', '.css'];

let modifiedFilesCount = 0;

walkDir(SRC_DIR, (filePath) => {
  const ext = path.extname(filePath);
  if (!fileExtensions.includes(ext)) return;

  // Skip index.css for now as we will handle it manually
  if (filePath.endsWith('index.css')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace emerald- with brand-
  content = content.replace(/emerald-/g, 'brand-');
  // Replace teal- with brand-
  content = content.replace(/teal-/g, 'brand-');

  // Specific exceptions:
  // If it's a toast or success notification/status, we want it to use real emerald (green)
  // Let's identify files that should keep success colors green:
  const isToastOrAlert = filePath.includes('Toast') || filePath.includes('Alert') || filePath.includes('Modal');
  if (isToastOrAlert) {
    // If we want success colors to remain green, we can revert brand back to emerald for success strings:
    content = content.replace(/success.*brand-/g, (match) => match.replace('brand-', 'emerald-'));
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${path.relative(SRC_DIR, filePath)}`);
    modifiedFilesCount++;
  }
});

console.log(`Done! Modified ${modifiedFilesCount} files.`);
