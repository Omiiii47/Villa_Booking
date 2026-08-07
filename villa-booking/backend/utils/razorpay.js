const crypto = require('crypto');

const RAZORPAY_URL = 'https://api.razorpay.com/v1';

const isConfigured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

/**
 * Test Mode only. Razorpay test keys always start with `rzp_test_`.
 * Live keys (`rzp_live_...`) are rejected so no real payments are ever processed.
 */
const isTestMode = () => isConfigured() && String(process.env.RAZORPAY_KEY_ID).startsWith('rzp_test_');

/**
 * Returns a human-readable setup problem, or null when Razorpay is ready for Test Mode.
 */
const setupError = () => {
  if (!isConfigured()) {
    return 'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env to enable payment links.';
  }
  if (!isTestMode()) {
    return 'Razorpay Test Mode is required. Live payments are disabled — use test keys that start with rzp_test_.';
  }
  return null;
};

const authHeader = () =>
  'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

const request = async (method, path, body) => {
  const res = await fetch(`${RAZORPAY_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data && data.error && data.error.description) || `Razorpay ${method} ${path} failed (${res.status})`);
    err.status = res.status;
    err.razorpay = data;
    throw err;
  }
  return data;
};

/**
 * Create a payment link.
 * @param {{amount:number, currency:string, description:string, referenceId:string,
 *          expireBy:number, notes:object, customer:object}} opts
 * @returns Razorpay payment link entity (contains id, short_url, amount, status, expire_by).
 */
const createPaymentLink = async (opts) => {
  const body = {
    amount: opts.amount,
    currency: opts.currency || 'INR',
    accept_partial: false,
    description: opts.description || 'Villa booking payment',
    expire_by: opts.expireBy,
    reference_id: opts.referenceId,
    notes: opts.notes || {},
    customer: opts.customer || {},
    notify: { email: true, sms: true },
  };
  return request('POST', '/payment_links', body);
};

const getPaymentLink = async (paymentLinkId) => request('GET', `/payment_links/${paymentLinkId}`);

/**
 * Verify a Razorpay webhook signature using HMAC-SHA256 of the raw body.
 * @param {string} rawBody raw request body string
 * @param {string} signature  X-Razorpay-Signature header
 * @param {string} secret     webhook secret (falls back to key secret)
 */
const verifyWebhookSignature = (rawBody, signature, secret) => {
  const s = secret || process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!s || !signature) return false;
  const expected = crypto.createHmac('sha256', s).update(rawBody).digest('hex');
  try {
    const given = Buffer.from(signature, 'hex');
    const exp = Buffer.from(expected, 'hex');
    if (given.length !== exp.length) return false;
    return crypto.timingSafeEqual(given, exp);
  } catch {
    return false;
  }
};

module.exports = { isConfigured, isTestMode, setupError, createPaymentLink, getPaymentLink, verifyWebhookSignature };