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
  '_routes.json'
];

// Copy files from public directory
const publicFilesToCopy = [
  'favicon.ico',
  'placeholder-profile.webp'
];

// Copy root files
filesToCopy.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(distDir, file);
  
  if (fs.existsSync(src)) {
    try {
      fs.copyFileSync(src, dest);
      console.log(`✓ Copied ${file} to dist directory`);
    } catch (error) {
      console.warn(`⚠ Failed to copy ${file}: ${error.message}`);
    }
  } else {
    console.warn(`⚠ File ${file} not found, skipping`);
  }
});

// Copy public files
const publicDir = path.join(__dirname, 'public');
publicFilesToCopy.forEach(file => {
  const src = path.join(publicDir, file);
  const dest = path.join(distDir, file);
  
  if (fs.existsSync(src)) {
    try {
      fs.copyFileSync(src, dest);
      console.log(`✓ Copied public/${file} to dist directory`);
    } catch (error) {
      console.warn(`⚠ Failed to copy public/${file}: ${error.message}`);
    }
  } else {
    console.warn(`⚠ File public/${file} not found, skipping`);
  }
});

console.log('Cloudflare Pages build completed successfully!');
