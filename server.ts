import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Master API resolution: prioritize request header, process.env variations, fallback to default key
const DEFAULT_EXCHANGE_KEY =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0b2tlbiIsImRhdGEiOnsiaWQiOjE2OTIsImhhc2giOiJleUpwZGlJNklqTlJPV3hVWlhsSVhDOXhOVVptWjFac1lsd3ZhV3hMUVQwOUlpd2lkbUZzZFdVaU9pSnNSVkFyWVd0NVVYVnRhV3hDU21KMFoxd3ZaWFkxU1ZKV1ZIQlZaREpNV1RKdFRWUjJhRUoyYVZGQmJuQlVjV3RSUXpoQ1NHazNNa3A2Y2xsS05XNTZTVWcwTUVoUE0wOHhlVXRtWlVjd04wWlZaRWRvZVdGNE0yazVOSEIyYkU4eVdFVmlkVzFuUmpnclFUUTlJaXdpYldGaklqb2lZVE13WldSbE5UTmpaamxoT0dGa01UWTFPRFJqTURoa1kyRm1NVGxpWVdZelpEQmlZV000WldZeU1EWm1OamN5WXpRMFlUVTRNamt4TWpCbFpqUmpNeUo5In0sImlzcyI6Imh0dHBzOlwvXC9hcGkubGV0c2V4Y2hhbmdlLmlvXC9hcGlcL3YxXC9hcGkta2V5IiwiaWF0IjoxNzc3MTI5MjU5LCJleHAiOjIwOTg1MzcyNTksIm5iZiI6MTc3NzEyOTI1OSwianRpIjoiVHozMllLMmZKUGlVMm9ENCJ9.v3vOzjdXsDZIlxUdx99613-KYafHzIPLqPCtSauTl_k';

interface ApiKeyResolution {
  key: string;
  source: 'custom_header' | 'env_letsexchange' | 'env_letsexchange_api_key' | 'env_exchange_api_key' | 'env_api_key' | 'default';
  masked: string;
}

function cleanApiKeyString(val?: string): string {
  if (!val) return '';
  return String(val)
    .trim()
    .replace(/^["']|["']$/g, '') // remove accidental wrapping quotes
    .replace(/^Bearer\s+/i, '')
    .trim();
}

function resolveApiKey(req?: express.Request): ApiKeyResolution {
  // 1. Check custom header passed from client UI (user input)
  const headerKey = req?.headers['x-exchange-key'] || req?.headers['x-letsexchange-key'];
  if (headerKey) {
    const clean = cleanApiKeyString(String(headerKey));
    if (clean.length > 5) {
      return {
        key: clean,
        source: 'custom_header',
        masked: clean.length > 12 ? `${clean.slice(0, 6)}...${clean.slice(-4)}` : '******',
      };
    }
  }

  // 2. Check direct secret variable names (e.g., LETSEXCHANGE, letsexchange)
  const directSecret =
    process.env.LETSEXCHANGE ||
    (process.env as any)['letsexchange'] ||
    process.env.LETSEXCHANGE_SECRET ||
    process.env.LETSEXCHANGE_KEY ||
    process.env.LETSEXCHANGE_TOKEN;

  if (directSecret) {
    const clean = cleanApiKeyString(directSecret);
    if (clean.length > 5) {
      return {
        key: clean,
        source: 'env_letsexchange',
        masked: clean.length > 12 ? `${clean.slice(0, 6)}...${clean.slice(-4)}` : '******',
      };
    }
  }

  // 3. Check LETSEXCHANGE_API_KEY
  if (process.env.LETSEXCHANGE_API_KEY) {
    const clean = cleanApiKeyString(process.env.LETSEXCHANGE_API_KEY);
    if (clean.length > 5) {
      return {
        key: clean,
        source: 'env_letsexchange_api_key',
        masked: clean.length > 12 ? `${clean.slice(0, 6)}...${clean.slice(-4)}` : '******',
      };
    }
  }

  // 4. Check EXCHANGE_API_KEY / EXCHANGE_KEY
  const exchangeSecret = process.env.EXCHANGE_API_KEY || process.env.EXCHANGE_KEY || (process.env as any)['exchange'];
  if (exchangeSecret) {
    const clean = cleanApiKeyString(exchangeSecret);
    if (clean.length > 5) {
      return {
        key: clean,
        source: 'env_exchange_api_key',
        masked: clean.length > 12 ? `${clean.slice(0, 6)}...${clean.slice(-4)}` : '******',
      };
    }
  }

  // 5. Check any environment variable matching *letsexchange* case-insensitively
  for (const [k, v] of Object.entries(process.env)) {
    if (k.toLowerCase().includes('letsexchange') && v && v.trim().length > 5) {
      const clean = cleanApiKeyString(v);
      if (clean.length > 5) {
        return {
          key: clean,
          source: 'env_letsexchange',
          masked: clean.length > 12 ? `${clean.slice(0, 6)}...${clean.slice(-4)}` : '******',
        };
      }
    }
  }

  // 6. Generic API_KEY
  if (process.env.API_KEY && process.env.API_KEY.trim().length > 15) {
    const clean = cleanApiKeyString(process.env.API_KEY);
    return {
      key: clean,
      source: 'env_api_key',
      masked: clean.length > 12 ? `${clean.slice(0, 6)}...${clean.slice(-4)}` : '******',
    };
  }

  return {
    key: DEFAULT_EXCHANGE_KEY,
    source: 'default',
    masked: `${DEFAULT_EXCHANGE_KEY.slice(0, 6)}...${DEFAULT_EXCHANGE_KEY.slice(-4)}`,
  };
}

function getAuthHeaders(key: string): Record<string, string> {
  const cleanKey = key.trim().replace(/^Bearer\s+/i, '');
  return {
    Authorization: `Bearer ${cleanKey}`,
    'x-api-key': cleanKey,
    Accept: 'application/json',
  };
}

const EXCHANGE_BASE_URL = 'https://api.letsexchange.io/api/v1';

app.use(express.json());

// In-memory cache for coins list (refreshed every 10 mins)
let coinsCache: { data: any[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

// Health & Status endpoint handler
const handleStatus = async (req: express.Request, res: express.Response) => {
  try {
    const resolved = resolveApiKey(req);
    const start = Date.now();
    let isConnected = false;
    let latencyMs = 0;
    let errorDetail = null;

    try {
      const response = await fetch(`${EXCHANGE_BASE_URL}/coins`, {
        headers: getAuthHeaders(resolved.key),
      });
      latencyMs = Date.now() - start;
      isConnected = response.ok;
      if (!response.ok) {
        errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (e: any) {
      isConnected = false;
      errorDetail = e.message;
    }

    res.json({
      success: true,
      service: 'Omnichain DEX Engine v1',
      configured: true,
      connected: isConnected,
      latencyMs,
      keySource: resolved.source,
      keyMasked: resolved.masked,
      errorDetail,
      features: ['live_rates', 'instant_orders', 'realtime_tracking', '5600+_coins'],
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

app.get('/api/exchange/status', handleStatus);
app.get('/api/letsexchange/status', handleStatus);

// Test custom API Key endpoint handler
const handleTestKey = async (req: express.Request, res: express.Response) => {
  try {
    const rawKey = req.body?.key || req.headers['x-exchange-key'] || req.headers['x-letsexchange-key'];
    if (!rawKey || String(rawKey).trim().length < 5) {
      return res.status(400).json({ success: false, error: 'API key or token is required.' });
    }

    const cleanKey = String(rawKey).trim().replace(/^Bearer\s+/i, '').trim();
    const start = Date.now();
    const response = await fetch(`${EXCHANGE_BASE_URL}/coins`, {
      headers: getAuthHeaders(cleanKey),
    });
    const latencyMs = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      return res.json({
        success: true,
        valid: true,
        latencyMs,
        coinsCount: Array.isArray(data) ? data.length : 0,
        message: 'DEX Engine API Key validated successfully!',
      });
    } else {
      const errText = await response.text();
      return res.status(400).json({
        success: false,
        valid: false,
        latencyMs,
        error: `Validation failed (HTTP ${response.status}): ${errText}`,
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

app.post('/api/exchange/test-key', handleTestKey);
app.post('/api/letsexchange/test-key', handleTestKey);

// GET /api/exchange/coins
const handleCoins = async (req: express.Request, res: express.Response) => {
  try {
    const now = Date.now();
    if (coinsCache && now - coinsCache.timestamp < CACHE_TTL_MS) {
      return res.json({ success: true, cached: true, count: coinsCache.data.length, data: coinsCache.data });
    }

    const resolved = resolveApiKey(req);
    const response = await fetch(`${EXCHANGE_BASE_URL}/coins`, {
      headers: getAuthHeaders(resolved.key),
    });

    if (!response.ok) {
      const text = await response.text();
      if (coinsCache) {
        return res.json({ success: true, cached: true, fallback: true, count: coinsCache.data.length, data: coinsCache.data });
      }
      return res.status(response.status).json({ success: false, error: `Failed to fetch coins: ${text}` });
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      coinsCache = { data, timestamp: now };
      return res.json({ success: true, cached: false, count: data.length, data });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching coins from DEX engine:', error);
    if (coinsCache) {
      return res.json({ success: true, cached: true, fallback: true, count: coinsCache.data.length, data: coinsCache.data });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

app.get('/api/exchange/coins', handleCoins);
app.get('/api/letsexchange/coins', handleCoins);

// POST /api/exchange/info (Rate & Limits estimation)
const handleInfo = async (req: express.Request, res: express.Response) => {
  try {
    const { from, to, amount, rate_type } = req.body;
    if (!from || !to || amount === undefined) {
      return res.status(400).json({ success: false, error: 'Parameters "from", "to", and "amount" are required.' });
    }

    const resolved = resolveApiKey(req);
    const bodyPayload: Record<string, any> = {
      from: String(from).toUpperCase().trim(),
      to: String(to).toUpperCase().trim(),
      amount: String(amount),
    };

    if (rate_type === 'fixed') {
      bodyPayload.rate_type = 'fixed';
    }

    const response = await fetch(`${EXCHANGE_BASE_URL}/info`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(resolved.key),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data || data.success === false) {
      const errMsg =
        (data && (data.error || data.message || (data.errors && JSON.stringify(data.errors)))) ||
        `Rate query failed (${response.statusText})`;
      return res.status(response.status >= 400 ? response.status : 400).json({
        success: false,
        error: errMsg,
        raw: data,
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error fetching info from exchange engine:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

app.post('/api/exchange/info', handleInfo);
app.post('/api/letsexchange/info', handleInfo);

// POST /api/exchange/transaction (Create real exchange order)
const handleTransaction = async (req: express.Request, res: express.Response) => {
  try {
    const {
      coin_from,
      coin_to,
      deposit_amount,
      withdrawal,
      withdrawal_extra_id,
      rate_id,
      return_address,
      return_extra_id,
      affiliate_id,
    } = req.body;

    if (!coin_from || !coin_to || !deposit_amount || !withdrawal) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters (coin_from, coin_to, deposit_amount, withdrawal).',
      });
    }

    const resolved = resolveApiKey(req);
    const bodyPayload: Record<string, any> = {
      coin_from: String(coin_from).toUpperCase().trim(),
      coin_to: String(coin_to).toUpperCase().trim(),
      deposit_amount: String(deposit_amount),
      withdrawal: String(withdrawal).trim(),
    };

    if (withdrawal_extra_id && String(withdrawal_extra_id).trim()) {
      bodyPayload.withdrawal_extra_id = String(withdrawal_extra_id).trim();
    }
    if (rate_id) {
      bodyPayload.rate_id = rate_id;
    }
    if (return_address && String(return_address).trim()) {
      bodyPayload.return = String(return_address).trim();
      if (return_extra_id && String(return_extra_id).trim()) {
        bodyPayload.return_extra_id = String(return_extra_id).trim();
      }
    }
    if (affiliate_id) {
      bodyPayload.affiliate_id = affiliate_id;
    }

    let response = await fetch(`${EXCHANGE_BASE_URL}/transaction`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(resolved.key),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });

    let data = await response.json().catch(() => null);

    // Auto-retry without rate_id if failed due to expired rate_id
    if ((!response.ok || (data && data.success === false)) && bodyPayload.rate_id) {
      console.warn('Transaction creation failed with rate_id, retrying without rate_id...');
      delete bodyPayload.rate_id;
      response = await fetch(`${EXCHANGE_BASE_URL}/transaction`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(resolved.key),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });
      data = await response.json().catch(() => null);
    }

    if (!response.ok || !data || data.success === false) {
      const errMsg =
        (data && (data.error || data.message || (data.errors && JSON.stringify(data.errors)))) ||
        `Failed to create order on exchange engine (HTTP ${response.status})`;
      console.error('Exchange transaction error:', { status: response.status, data });
      return res.status(response.status >= 400 ? response.status : 400).json({
        success: false,
        error: errMsg,
        raw: data,
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

app.post('/api/exchange/transaction', handleTransaction);
app.post('/api/letsexchange/transaction', handleTransaction);

// GET /api/exchange/transaction/:id (Track real transaction status)
const handleTrackTx = async (req: express.Request, res: express.Response) => {
  try {
    const txId = req.params.id;
    if (!txId) {
      return res.status(400).json({ success: false, error: 'Transaction ID is required.' });
    }

    const resolved = resolveApiKey(req);
    const response = await fetch(`${EXCHANGE_BASE_URL}/transaction/${encodeURIComponent(txId)}`, {
      headers: getAuthHeaders(resolved.key),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data || data.success === false) {
      return res.status(response.status >= 400 ? response.status : 404).json({
        success: false,
        error: (data && data.error) || 'Transaction not found or status query failed.',
        raw: data,
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error querying transaction status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

app.get('/api/exchange/transaction/:id', handleTrackTx);
app.get('/api/letsexchange/transaction/:id', handleTrackTx);

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'express' });
});

// Mount Vite middleware in development, or serve static build in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TradeSwap Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
