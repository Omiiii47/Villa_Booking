const PAYMENT_HOLD_MINUTES = (() => {
  const v = Number(process.env.PAYMENT_HOLD_MINUTES);
  if (!v || Number.isNaN(v) || v <= 0) return 30;
  return Math.min(Math.max(Math.round(v), 5), 1440);
})();

const PAYMENT_HOLD_MS = PAYMENT_HOLD_MINUTES * 60 * 1000;

const holdExpiryFor = (from = new Date()) => new Date(new Date(from).getTime() + PAYMENT_HOLD_MS);

module.exports = { PAYMENT_HOLD_MINUTES, PAYMENT_HOLD_MS, holdExpiryFor };