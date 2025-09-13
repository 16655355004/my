// Cloudflare Pages configuration
const fs = require('fs');
const path = require('path');

// Ensure the dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy necessary files to dist directory
const filesToCopy = [
  '_headers',
  '_redirects',
  '_routes.json',
  'favicon.ico',
  'placeholder-profile.jpg'
];

filesToCopy.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(distDir, file);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} to dist directory`);
  }
});

console.log('Cloudflare Pages build completed successfully!');
