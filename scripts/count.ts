import fs from 'fs';
import path from 'path';

const dataDir = path.join(__dirname, 'data');

const archiveCount = JSON.parse(fs.readFileSync(path.join(dataDir, 'archive.json'), 'utf-8')).length;
const ripCount = JSON.parse(fs.readFileSync(path.join(dataDir, 'rip.json'), 'utf-8')).length;
const newCount = JSON.parse(fs.readFileSync(path.join(dataDir, 'new.json'), 'utf-8')).length;

const total = archiveCount + ripCount + newCount;

console.log(`archive.json: ${archiveCount}`);
console.log(`rip.json:     ${ripCount}`);
console.log(`new.json:     ${newCount}`);
console.log(`─────────────────`);
console.log(`Total:        ${total}`);
