import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_KEY = process.env.API2CONVERT_KEY;
const BASE_URL = 'https://api.api2convert.com/v2';

async function testAPI() {
  console.log('Testing API2Convert API...');
  console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 8)}...` : 'NOT SET');
  
  const jobData = {
    type: 'job',
    process: true,
    fail_on_input_error: true,
    fail_on_conversion_error: true,
    conversion: [{
      target: 'txt',
      category: 'document'
    }]
  };
  
  try {
    // Test 1: Try to create a job
    console.log('\nTest 1: Creating a job with /v2...');
    
    const response = await axios.post(`${BASE_URL}/jobs`, jobData, {
      headers: {
        'X-Oc-Api-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Success! Job created:', response.data);
  } catch (error: any) {
    console.error('Failed:', error.response?.status, error.response?.statusText);
    console.error('Error data:', error.response?.data);
    
    // Try without /v2
    console.log('\nTrying without /v2...');
    try {
      const response = await axios.post('https://api.api2convert.com/jobs', jobData, {
        headers: {
          'X-Oc-Api-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      });
      console.log('Success without /v2! Job created:', response.data);
    } catch (error2: any) {
      console.error('Also failed without /v2:', error2.response?.status);
    }
  }
}

testAPI();