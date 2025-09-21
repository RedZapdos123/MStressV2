#!/usr/bin/env node
const http = require('http');

console.log('Ìø• MStress Platform Health Check');
console.log('================================');

async function checkService(name, url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      console.log(`‚úÖ ${name} is running (${res.statusCode})`);
      resolve(true);
    });
    
    req.on('error', () => {
      console.log(`‚ùå ${name} is not accessible`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`‚ùå ${name} timeout`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('\nÌ¥ç Checking Services...');
  
  const results = await Promise.all([
    checkService('Frontend', 'http://localhost:3000'),
    checkService('Backend API', 'http://localhost:5000/api/health'),
    checkService('AI Services', 'http://localhost:8000/health')
  ]);
  
  const allHealthy = results.every(r => r);
  
  console.log('\nÌ≥ä Summary:');
  if (allHealthy) {
    console.log('‚úÖ All services are healthy');
  } else {
    console.log('‚ùå Some services are not running');
    console.log('Ì≤° Start services with: npm run dev');
  }
}

main();
