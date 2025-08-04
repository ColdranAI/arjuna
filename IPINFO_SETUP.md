# IPinfo.io Integration Guide

This guide shows how to integrate [IPinfo.io](https://ipinfo.io) - the trusted source for IP address data used by Microsoft, Intel, WordPress, and thousands of other companies.

## 🌟 Why IPinfo.io?

### **Enterprise-Grade Accuracy**
- **10+ billion API requests daily** - Battle-tested at scale
- **99.99% uptime** - Reliable infrastructure on Google Cloud
- **Daily data updates** - Fresh, accurate geolocation data
- **Bank-grade security** - 256-bit SSL encryption

### **Comprehensive IP Data**
IPinfo.io provides much more than basic geolocation:

```json
{
  "ip": "8.8.8.8",
  "city": "Mountain View",
  "region": "California", 
  "country": "US",
  "loc": "37.4056,-122.0775",
  "timezone": "America/Los_Angeles",
  "org": "AS15169 Google LLC",
  "postal": "94043",
  "asn": {
    "asn": "AS15169",
    "name": "Google LLC",
    "domain": "google.com",
    "route": "8.8.8.0/24",
    "type": "business"
  },
  "company": {
    "name": "Google LLC",
    "domain": "google.com", 
    "type": "business"
  },
  "privacy": {
    "vpn": false,
    "proxy": false,
    "tor": false,
    "relay": false,
    "hosting": true,
    "service": ""
  },
  "carrier": {
    "name": "Verizon",
    "mcc": "310",
    "mnc": "004"
  }
}
```

## 🚀 Setup Instructions

### **Step 1: Get Your IPinfo.io Token**

1. Visit [https://ipinfo.io/signup](https://ipinfo.io/signup)
2. Sign up for a free account (50,000 requests/month)
3. Get your API token from the dashboard
4. For higher limits, check their [pricing plans](https://ipinfo.io/pricing)

### **Step 2: Add Token to Environment**

Add your IPinfo.io token to `.env`:

```bash
# IPinfo.io Integration (Optional)
IPINFO_TOKEN=your_actual_token_here
```

### **Step 3: Automatic Integration**

The system now automatically uses IPinfo.io in the geolocation fallback chain:

```javascript
// Geolocation Priority (Smart Fallback):
1. 🔥 CloudFlare Headers    (0ms - instant)
2. 🎯 IPinfo.io API        (50-100ms - high accuracy) 
3. 💾 Local Database       (<1ms - always available)
```

## 📊 Rate Limits & Pricing

### **Free Tier**
- **50,000 requests/month**
- **1,000 requests/day**  
- All core geolocation data
- Perfect for small to medium websites

### **Paid Plans**
| Plan | Requests/Month | Price | Best For |
|------|----------------|-------|----------|
| **Basic** | 250K | $99/mo | Growing websites |
| **Standard** | 500K | $249/mo | Medium traffic |
| **Business** | 1M+ | $499+/mo | High traffic sites |

### **Rate Limit Handling**

The system gracefully handles rate limits:

```javascript
// Automatic fallback when rate limited
try {
  const ipinfoResult = await this.ipinfoResolver.resolveIP(ip);
  if (ipinfoResult) return ipinfoResult;
} catch (error) {
  console.warn('IPinfo.io rate limited, using local database');
  // Automatically falls back to local database
}
```

## 🎯 Data Quality Comparison

| Provider | Accuracy | Speed | Features | Cost |
|----------|----------|-------|----------|------|
| **IPinfo.io** | ⭐⭐⭐⭐⭐ | 🚀 Fast | 🔥 Rich data | 💰 Paid |
| **CloudFlare** | ⭐⭐⭐⭐ | ⚡ Instant | 🎯 Basic geo | ✅ Free |
| **Local DB** | ⭐⭐⭐ | ⚡ Instant | 🎯 Basic geo | ✅ Free |

## 🔧 Advanced Features

### **Privacy Detection**
IPinfo.io can detect VPNs, proxies, and hosting providers:

```javascript
// Enhanced privacy detection (available with IPinfo.io)
const response = await ipinfo.lookupIp(ip);
if (response.privacy?.vpn) {
  console.log('VPN detected');
}
if (response.privacy?.proxy) {
  console.log('Proxy detected'); 
}
```

### **Company Information**
Get detailed company data for business IPs:

```javascript
// Company detection
if (response.company) {
  console.log(`Visitor from: ${response.company.name}`);
  console.log(`Company domain: ${response.company.domain}`);
  console.log(`Company type: ${response.company.type}`);
}
```

### **ASN Information**
Understand network ownership:

```javascript
// Network information
if (response.asn) {
  console.log(`ISP: ${response.asn.name}`);
  console.log(`Network: ${response.asn.route}`);
  console.log(`Type: ${response.asn.type}`);
}
```

## 📈 Analytics Enhancement

### **Enhanced Visitor Insights**

With IPinfo.io, your analytics can show:

- **🏢 Company Visitors**: "50 visitors from Google LLC"
- **🛡️ Privacy Detection**: "15% of traffic uses VPNs"
- **🌐 ISP Analysis**: "Top ISPs: Comcast, Verizon, AT&T"
- **📱 Carrier Detection**: "Mobile visitors: 60% Verizon, 25% AT&T"

### **Business Intelligence**

Perfect for B2B analytics:
- Track which companies visit your site
- Identify potential leads by company domain
- Understand your audience's network infrastructure
- Detect bot traffic more accurately

## 🔒 Privacy & Compliance

### **GDPR Compliance**
- IPinfo.io is GDPR compliant
- Data processing agreements available
- EU data residency options
- Privacy-focused IP hashing still applies

### **Data Retention**
- Your analytics system still hashes IPs
- IPinfo.io data is cached temporarily in Redis
- No raw IP data stored in your database
- Full control over data retention policies

## 🚀 Performance Optimization

### **Caching Strategy**

```javascript
// Multi-layer caching for optimal performance:

1. In-memory cache (IPinfoResolver)     - Instant lookups
2. Redis cache (24h TTL)                - Shared across instances  
3. Rate limit protection                - Automatic fallback
4. Local database fallback              - Always available
```

### **Monitoring Usage**

Track your IPinfo.io usage:

```bash
# Check your current usage
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://ipinfo.io/me

# Response includes:
{
  "requests": 1250,
  "requests_limit": 50000,
  "requests_remaining": 48750
}
```

## 🎉 Benefits Summary

✅ **Higher Accuracy**: Enterprise-grade IP intelligence  
✅ **Rich Data**: Company, ASN, privacy, carrier information  
✅ **Proven Scale**: 10+ billion requests daily  
✅ **Smart Fallback**: Graceful degradation when rate limited  
✅ **Easy Integration**: Zero configuration changes needed  
✅ **Cost Effective**: Free tier covers most small/medium sites  
✅ **Privacy Focused**: Your IP hashing strategy unchanged  

## 🔧 Configuration Options

### **Custom Resolver Setup**

If you want to use only IPinfo.io (no fallbacks):

```javascript
// In your collector initialization
import { IPinfoResolver } from '@arjuna/geo';

const geoResolver = new IPinfoResolver(process.env.IPINFO_TOKEN);
```

### **CloudFlare + IPinfo Only**

Skip local database entirely:

```javascript
// Custom hybrid without local database
class CloudFlareIPinfoResolver implements GeoResolver {
  async resolveIP(ip: string, headers?: Record<string, string>) {
    // Try CloudFlare first
    const cfResult = await cloudflareResolver.resolveIP(ip, headers);
    if (cfResult) return cfResult;
    
    // Fallback to IPinfo.io only
    return await ipinfoResolver.resolveIP(ip);
  }
}
```

Your analytics now has **enterprise-grade geolocation** with the reliability and accuracy that powers major companies worldwide! 🌍

The three-tier fallback system ensures you get the best data available while maintaining 100% uptime for your analytics. 🚀