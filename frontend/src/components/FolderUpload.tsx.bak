import React, { useRef } from 'react';
import { FolderIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';

interface FolderUploadProps {
  onFilesSelected: (files: File[]) => void;
  isUploading: boolean;
}

const FolderUpload: React.FC<FolderUploadProps> = ({ onFilesSelected, isUploading }) => {
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      
      // Filter out system files and only keep allowed file types
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.heic'];
      const validFiles = fileArray.filter(file => {
        const fileName = file.name.toLowerCase();
        // Skip hidden files and system files
        if (fileName.startsWith('.') || fileName === 'thumbs.db' || fileName === 'desktop.ini') {
          return false;
        }
        // Check if file has an allowed extension
        return allowedExtensions.some(ext => fileName.endsWith(ext));
      });

      if (validFiles.length > 0) {
        console.log(`Found ${validFiles.length} valid files in folder`);
        onFilesSelected(validFiles);
      } else {
        alert('No valid documents found in the selected folder. Supported formats: PDF, Word, Excel, Text, and Images.');
      }
    }
  };

  const triggerFolderSelect = () => {
    folderInputRef.current?.click();
  };

  return (
    <div>
      <input
        ref={folderInputRef}
        type="file"
        onChange={handleFolderSelect}
        style={{ display: 'none' }}
        // @ts-ignore - webkitdirectory is not in the TypeScript definitions
        webkitdirectory=""
        directory=""
        multiple
      />
      
      <button
        onClick={triggerFolderSelect}
        disabled={isUploading}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
      >
        <FolderIcon className="h-5 w-5 mr-2" />
        Upload Entire Folder
      </button>
      
      {isUploading && (
        <div className="inline-flex items-center ml-3 text-sm text-gray-500">
          <CloudArrowUpIcon className="animate-pulse h-5 w-5 mr-1" />
          Uploading folder contents...
        </div>
      )}
    </div>
  );
};

export default FolderUpload;