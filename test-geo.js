import { defaultGeoResolver } from './packages/geo/src/index.ts';

async function testGeoIP() {
  console.log('🌍 Testing Geo IP Resolution...\n');
  
  const testIPs = [
    '8.8.8.8',      // Google DNS (US)
    '1.1.1.1',      // Cloudflare DNS (US)
    '208.67.222.222', // OpenDNS (US)
    '127.0.0.1',    // Localhost (should return null)
  ];

  for (const ip of testIPs) {
    try {
      console.log(`Testing IP: ${ip}`);
      const result = await defaultGeoResolver.resolveIP(ip);
      
      if (result) {
        console.log(`✅ Success: ${JSON.stringify(result, null, 2)}`);
      } else {
        console.log(`⚠️  No result (expected for private IPs)`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    console.log('---');
  }
}

testGeoIP().catch(console.error);