const fs = require('fs');
const path = require('path');

// 👇 CHANGE YOUR IP ADDRESS HERE 👇
const MY_NEW_IP = "192.168.1.13";

// It will use the IP from the command line if provided, otherwise it uses MY_NEW_IP
const newIp = process.argv[2] || MY_NEW_IP;

if (!newIp) {
  console.error("❌ Please provide a new IP address.");
  process.exit(1);
}

console.log(`🔄 Updating IP addresses to: ${newIp} ...\n`);

const replacements = [
  {
    file: 'web/.env',
    regex: /VITE_API_URL=.*/g,
    replacement: `VITE_API_URL=http://${newIp}:3005`
  },
  {
    file: 'mobile/.env',
    regex: /EXPO_PUBLIC_API_URL=.*/g,
    replacement: `EXPO_PUBLIC_API_URL=http://${newIp}:3005`
  },
  {
    file: 'web/src/context/AuthContext.jsx',
    regex: /const API_BASE_URL = 'http:\/\/(?:[0-9\.]+|localhost):\d+'/g,
    replacement: `const API_BASE_URL = 'http://${newIp}:3005'`
  },
  {
    file: 'web/src/services/api.js',
    regex: /const API_BASE_URL = import\.meta\.env\?\.VITE_API_URL \|\| 'http:\/\/(?:[0-9\.]+|localhost):\d+'/g,
    replacement: `const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://${newIp}:3005'`
  },
  {
    file: 'backend/src/services/emailService.js',
    regex: /const loginUrl = 'http:\/\/(?:[0-9\.]+|localhost):\d+\/login'/g,
    replacement: `const loginUrl = 'http://${newIp}:5173/login'`
  },
  {
    file: 'backend/src/routes/owners.js',
    regex: /http:\/\/(?:[0-9\.]+|localhost):\d+\/set-password/g,
    replacement: `http://${newIp}:5173/set-password`
  },
  {
    file: 'backend/src/routes/owners.js',
    regex: /http:\/\/(?:[0-9\.]+|localhost):\d+\/reset-password/g,
    replacement: `http://${newIp}:5173/reset-password`
  },
  {
    file: 'backend/src/server.js',
    regex: /Server running at http:\/\/(?:[0-9\.]+|localhost):\$\{PORT\}/g,
    replacement: 'Server running at http://' + newIp + ':\\${PORT}'
  }
];

let updatedCount = 0;

replacements.forEach(({ file, regex, replacement }) => {
  const filePath = path.join(__dirname, file);

  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const updatedContent = content.replace(regex, replacement);

    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated: ${file}`);
      updatedCount++;
    } else {
      console.log(`ℹ️  No changes needed (already matches or pattern not found): ${file}`);
    }
  } else {
    // If it's an environment file, create it
    if (file.endsWith('.env')) {
      fs.writeFileSync(filePath, replacement + '\n', 'utf8');
      console.log(`✅ Created and updated: ${file}`);
      updatedCount++;
    } else {
      console.log(`❌ File not found: ${file}`);
    }
  }
});

console.log(`\n🎉 Done! Successfully modified ${updatedCount} locations.`);
