const axios = require('axios');

async function testOllamaModels() {
  console.log('Testing Ollama models for stability...\n');
  
  // Get available models
  try {
    const modelsResponse = await axios.get('http://localhost:11434/api/tags');
    const models = modelsResponse.data.models || [];
    
    console.log('Available models:', models.map(m => m.name).join(', '));
    console.log('\n');
    
    // Test each model with a simple prompt
    for (const model of models) {
      console.log(`Testing model: ${model.name}`);
      console.log(`Size: ${(model.size / 1e9).toFixed(2)} GB`);
      
      try {
        const startTime = Date.now();
        const response = await axios.post('http://localhost:11434/api/generate', {
          model: model.name,
          prompt: 'Say hello in 10 words or less.',
          stream: false,
          options: {
            num_predict: 20, // Very limited response
            temperature: 0.5
          }
        }, {
          timeout: 15000 // 15 second timeout
        });
        
        const elapsed = Date.now() - startTime;
        console.log(`✓ Success in ${elapsed}ms`);
        console.log(`Response: ${response.data.response.substring(0, 50)}...`);
      } catch (error) {
        console.log(`✗ Failed: ${error.message}`);
        if (error.code === 'ECONNABORTED') {
          console.log('  (Timeout - model may be too large or slow)');
        }
      }
      
      console.log('---\n');
      
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\nRecommendations:');
    console.log('- Use smaller models (< 4GB) for better stability');
    console.log('- Consider models like "mistral:7b" or "neural-chat:7b"');
    console.log('- Avoid very large models if system resources are limited');
    
  } catch (error) {
    console.error('Failed to connect to Ollama:', error.message);
    console.log('\nMake sure Ollama is running: ollama serve');
  }
}

// Monitor system while testing
const os = require('os');
function monitorSystem() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedPercent = ((totalMem - freeMem) / totalMem * 100).toFixed(1);
  
  console.log(`\nSystem Memory: ${usedPercent}% used (${(freeMem / 1e9).toFixed(1)} GB free)`);
}

// Run the test
console.log('Starting Ollama model tests...');
monitorSystem();
testOllamaModels().then(() => {
  monitorSystem();
  console.log('\nTest complete!');
}).catch(error => {
  console.error('Test failed:', error);
});