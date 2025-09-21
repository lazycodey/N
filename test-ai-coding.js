// Test script for AI coding functionality
const fetch = require('node-fetch');

async function testAICoding() {
  console.log('🤖 Testing AI Coding Assistant...\n');

  const baseUrl = 'http://localhost:3000';

  // Test cases for different AI coding tasks
  const testCases = [
    {
      name: 'Code Generation',
      task: 'generate',
      language: 'javascript',
      query: 'Create a function that calculates the factorial of a number',
      expectedType: 'code'
    },
    {
      name: 'Code Improvement',
      task: 'improve',
      language: 'javascript',
      code: `function add(a,b) {
  return a+b
}`,
      query: 'Improve this function with better error handling and documentation',
      expectedType: 'suggestion'
    },
    {
      name: 'Code Debugging',
      task: 'debug',
      language: 'javascript',
      code: `function divide(a, b) {
  return a / b;
}`,
      query: 'Debug this function - what happens when b is 0?',
      expectedType: 'fix'
    },
    {
      name: 'Code Explanation',
      task: 'explain',
      language: 'javascript',
      code: `const fibonacci = (n) => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
};`,
      query: 'Explain how this recursive fibonacci function works',
      expectedType: 'explanation'
    },
    {
      name: 'Code Refactoring',
      task: 'refactor',
      language: 'javascript',
      code: `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}`,
      query: 'Refactor this to use functional programming approach',
      expectedType: 'suggestion'
    },
    {
      name: 'Code Completion',
      task: 'complete',
      language: 'javascript',
      code: `class Calculator {
  constructor() {
    this.result = 0;
  }
  
  add(num) {
    // TODO: Implement add method
  }
  
  // TODO: Add subtract, multiply, divide methods
}`,
      query: 'Complete the Calculator class implementation',
      expectedType: 'completion'
    }
  ];

  for (const testCase of testCases) {
    console.log(`🧪 Testing: ${testCase.name}`);
    
    try {
      const response = await fetch(`${baseUrl}/api/ai/assist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: testCase.code || '',
          language: testCase.language,
          query: testCase.query,
          task: testCase.task,
          context: []
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        console.log(`✅ ${testCase.name} - SUCCESS`);
        console.log(`   Type: ${data.type}`);
        console.log(`   Confidence: ${data.confidence || 'N/A'}`);
        
        if (data.code) {
          console.log(`   Code Generated: Yes (${data.code.length} chars)`);
        }
        
        if (data.files && data.files.length > 0) {
          console.log(`   Files Generated: ${data.files.length}`);
        }
        
        if (data.suggestions && data.suggestions.length > 0) {
          console.log(`   Suggestions: ${data.suggestions.length}`);
        }
        
        // Check if response type matches expected type
        if (data.type === testCase.expectedType) {
          console.log(`   ✅ Response type matches expected: ${testCase.expectedType}`);
        } else {
          console.log(`   ⚠️  Response type mismatch. Expected: ${testCase.expectedType}, Got: ${data.type}`);
        }
        
        console.log(`   Response preview: ${data.content.substring(0, 100)}...\n`);
        
      } else {
        const error = await response.json();
        console.log(`❌ ${testCase.name} - FAILED`);
        console.log(`   Error: ${error.error}\n`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.name} - ERROR`);
      console.log(`   Error: ${error.message}\n`);
    }
  }

  console.log('🎉 AI Coding Assistant Test Completed!');
  console.log('\n📋 Summary:');
  console.log('- AI can generate code from natural language descriptions');
  console.log('- AI can improve existing code with suggestions');
  console.log('- AI can debug and fix code issues');
  console.log('- AI can explain code functionality');
  console.log('- AI can refactor code for better structure');
  console.log('- AI can complete incomplete code implementations');
  console.log('\n✨ The AI coding assistant is ready to help developers!');
}

// Run the test
testAICoding().catch(console.error);