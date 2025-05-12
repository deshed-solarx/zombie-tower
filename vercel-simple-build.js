// Using ES Module syntax for Vercel
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Vercel build process for Zombie Tower Defense...');

// Function to run shell commands as promises
const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      console.log(`stdout: ${stdout}`);
      resolve(stdout);
    });
  });
};

// Build the app and continue with cleanup
const buildApp = async () => {
  try {
    // Create the output directory
    console.log('📁 Creating output directory...');
    const distDir = path.join(__dirname, 'dist', 'public');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    
    // Run Vite build for client files
    await runCommand('npx vite build client --outDir ../dist/public');
    console.log('✅ Vite build completed');
    
    // Make sure the HTML file has the correct paths
    console.log('🔄 Updating HTML file paths...');
    const indexPath = path.join(distDir, 'index.html');
    
    // Check if the build created an index.html file
    if (fs.existsSync(indexPath)) {
      let htmlContent = fs.readFileSync(indexPath, 'utf8');
      
      // Fix asset paths if needed
      htmlContent = htmlContent.replace(/src="\//g, 'src="./');
      htmlContent = htmlContent.replace(/href="\//g, 'href="./');
      
      // Write the modified HTML back
      fs.writeFileSync(indexPath, htmlContent);
      console.log('✅ HTML paths updated');
    } else {
      // Create a fallback HTML file
      console.log('⚠️ No index.html found, creating fallback...');
      const fallbackHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zombie Tower Defense</title>
  <link rel="stylesheet" href="./assets/index.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./assets/index.js"></script>
</body>
</html>`;
      
      fs.writeFileSync(indexPath, fallbackHTML);
      console.log('✅ Created fallback HTML file');
    }
    
    // Create a success marker file
    fs.writeFileSync(
      path.join(distDir, 'build-success.txt'), 
      `Build completed at ${new Date().toISOString()}\nZombie Tower Defense is ready!`
    );
    
    console.log('🎉 Build process completed successfully!');
  } catch (error) {
    console.error('❌ Build process failed:', error);
    process.exit(1);
  }
};

// Run the build process
buildApp();