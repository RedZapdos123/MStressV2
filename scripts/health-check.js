#!/usr/bin/env node
const http = require('http');

console.log('� MStress Platform Health Check');
console.log('================================');

async function checkService(name, url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      console.log(`✅ ${name} is running (${res.statusCode})`);
      resolve(true);
    });
    
    req.on('error', () => {
      console.log(`❌ ${name} is not accessible`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`❌ ${name} timeout`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('\n� Checking Services...');
  
  const results = await Promise.all([
    checkService('Frontend', 'http://localhost:3000'),
    checkService('Backend API', 'http://localhost:5000/api/health'),
    checkService('AI Services', 'http://localhost:8000/health')
  ]);
  
  const allHealthy = results.every(r => r);
  
  console.log('\n� Summary:');
  if (allHealthy) {
    console.log('✅ All services are healthy');
  } else {
    console.log('❌ Some services are not running');
    console.log('� Start services with: npm run dev');
  }
}

main();
