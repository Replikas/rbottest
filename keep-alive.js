// Keep-alive utility for external monitoring services
// This file can be used with cron jobs or external monitoring services

const https = require('https');
const http = require('http');

// Configuration
const config = {
    url: process.env.RENDER_EXTERNAL_URL || process.argv[2],
    interval: 14 * 60 * 1000, // 14 minutes
    timeout: 10000, // 10 seconds
    endpoint: '/health'
};

function pingService(url) {
    if (!url) {
        console.error('❌ No URL provided. Set RENDER_EXTERNAL_URL or pass as argument.');
        return;
    }

    const fullUrl = `${url}${config.endpoint}`;
    const client = url.startsWith('https') ? https : http;
    
    console.log(`🔄 Pinging ${fullUrl}...`);
    
    const req = client.get(fullUrl, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            const timestamp = new Date().toISOString();
            if (res.statusCode === 200) {
                console.log(`✅ Ping successful: ${res.statusCode} at ${timestamp}`);
                try {
                    const response = JSON.parse(data);
                    console.log(`📊 Bot status: ${response.bot || 'unknown'}`);
                    console.log(`⏱️ Uptime: ${Math.floor(response.uptime || 0)}s`);
                } catch (e) {
                    console.log('📄 Response received (non-JSON)');
                }
            } else {
                console.log(`⚠️ Ping returned: ${res.statusCode} at ${timestamp}`);
            }
        });
    }).on('error', (err) => {
        console.log(`❌ Ping failed: ${err.message} at ${new Date().toISOString()}`);
    });
    
    req.setTimeout(config.timeout, () => {
        req.destroy();
        console.log(`⏰ Ping timeout after ${config.timeout}ms`);
    });
}

// Single ping mode (for cron jobs)
if (require.main === module) {
    pingService(config.url);
}

// Continuous ping mode (for standalone monitoring)
function startContinuousPing(url) {
    console.log(`🚀 Starting continuous ping every ${config.interval / 1000 / 60} minutes`);
    
    // Initial ping
    pingService(url);
    
    // Set up interval
    setInterval(() => {
        pingService(url);
    }, config.interval);
}

// Export for use in other modules
module.exports = {
    pingService,
    startContinuousPing,
    config
};

// Usage examples:
// node keep-alive.js https://your-app.onrender.com
// node -e "require('./keep-alive').startContinuousPing('https://your-app.onrender.com')"