import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_KEY = process.env.API2CONVERT_KEY;
const BASE_URL = 'https://api.api2convert.com/v2';

async function testFileUpload() {
  console.log('Testing API2Convert file upload...');
  
  try {
    // Step 1: Create a simple text file for testing
    const testContent = 'This is a test file for API2Convert';
    const testFilePath = path.join(__dirname, 'test.txt');
    await fs.writeFile(testFilePath, testContent);
    
    // Step 2: Create job with remote URL approach (as shown in Go example)
    console.log('\nApproach 1: Using remote URL...');
    const jobData1 = {
      input: [{
        type: 'remote',
        source: 'https://example-files.online-convert.com/document/txt/example.txt'
      }],
      conversion: [{
        category: 'document',
        target: 'txt'
      }]
    };
    
    try {
      const response1 = await axios.post(`${BASE_URL}/jobs`, jobData1, {
        headers: {
          'x-oc-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      });
      console.log('Success with remote URL!');
      console.log('Job ID:', response1.data.id);
      console.log('Status:', response1.data.status);
    } catch (error: any) {
      console.error('Failed with remote URL:', error.response?.data);
    }
    
    // Step 3: Try with upload approach
    console.log('\nApproach 2: Using upload...');
    const jobData2 = {
      input: [{
        type: 'upload',
        source: 'https://api2convert.com/upload'
      }],
      conversion: [{
        category: 'document',
        target: 'txt'
      }]
    };
    
    try {
      const response2 = await axios.post(`${BASE_URL}/jobs`, jobData2, {
        headers: {
          'x-oc-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      });
      console.log('Created job with upload type!');
      console.log('Job:', response2.data);
      
      // Check if there's an upload URL in the response
      if (response2.data.input && response2.data.input[0]) {
        console.log('Input details:', response2.data.input[0]);
      }
    } catch (error: any) {
      console.error('Failed with upload:', error.response?.data);
    }
    
    // Clean up
    await fs.unlink(testFilePath);
    
  } catch (error: any) {
    console.error('Test failed:', error.message);
  }
}

testFileUpload();