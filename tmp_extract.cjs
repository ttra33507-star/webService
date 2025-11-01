const fs=require('fs');
const content=fs.readFileSync('tmp_app.js','utf8');
const regex=/https?:\/\/[^\"'\s]+/g;
const matches=new Set();
for (const match of content.matchAll(regex)) { matches.add(match[0]); }
console.log([...matches].join('\n')); 
