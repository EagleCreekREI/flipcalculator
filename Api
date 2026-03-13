// Vercel Serverless Function - Property Data API Proxy
// This bypasses CORS restrictions by calling Attom Data API from the server side

export default async function handler(req, res) {
  // Enable CORS for your domain
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // In production, replace with your domain
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const ATTOM_API_KEY = '8e022b49b60512a2f7ba0e269ca89a6d';
  const { endpoint, address, latitude, longitude, radius } = req.query;

  try {
    let url;

    if (endpoint === 'property') {
      // Get property details by address
      // Split address into address1 (street) and address2 (city, state, zip)
      // Example: "123 Main St, Tulsa, OK 74135" -> address1="123 Main St" address2="Tulsa, OK 74135"
      const addressParts = address.split(',').map(p => p.trim());
      
      let address1, address2;
      if (addressParts.length >= 3) {
        // Format: "123 Main St, Tulsa, OK 74135"
        address1 = addressParts[0]; // "123 Main St"
        address2 = addressParts.slice(1).join(', '); // "Tulsa, OK 74135"
      } else if (addressParts.length === 2) {
        // Format: "123 Main St, Tulsa OK"
        address1 = addressParts[0];
        address2 = addressParts[1];
      } else {
        return res.status(400).json({ 
          error: 'Invalid address format. Please use: "123 Main St, City, State ZIP"' 
        });
      }
      
      url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/address?address1=${encodeURIComponent(address1)}&address2=${encodeURIComponent(address2)}`;
    } else if (endpoint === 'comps') {
      // Get comparable sales
      url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot?latitude=${latitude}&longitude=${longitude}&radius=${radius || 0.5}&minsaleamt=1000&minsaledate=2022-01-01`;
    } else {
      return res.status(400).json({ error: 'Invalid endpoint' });
    }

    const response = await fetch(url, {
      headers: {
        'apikey': ATTOM_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Attom API Error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'API request failed',
        status: response.status,
        message: errorText
      });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}
