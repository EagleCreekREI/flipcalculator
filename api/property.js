// Vercel Serverless Function - Property Data API Proxy
// This bypasses CORS restrictions by calling Attom Data API from the server side

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const ATTOM_API_KEY = '8e022b49b60512a2f7ba0e269ca89a6d';
  const { endpoint, address, latitude, longitude, radius, minsaleamt } = req.query;

  function parseAddress(addr) {
    const parts = addr.split(',').map(p => p.trim());
    if (parts.length >= 3) {
      return { address1: parts[0], address2: parts.slice(1).join(', ') };
    } else if (parts.length === 2) {
      return { address1: parts[0], address2: parts[1] };
    }
    return null;
  }

  try {
    let url;

    if (endpoint === 'property') {
      const parsed = parseAddress(address);
      if (!parsed) return res.status(400).json({ error: 'Invalid address format. Use: 123 Main St, City, State ZIP' });
      url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail?address1=${encodeURIComponent(parsed.address1)}&address2=${encodeURIComponent(parsed.address2)}`;

    } else if (endpoint === 'comps') {
      const rad = radius || '0.5';
      const saleAmt = minsaleamt || '1000';
      // Date filtering is done client-side — ATTOM rejects minsaledate param
      url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot?latitude=${latitude}&longitude=${longitude}&radius=${rad}&minsaleamt=${saleAmt}`;

    } else if (endpoint === 'avm') {
      const parsed = parseAddress(address);
      if (!parsed) return res.status(400).json({ error: 'Invalid address format.' });
      url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/attomavm/detail?address1=${encodeURIComponent(parsed.address1)}&address2=${encodeURIComponent(parsed.address2)}`;

    } else {
      return res.status(400).json({ error: 'Invalid endpoint. Use: property, comps, or avm' });
    }

    console.log('Fetching:', url);

    const response = await fetch(url, {
      headers: {
        'apikey': ATTOM_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Attom API Error:', response.status, errorText);
      return res.status(response.status).json({ error: 'API request failed', status: response.status, message: errorText, requestedUrl: url });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
  
