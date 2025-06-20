/**
 * Test Script for Chat API Endpoint
 * 
 * Run this script to test the chat endpoint functionality:
 * node src/app/api/chat/test-endpoint.js
 */

const testChatEndpoint = async () => {
  const API_URL = 'http://localhost:3000/api/chat';
  
  const testMessage = {
    messages: [
      {
        role: 'user',
        content: 'Hello! Can you explain what a REST API is in simple terms?',
        id: 'test-msg-1'
      }
    ],
    model: 'llama-3.1-8b-instant',
    temperature: 0.7,
    maxTokens: 500
  };

  try {
    console.log('🧪 Testing Chat API Endpoint...');
    console.log('📍 URL:', API_URL);
    console.log('📨 Sending message:', testMessage.messages[0].content);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real testing, you'd need a valid Clerk session token
        'Authorization': 'Bearer your-clerk-session-token'
      },
      body: JSON.stringify(testMessage)
    });

    console.log('📋 Response Status:', response.status);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      console.log('✅ Request successful!');
      
      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        console.log('🔄 Streaming response:');
        console.log('---start---');
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          process.stdout.write(chunk);
        }
        
        console.log('\n---end---');
      }
    } else {
      console.log('❌ Request failed');
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Simple curl command examples
const showCurlExamples = () => {
  console.log('\n📝 Example curl commands to test the endpoint:\n');
  
  console.log('1. Basic test (will fail without auth):');
  console.log(`curl -X POST http://localhost:3000/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {
        "role": "user", 
        "content": "Hello, how are you?"
      }
    ],
    "model": "llama-3.1-8b-instant"
  }'`);
  
  console.log('\n2. Test with conversation ID:');
  console.log(`curl -X POST http://localhost:3000/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {
        "role": "user", 
        "content": "Explain quantum computing"
      }
    ],
    "conversationId": "test-conv-123",
    "model": "llama-3.3-70b-versatile",
    "temperature": 0.8,
    "maxTokens": 1000
  }'`);
  
  console.log('\n3. Test OPTIONS request (CORS):');
  console.log('curl -X OPTIONS http://localhost:3000/api/chat -v');
};

// Usage check
if (process.argv[2] === 'curl') {
  showCurlExamples();
} else if (process.argv[2] === 'test') {
  testChatEndpoint();
} else {
  console.log('🚀 Chat API Test Utilities');
  console.log('');
  console.log('Usage:');
  console.log('  node test-endpoint.js test  - Run automated test');
  console.log('  node test-endpoint.js curl  - Show curl examples');
  console.log('');
  console.log('Before testing, make sure:');
  console.log('  ✓ Next.js dev server is running (npm run dev)');
  console.log('  ✓ GROQ_API_KEY is set in .env.local');
  console.log('  ✓ Clerk authentication is configured');
} 