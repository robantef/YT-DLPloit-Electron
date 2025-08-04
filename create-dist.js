// create-dist.js - Simple distribution builder without electron-builder
const fs = require('fs');
const path = require('path');

function copyFolderRecursive(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);
  
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyFolderRecursive(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

console.log('Creating simple distribution...');

// Create dist folder
const distDir = path.join(__dirname, 'yt-dlploit-dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir);

// Copy main files
console.log('Copying main.js...');
fs.copyFileSync('main.js', path.join(distDir, 'main.js'));

console.log('Copying package.json...');
// Create a production package.json
const packageJson = {
  name: "yt-dlploit-electron",
  version: "1.0.0",
  main: "main.js",
  dependencies: {
    "electron-is-dev": "^3.0.1"
  }
};
fs.writeFileSync(path.join(distDir, 'package.json'), JSON.stringify(packageJson, null, 2));

// Copy built client
console.log('Copying client build...');
copyFolderRecursive('client/dist', path.join(distDir, 'client/dist'));

// Copy server
console.log('Copying server...');
copyFolderRecursive('server', path.join(distDir, 'server'));

// Copy yt-dlp binary
console.log('Copying yt-dlp binary...');
copyFolderRecursive('bin', path.join(distDir, 'bin'));

// Copy node_modules (only essential ones)
console.log('Copying essential dependencies...');
const nodeModulesDir = path.join(distDir, 'node_modules');
fs.mkdirSync(nodeModulesDir);

// Copy electron-is-dev
if (fs.existsSync('node_modules/electron-is-dev')) {
  copyFolderRecursive('node_modules/electron-is-dev', path.join(nodeModulesDir, 'electron-is-dev'));
}

// Create start script
console.log('Creating start script...');
const startScript = `@echo off
echo Starting YT-DLPloit...
cd /d "%~dp0"
npm install electron --no-save
npx electron .
pause`;

fs.writeFileSync(path.join(distDir, 'start.bat'), startScript);

// Create README
const readme = `# YT-DLPloit Distribution

This is a portable distribution of YT-DLPloit.

## To run:
1. Double-click "start.bat"
2. Wait for Electron to install (first time only)
3. The application will start

## What's included:
- YT-DLPloit application
- Bundled yt-dlp binary
- All necessary dependencies

## No installation required!
Just copy this folder anywhere and run start.bat.
`;

fs.writeFileSync(path.join(distDir, 'README.txt'), readme);

console.log(`\n✅ Distribution created successfully!`);
console.log(`📁 Location: ${distDir}`);
console.log(`🚀 To test: cd yt-dlploit-dist && start.bat`);
console.log(`📦 To distribute: ZIP the entire yt-dlploit-dist folder`);
