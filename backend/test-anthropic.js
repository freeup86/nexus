require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

async function testAnthropic() {
  console.log('Testing Anthropic API...');
  console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
  console.log('API Key length:', process.env.ANTHROPIC_API_KEY?.length);
  
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Say hello in one sentence.'
        }
      ]
    });
    
    console.log('Success! Response:', response.content[0].text);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

testAnthropic();