const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(file => {
        const dirPath = path.join(dir, file);
        if (fs.statSync(dirPath).isDirectory()) {
            walkDir(dirPath, callback);
        } else if (dirPath.endsWith('.ts') || dirPath.endsWith('.tsx')) {
            callback(dirPath);
        }
    });
}

const srcDir = path.join(__dirname, 'src');

let count = 0;
walkDir(srcDir, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace all incorrect translation logic with stable auto-margin flex logic
    content = content.replace(/top-1\/2 -translate-y-1\/2/g, 'top-0 bottom-0 my-auto');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed:', filePath);
        count++;
    }
});

console.log('Total files fixed:', count);
