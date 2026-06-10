/**
 * Cryptomus Payment API client
 * Documentation: https://doc.cryptomus.com/business/payments/creating-an-invoice
 */

const crypto = require('crypto');

const API_URL = 'https://api.cryptomus.com/v1';

/**
 * Génère la signature requise par Cryptomus
 * signature = md5(base64(json_body) + API_KEY)
 */
function generateSignature(bodyStr) {
  const apiKey = process.env.CRYPTOMUS_API_KEY;
  if (!apiKey) throw new Error('CRYPTOMUS_API_KEY non configurée');

  const base64Body = Buffer.from(bodyStr).toString('base64');
  const signInput = base64Body + apiKey;
  return crypto.createHash('md5').update(signInput).digest('hex');
}

/**
 * Appel générique à l'API Cryptomus
 */
async function cryptomusRequest(endpoint, body) {
  const bodyStr = JSON.stringify(body);
  const signature = generateSignature(bodyStr);

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Merchant': process.env.CRYPTOMUS_MERCHANT_ID,
      'Sign': signature
    },
    body: bodyStr
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `API Error: ${response.status}`);
  }

  return data;
}

/**
 * Crée une commande de paiement Cryptomus
 * Retourne : { uuid, pay_url, ...data }
 */
async function createPaymentOrder({
  amount,
  currency = 'USD',
  orderId,
  description,
  metadata = {}
}) {
  const body = {
    amount: amount.toString(),
    currency,
    order_id: orderId,
    description,
    return_url: `${process.env.FRONTEND_URL}/success?type=crypto`,
    notify_url: `${process.env.BACKEND_URL || 'https://vidspark-ai-production-9ac7.up.railway.app'}/api/webhook/cryptomus`,
    is_payment_currency: true,
    metadata: JSON.stringify(metadata)
  };

  console.log('[CRYPTOMUS] Creating order:', body);
  const result = await cryptomusRequest('/payment', body);

  console.log('[CRYPTOMUS] API Response:', JSON.stringify(result, null, 2));

  if (!result.result) {
    console.error('[CRYPTOMUS] No result field in response:', result);
    throw new Error('Cryptomus API returned invalid response structure');
  }

  const paymentUrl = result.result.url || result.result.pay_url;
  if (!paymentUrl) {
    console.error('[CRYPTOMUS] No payment URL in response:', result.result);
    throw new Error('Cryptomus did not return a payment URL');
  }

  return {
    uuid: result.result.uuid,
    pay_url: paymentUrl,
    ...result
  };
}

/**
 * Récupère les détails d'une commande
 */
async function getPaymentStatus(uuid) {
  const body = { uuid };
  const signature = generateSignature(JSON.stringify(body));

  const response = await fetch(`${API_URL}/payment/info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Merchant': process.env.CRYPTOMUS_MERCHANT_ID,
      'Sign': signature
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Payment status check failed');
  }

  return data.result;
}

module.exports = {
  createPaymentOrder,
  getPaymentStatus,
  cryptomusRequest,
  generateSignature
};
