const fs = require('fs');
const path = require('path');

const replacements = {
    'orange-50': 'red-50',
    'orange-100': 'red-100',
    'orange-200': 'red-200',
    'orange-300': 'red-300',
    'orange-400': 'red-400',
    'orange-500': 'red-500',
    'orange-600': 'red-600',
    'orange-700': 'red-700',
    'orange-800': 'red-800',
    'orange-900': 'red-900',
};

function replaceInFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        for (const [oldColor, newColor] of Object.entries(replacements)) {
            if (content.includes(oldColor)) {
                content = content.replace(new RegExp(oldColor, 'g'), newColor);
                modified = true;
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                walkDir(filePath);
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            replaceInFile(filePath);
        }
    }
}

const rootDir = 'd:\\ERP offline\\QITPES-ERP-SYSTEM';
console.log('Starting color replacement...');
walkDir(rootDir);
console.log('Color replacement complete!');
