const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, 'uploads', 'documents');

try {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Upload directory created/verified:', uploadDir);
  
  // Check permissions
  fs.accessSync(uploadDir, fs.constants.W_OK);
  console.log('Upload directory is writable');
} catch (error) {
  console.error('Error with upload directory:', error);
}