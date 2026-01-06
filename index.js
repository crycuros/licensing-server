const express = require('express');
const cors = require('cors');
const supabase = require('./lib/supabase');
const { encrypt } = require('./lib/crypto');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('License Server is Running');
});

// Verify License Endpoint
app.post('/api/verify', async (req, res) => {
  const { licenseKey, domain } = req.body;

  if (!licenseKey || !domain) {
    return res.status(400).json({ error: 'Missing license key or domain' });
  }

  try {
    // 1. Check if license exists in Supabase
    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('key', licenseKey)
      .single();

    if (error || !license) {
      return res.status(401).json({ 
        status: 'invalid', 
        message: 'License key not found' 
      });
    }

    // 2. Check status
    if (license.status !== 'active') {
      return res.status(403).json({ 
        status: 'inactive', 
        message: 'License is inactive or suspended' 
      });
    }

    // 3. Check domain binding (optional: if you want to lock to one domain)
    if (license.domain && license.domain !== domain) {
      // Allow localhost for dev
      if (!domain.includes('localhost') && !domain.includes('127.0.0.1')) {
        return res.status(403).json({ 
          status: 'invalid_domain', 
          message: 'License is registered to another domain' 
        });
      }
    }

    // 4. Bind domain if not set (First use)
    if (!license.domain && !domain.includes('localhost')) {
      await supabase
        .from('licenses')
        .update({ domain: domain, activated_at: new Date() })
        .eq('id', license.id);
    }

    // 5. Generate encrypted response
    // The client will decrypt this to verify authenticity
    const responseData = {
      valid: true,
      licenseKey: licenseKey,
      type: license.type, // e.g., 'standard', 'extended'
      expiry: license.expiry_date,
      checkTimestamp: Date.now()
    };

    const encryptedResponse = encrypt(responseData);

    return res.json({
      status: 'active',
      data: encryptedResponse // Client must decrypt this
    });

  } catch (err) {
    console.error('License check error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Activate License Endpoint (optional, for manual activation via API)
app.post('/api/activate', async (req, res) => {
  const { licenseKey, domain } = req.body;
  // Implementation similar to verify but focuses on setting the domain
  // ...
});

const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL && !process.env.NOW_REGION) {
  app.listen(PORT, () => {
    console.log(`License server running on port ${PORT}`);
  });
}

module.exports = app;
