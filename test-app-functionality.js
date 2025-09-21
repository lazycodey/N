// Test script to verify the Replit Clone functionality
const fetch = require('node-fetch');

async function testApp() {
  console.log('🧪 Testing Replit Clone Application...\n');

  // Test 1: Check if the landing page loads
  try {
    console.log('1. Testing landing page...');
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('✅ Landing page loaded successfully');
    } else {
      console.log('❌ Landing page failed to load');
    }
  } catch (error) {
    console.log('❌ Could not connect to the application');
    return;
  }

  // Test 2: Create a project
  try {
    console.log('\n2. Testing project creation...');
    const projectData = {
      name: 'Test Project',
      description: 'A test project',
      language: 'javascript',
      ownerId: 'test-user-id',
      files: [
        {
          name: 'index.js',
          content: 'console.log("Hello, World!");',
          language: 'javascript',
          path: '/index.js'
        }
      ]
    };

    const createResponse = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });

    if (createResponse.ok) {
      const project = await createResponse.json();
      console.log('✅ Project created successfully');
      console.log(`   Project ID: ${project.id}`);
      console.log(`   Project Name: ${project.name}`);
      console.log(`   Files: ${project.files.length}`);

      // Test 3: Update a file
      console.log('\n3. Testing file update...');
      const fileUpdateResponse = await fetch(`http://localhost:3000/api/projects/${project.id}/files/${project.files[0].id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: 'console.log("Updated Hello, World!");' }),
      });

      if (fileUpdateResponse.ok) {
        console.log('✅ File updated successfully');
      } else {
        console.log('❌ File update failed');
      }

      // Test 4: Execute code
      console.log('\n4. Testing code execution...');
      const executeResponse = await fetch(`http://localhost:3000/api/projects/${project.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: 'node index.js',
          files: project.files
        }),
      });

      if (executeResponse.ok) {
        const result = await executeResponse.json();
        console.log('✅ Code executed successfully');
        console.log(`   Output: ${result.output || 'No output'}`);
        console.log(`   Error: ${result.error || 'No error'}`);
      } else {
        console.log('❌ Code execution failed');
      }

    } else {
      const error = await createResponse.json();
      console.log('❌ Project creation failed');
      console.log(`   Error: ${error.error}`);
    }
  } catch (error) {
    console.log('❌ Error testing project creation:', error.message);
  }

  console.log('\n🎉 Test completed!');
}

// Run the test
testApp().catch(console.error);