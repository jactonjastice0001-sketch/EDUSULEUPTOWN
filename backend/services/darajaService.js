const axios = require('axios');

const BASE_URL =
  process.env.DARAJA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

function credentialsArePlaceholders() {
  const key = process.env.DARAJA_CONSUMER_KEY || '';
  const secret = process.env.DARAJA_CONSUMER_SECRET || '';
  return (
    !key || !secret ||
    key.includes('your_sandbox') || secret.includes('your_sandbox')
  );
}

async function getAccessToken() {
  const key = process.env.DARAJA_CONSUMER_KEY;
  const secret = process.env.DARAJA_CONSUMER_SECRET;
  const auth = Buffer.from(`${key}:${secret}`).toString('base64');

  const { data } = await axios.get(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` }, timeout: 10000 }
  );
  return data.access_token;
}

function timestampNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

function buildPassword(timestamp) {
  const raw = `${process.env.DARAJA_SHORTCODE}${process.env.DARAJA_PASSKEY}${timestamp}`;
  return Buffer.from(raw).toString('base64');
}

function toMsisdn(phone) {
  // Daraja wants 2547XXXXXXXX / 2541XXXXXXXX, no + or leading 0
  if (phone.startsWith('+')) return phone.slice(1);
  if (phone.startsWith('0')) return '254' + phone.slice(1);
  return phone;
}

// Triggers the STK "enter M-Pesa PIN" prompt on the payer's phone.
// Returns { ok: true, ... } on success, or { ok: false, reason } when credentials
// aren't configured yet — so the caller can fail gracefully instead of crashing.
async function initiateStkPush({ phone, amount, orderId, accountRef = 'UPTOWN' }) {
  if (credentialsArePlaceholders()) {
    return {
      ok: false,
      reason:
        'M-Pesa is not fully configured yet. Add real Daraja sandbox credentials to backend/.env to enable STK Push.',
    };
  }

  try {
    const accessToken = await getAccessToken();
    const timestamp = timestampNow();
    const password = buildPassword(timestamp);
    const msisdn = toMsisdn(phone);

    const payload = {
      BusinessShortCode: process.env.DARAJA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: msisdn,
      PartyB: process.env.DARAJA_SHORTCODE,
      PhoneNumber: msisdn,
      CallBackURL: process.env.DARAJA_CALLBACK_URL,
      AccountReference: accountRef,
      TransactionDesc: `UP TOWN order ${orderId}`,
    };

    const { data } = await axios.post(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 15000 }
    );

    return {
      ok: true,
      merchantRequestId: data.MerchantRequestID,
      checkoutRequestId: data.CheckoutRequestID,
      responseDescription: data.ResponseDescription,
    };
  } catch (err) {
    return {
      ok: false,
      reason:
        err.response?.data?.errorMessage ||
        'Could not reach Safaricom. Please try again or pay on delivery.',
    };
  }
}

module.exports = { initiateStkPush, credentialsArePlaceholders };
