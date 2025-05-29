import fs from 'fs/promises';
import path from 'path';

export async function ensureUploadDirectory() {
  const uploadDir = path.join(__dirname, '../../uploads/documents');
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    console.log('Upload directory ensured:', uploadDir);
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
}