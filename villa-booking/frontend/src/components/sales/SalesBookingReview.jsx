'use client'
import { useState, useEffect } from 'react';
import {
  FaTimes, FaSave, FaCheck, FaBan, FaCreditCard,
  FaCalendarCheck, FaHistory, FaMoneyBillWave,
  FaLink, FaCopy, FaRedo, FaTrash,
} from 'react-icons/fa';
import * as salesService from '../../services/salesService';
import SalesPricingEditor from './SalesPricingEditor';

const num = (v) => (v === '' || v === null || v === undefined ? 0 : Number(v));

const REJECT_REASONS = [
  'Dates unavailable',
  'Villa unavailable',
  'Maximum occupancy exceeded',
  'Maintenance',
  'Duplicate booking',
  'Other',
];

const reviewBadge = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const bookingBadge = {
  PAYMENT_PENDING: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-gray-300 text-gray-700',
  COMPLETED: 'bg-violet-100 text-violet-700',
};

const paymentBadge = {
  UNPAID: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-amber-100 text-amber-700',
  LINK_SENT: 'bg-blue-100 text-blue-700',
  LINK_EXPIRED: 'bg-orange-100 text-orange-700',
  PAID: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-purple-100 text-purple-700',
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : '—');

const lockBodyScroll = () => {
  const prev = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const lenis = window.__lenis;
  if (lenis && typeof lenis.stop === 'function') lenis.stop();
  return () => {
    document.body.style.overflow = prev;
    const l = window.__lenis;
    if (l && typeof l.start === 'function') l.start();
  };
};

const SalesBookingReview = ({ booking, villas, onClose, onSaved }) => {
  const prev = booking.customPricing || {};
  const [f, setF] = useState({
    villa: booking.villa?._id || '',
    checkIn: booking.checkIn ? new Date(booking.checkIn).toISOString().split('T')[0] : '',
    checkOut: booking.checkOut ? new Date(booking.checkOut).toISOString().split('T')[0] : '',
    adults: booking.adults ?? booking.guests ?? 1,
    kids: booking.kids ?? 0,
    infants: booking.infants ?? 0,
    pets: booking.pets ?? 0,
    purposeOfStay: booking.purposeOfStay || '',
    arrivalTime: booking.arrivalTime || '',
    specialRequests: booking.specialRequests || '',
    customerPhone: booking.customerPhone || '',
    customerCountry: booking.customerCountry || '',
    internalNotes: booking.internalNotes || '',
  });
  const [pricing, setPricing] = useState({
    basePrice: prev.basePrice ?? booking.villa?.pricePerNight ?? 0,
    extraGuestFee: prev.extraGuestFee ?? 0,
    extraGuestCount: prev.extraGuestCount ?? booking.extraGuests ?? 0,
    cleaningFee: prev.cleaningFee ?? 0,
    additionalServices: prev.additionalServices ?? 0,
    housekeepingCharges: prev.housekeepingCharges ?? 0,
    beddingCharges: prev.beddingCharges ?? 0,
    securityCharges: prev.securityCharges ?? 0,
    transportation: prev.transportation ?? 0,
    chefServices: prev.chefServices ?? 0,
    decoration: prev.decoration ?? 0,
    airportPickup: prev.airportPickup ?? 0,
    discount: prev.discount ?? 0,
    complimentaryServices: prev.complimentaryServices ?? '',
    overrideAmount: prev.overrideAmount ?? '',
    offerMessage: prev.offerMessage ?? '',
  });
  const [paymentLink, setPaymentLink] = useState(booking.paymentLink || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [rejectCat, setRejectCat] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentId, setPaymentId] = useState(booking.paymentId || '');
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [linkBusy, setLinkBusy] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => lockBodyScroll(), []);

  const reviewStatus = booking.reviewStatus || 'PENDING';
  const bookingStatus = booking.bookingStatus || 'PAYMENT_PENDING';
  const nights = f.checkIn && f.checkOut ? Math.max(1, Math.ceil((new Date(f.checkOut) - new Date(f.checkIn)) / (1000 * 60 * 60 * 24))) : booking.nights || 1;
  const overCapacity = (booking.extraGuests || 0) > 0;
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });
  const setP2 = (key, value) => setPricing({ ...pricing, [key]: value });

  const toPricingPayload = () => ({
    basePrice: num(pricing.basePrice), extraGuestFee: num(pricing.extraGuestFee), extraGuestCount: num(pricing.extraGuestCount),
    cleaningFee: num(pricing.cleaningFee), additionalServices: num(pricing.additionalServices), housekeepingCharges: num(pricing.housekeepingCharges),
    beddingCharges: num(pricing.beddingCharges), securityCharges: num(pricing.securityCharges), transportation: num(pricing.transportation),
    chefServices: num(pricing.chefServices), decoration: num(pricing.decoration), airportPickup: num(pricing.airportPickup),
    discount: num(pricing.discount), complimentaryServices: pricing.complimentaryServices,
    overrideAmount: pricing.overrideAmount === '' ? null : num(pricing.overrideAmount), offerMessage: pricing.offerMessage,
  });

  const commonFields = {
    villa: f.villa, checkIn: f.checkIn, checkOut: f.checkOut, adults: num(f.adults), kids: num(f.kids),
    infants: num(f.infants), pets: num(f.pets), purposeOfStay: f.purposeOfStay, arrivalTime: f.arrivalTime,
    specialRequests: f.specialRequests, customerPhone: f.customerPhone, customerCountry: f.customerCountry,
    internalNotes: f.internalNotes,
  };

  const run = async (fn) => {
    setSaving(true);
    setErr('');
    try { await fn(); onSaved(); }
    catch (e) { setErr(e.response?.data?.message || 'Action failed'); }
    setSaving(false);
  };

  const handleSave = () => run(() => salesService.updateBooking(booking._id, { ...commonFields, customPricing: toPricingPayload(), paymentLink }));
  const handleApprove = () => {
    run(() => salesService.approveBooking(booking._id, {
      customPricing: toPricingPayload(),
      paymentLink: paymentLink || undefined,
      approvalReason: pricing.offerMessage,
    }));
  };
  const handleRejectConfirm = () => {
    const reason = [rejectCat, rejectReason].filter(Boolean).join(' — ');
    if (!reason) { setErr('Please provide a rejection reason.'); return; }
    run(() => salesService.rejectBooking(booking._id, { rejectionReason: reason }));
  };
  const handleConfirmPayment = () => run(() => salesService.confirmPayment(booking._id, { paymentId }));
  const handleComplete = () => run(() => salesService.completeBooking(booking._id));
  const handleCancelConfirm = () => run(() => salesService.cancelBooking(booking._id, { reason: cancelReason || 'Cancelled by Sales Team' }));

  const handleGenerateLink = () => run(async () => {
    setLinkBusy(true);
    const data = await salesService.createPaymentLink(booking._id, {});
    setPaymentDetails(data);
    setLinkBusy(false);
  });
  const handleViewDetails = async () => {
    try {
      setPaymentDetails(await salesService.getPaymentDetails(booking._id));
      setShowHistory(false);
    } catch (e) { setErr(e.response?.data?.message || 'Could not load payment details'); }
  };
  const handleViewHistory = async () => {
    try {
      const data = await salesService.getPaymentHistory(booking._id);
      setPaymentHistory(data.paymentHistory || []);
      setShowHistory(true);
    } catch (e) { setErr(e.response?.data?.message || 'Could not load payment history'); }
  };
  const handleCopyLink = () => {
    const url = paymentDetails?.paymentLink || booking.paymentLink;
    if (!url) return;
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    else setCopied(true);
  };
  const handleClearLink = () => {
    if (!window.confirm('Remove the current payment link? The customer will no longer be able to pay with it.')) return;
    run(() => salesService.clearPaymentLink(booking._id));
  };

  const activeLinkUrl = paymentDetails?.paymentLink || booking.paymentLink;
  const linkExpiresAt = paymentDetails?.paymentLinkExpiresAt || booking.paymentLinkExpiresAt;

  const details = [
    { label: 'Customer', value: booking.customerName || booking.user?.name },
    { label: 'Email', value: booking.customerEmail || booking.user?.email },
    { label: 'Phone', value: booking.customerPhone || booking.user?.phone || '—' },
    { label: 'Country', value: booking.customerCountry || '—' },
    { label: 'Villa', value: booking.villa?.name },
    { label: 'Max Capacity', value: `${booking.standardCapacity || booking.villa?.capacity || '—'} guests` },
    { label: 'Check-in', value: fmtDate(booking.checkIn) },
    { label: 'Check-out', value: fmtDate(booking.checkOut) },
    { label: 'Nights', value: booking.nights },
    { label: 'Guests', value: `${booking.guests} (${booking.adults}A${booking.kids ? `/${booking.kids}C` : ''}${booking.infants ? `/${booking.infants}I` : ''}${booking.pets ? `/${booking.pets}P` : ''})` },
    { label: 'Booking Date', value: fmtDate(booking.createdAt) },
    { label: 'Estimated', value: `$${(booking.estimatedPrice ?? booking.totalPrice)?.toLocaleString()}` },
  ];

  const actions = [];
  if (reviewStatus === 'PENDING') {
    actions.push({ key: 'save', label: 'Save', icon: FaSave, style: 'bg-gray-800 hover:bg-gray-900', onClick: handleSave });
    actions.push({ key: 'approve', label: 'Approve & Generate Payment Link', icon: FaCheck, style: 'bg-green-600 hover:bg-green-700', onClick: handleApprove });
    actions.push({ key: 'reject', label: 'Reject', icon: FaBan, style: 'bg-red-500 hover:bg-red-600', onClick: () => setShowReject(true) });
  } else if (reviewStatus === 'APPROVED') {
    actions.push({ key: 'save', label: 'Update Quotation', icon: FaSave, style: 'bg-gray-800 hover:bg-gray-900', onClick: handleSave });
    if (bookingStatus === 'PAYMENT_PENDING') {
      if (activeLinkUrl) {
        actions.push({ key: 'pay', label: 'Confirm Payment', icon: FaCreditCard, style: 'bg-emerald-600 hover:bg-emerald-700', onClick: () => setShowPayment(true) });
      }
      actions.push({ key: 'cancel', label: 'Cancel Booking', icon: FaTimes, style: 'bg-red-500 hover:bg-red-600', onClick: () => setShowCancel(true) });
    } else if (bookingStatus === 'CONFIRMED') {
      actions.push({ key: 'complete', label: 'Mark Completed', icon: FaCalendarCheck, style: 'bg-violet-600 hover:bg-violet-700', onClick: handleComplete });
      actions.push({ key: 'cancel', label: 'Cancel Booking', icon: FaTimes, style: 'bg-red-500 hover:bg-red-600', onClick: () => setShowCancel(true) });
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overscroll-contain" onClick={onClose}>
      <div data-lenis-prevent className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] min-h-0 overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white flex items-start justify-between p-6 pb-4 border-b border-gray-100 z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-2xl">Booking Review</h3>
              {overCapacity && <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700">⚠ Over Capacity</span>}
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <span className={`text-xs uppercase tracking-widest px-2 py-1 rounded-full ${reviewBadge[reviewStatus]}`}>Review: {reviewStatus}</span>
              <span className={`text-xs uppercase tracking-widest px-2 py-1 rounded-full ${bookingBadge[bookingStatus]}`}>Booking: {bookingStatus}</span>
              <span className={`text-xs uppercase tracking-widest px-2 py-1 rounded-full ${paymentBadge[booking.paymentStatus] || paymentBadge.UNPAID}`}>Payment: {booking.paymentStatus || 'UNPAID'}</span>
              {booking.offerSent && <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">Offer sent</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
        </div>

        <div className="p-6 space-y-6">
          {err && <div className="bg-red-50 text-red-500 text-sm p-3 rounded-2xl">⚠ {err}</div>}

          <div>
            <h4 className="font-medium mb-3">Request Details</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 bg-luxury-cream rounded-2xl p-5">
              {details.map((d) => (
                <div key={d.label}>
                  <div className="text-xs uppercase tracking-widest text-gray-500">{d.label}</div>
                  <div className="font-medium text-sm mt-0.5 break-words">{d.value}</div>
                </div>
              ))}
              <div>
                <div className="text-xs uppercase tracking-widest text-gray-500">Purpose of Stay</div>
                <div className="font-medium text-sm mt-0.5 break-words">{booking.purposeOfStay || '—'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-gray-500">Arrival Time</div>
                <div className="font-medium text-sm mt-0.5">{booking.arrivalTime || '—'}</div>
              </div>
            </div>
            {overCapacity && (
              <div className="mt-3 p-3 rounded-2xl bg-orange-50 border border-orange-200 text-orange-800 text-sm">
                Requested {booking.requestedGuests} guests for a max capacity of {booking.standardCapacity} ({booking.extraGuests} extra). Requires manual review.
              </div>
            )}
            {booking.specialRequests && <p className="mt-3 text-sm text-gray-600"><b>Special Requests:</b> {booking.specialRequests}</p>}
          </div>

          {reviewStatus === 'PENDING' && (
            <div>
              <h4 className="font-medium mb-3">Edit Villa, Dates &amp; Guests</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Villa</label>
                  <select value={f.villa} onChange={set('villa')} className="input-field rounded-xl w-full">
                    {villas.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Check-in</label><input type="date" value={f.checkIn} onChange={set('checkIn')} className="input-field rounded-xl w-full" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Check-out</label><input type="date" value={f.checkOut} onChange={set('checkOut')} className="input-field rounded-xl w-full" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Adults</label><input type="number" min="1" value={f.adults} onChange={set('adults')} className="input-field rounded-xl w-full" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Children</label><input type="number" min="0" value={f.kids} onChange={set('kids')} className="input-field rounded-xl w-full" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Infants</label><input type="number" min="0" value={f.infants} onChange={set('infants')} className="input-field rounded-xl w-full" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Pets</label><input type="number" min="0" value={f.pets} onChange={set('pets')} className="input-field rounded-xl w-full" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Total Guests</label><div className="flex items-center h-11 px-3 rounded-xl bg-luxury-cream text-sm font-medium">{num(f.adults) + num(f.kids) + num(f.infants)}</div></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Purpose of Stay</label><input value={f.purposeOfStay} onChange={set('purposeOfStay')} className="input-field rounded-xl w-full" placeholder="e.g. Vacation, Wedding" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Arrival Time</label><input type="time" value={f.arrivalTime} onChange={set('arrivalTime')} className="input-field rounded-xl w-full" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Phone</label><input value={f.customerPhone} onChange={set('customerPhone')} className="input-field rounded-xl w-full" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Country</label><input value={f.customerCountry} onChange={set('customerCountry')} className="input-field rounded-xl w-full" /></div>
              </div>
              <textarea value={f.specialRequests} onChange={set('specialRequests')} rows={2} className="input-field rounded-xl w-full mt-3 resize-none" placeholder="Special requests" />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">{reviewStatus === 'APPROVED' ? 'Final Quotation' : 'Custom Pricing'}</h4>
              <span className="text-xs text-gray-500">{nights} nights</span>
            </div>
            <SalesPricingEditor pricing={pricing} onChange={setP2} nights={nights} />
            <label className="block text-xs font-medium text-gray-600 mt-3 mb-1">Offer Message to Customer</label>
            <textarea value={pricing.offerMessage} onChange={(e) => setP2('offerMessage', e.target.value)} rows={2} className="input-field rounded-xl w-full resize-none" placeholder="Visible to the customer with their booking offer" />
            <label className="block text-xs font-medium text-gray-600 mt-3 mb-1">Payment Link (optional)</label>
            <input value={paymentLink} onChange={(e) => setPaymentLink(e.target.value)} className="input-field rounded-xl w-full" placeholder="https://payment-gateway.example.com/pay/..." />
          </div>

          {reviewStatus === 'APPROVED' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-2xl bg-green-50 border border-green-200 p-4">
              <div><div className="text-xs uppercase tracking-widest text-gray-500">Quoted Price</div><div className="font-display text-xl text-green-700">${(booking.quotedPrice ?? booking.customPricing?.totalAmount ?? 0).toLocaleString()}</div></div>
              <div><div className="text-xs uppercase tracking-widest text-gray-500">Final Price</div><div className="font-display text-xl text-green-700">${(booking.finalPrice ?? booking.quotedPrice ?? 0).toLocaleString()}</div></div>
              <div><div className="text-xs uppercase tracking-widest text-gray-500">Approved By</div><div className="font-medium text-sm mt-1">{booking.approvedBy?.name || '—'}<div className="text-xs text-gray-500">{fmtDateTime(booking.approvedAt)}</div></div></div>
            </div>
          )}

          {reviewStatus === 'APPROVED' && booking.paymentStatus !== 'PAID' && (
            <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h4 className="font-medium flex items-center gap-2"><FaLink className="text-blue-600" /> Payment Link</h4>
                <div className="flex flex-wrap gap-2">
                  {activeLinkUrl ? (
                    <>
                      <button onClick={handleGenerateLink} disabled={linkBusy || saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"><FaRedo /> Regenerate &amp; Resend</button>
                      <button onClick={handleCopyLink} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-blue-700 border border-blue-300 text-xs font-medium hover:bg-blue-100">{copied ? 'Copied' : <><FaCopy /> Copy</>}</button>
                      <button onClick={handleClearLink} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-red-600 border border-red-300 text-xs font-medium hover:bg-red-100"><FaTrash /> Clear</button>
                    </>
                  ) : (
                    <button onClick={handleGenerateLink} disabled={linkBusy || saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"><FaLink /> Send Payment Link</button>
                  )}
                  <button onClick={handleViewDetails} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-gray-700 border border-gray-300 text-xs font-medium hover:bg-gray-100"><FaMoneyBillWave /> Details</button>
                  <button onClick={handleViewHistory} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-gray-700 border border-gray-300 text-xs font-medium hover:bg-gray-100"><FaHistory /> History</button>
                </div>
              </div>

              {activeLinkUrl && (
                <div className="text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs uppercase tracking-widest text-gray-500">Active Link</span>
                    <a href={activeLinkUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline text-xs break-all">{activeLinkUrl}</a>
                  </div>
                  {linkExpiresAt && (
                    <p className={`mt-1 text-xs font-medium ${new Date(linkExpiresAt) <= new Date() ? 'text-red-600' : 'text-amber-700'}`}>
                      {new Date(linkExpiresAt) <= new Date() ? '⚠ Expired — regenerate to send a fresh link.' : `Expires on ${fmtDateTime(linkExpiresAt)}`}
                    </p>
                  )}
                </div>
              )}

              {paymentDetails && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div><div className="text-xs uppercase tracking-widest text-gray-500">Payment Status</div><div className="font-medium">{paymentDetails.paymentStatus}</div></div>
                  <div><div className="text-xs uppercase tracking-widest text-gray-500">Booking Status</div><div className="font-medium">{paymentDetails.bookingStatus}</div></div>
                  <div><div className="text-xs uppercase tracking-widest text-gray-500">Amount</div><div className="font-medium">${Number(paymentDetails.amount || 0).toLocaleString()}</div></div>
                  <div><div className="text-xs uppercase tracking-widest text-gray-500">Amount Paid</div><div className="font-medium">${Number(paymentDetails.amountPaid || 0).toLocaleString()}</div></div>
                  {paymentDetails.paymentId && (
                    <div className="col-span-2"><div className="text-xs uppercase tracking-widest text-gray-500">Payment ID</div><div className="font-mono text-xs">{paymentDetails.paymentId}</div></div>
                  )}
                  {paymentDetails.paymentDate && (
                    <div className="col-span-2"><div className="text-xs uppercase tracking-widest text-gray-500">Paid On</div><div className="font-medium">{fmtDateTime(paymentDetails.paymentDate)}</div></div>
                  )}
                  {paymentDetails.live && (
                    <div className="col-span-4 border-t border-blue-100 pt-2 text-xs text-gray-500">Live Razorpay status: <span className="font-medium">{paymentDetails.live.status}</span></div>
                  )}
                </div>
              )}

              {showHistory && (
                <div className="mt-3">
                  <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">Payment Link History</div>
                  {paymentHistory.length ? (
                    <ul className="space-y-2">
                      {paymentHistory.map((h, i) => (
                        <li key={i} className="flex items-center justify-between gap-2 text-xs bg-white border border-blue-100 rounded-xl px-3 py-2">
                          <div>
                            <span className="font-medium">{h.source}</span> · ${Number(h.amount || 0).toLocaleString()} · <span className="uppercase">{h.status}</span>
                            <div className="text-gray-400 mt-0.5">created {fmtDateTime(h.createdAt)} · expires {fmtDateTime(h.expiresAt)}</div>
                          </div>
                          {h.url && <a href={h.url} target="_blank" rel="noreferrer" className="text-blue-600 underline whitespace-nowrap">Open</a>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-400">No payment links generated yet.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {reviewStatus === 'REJECTED' && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
              <div className="flex items-center gap-2 text-red-700 font-medium mb-1"><FaBan /> Booking rejected</div>
              <p className="text-sm text-red-800">Reason: {booking.rejectionReason || booking.approvalReason || '—'}</p>
              <p className="text-xs text-red-600 mt-1">Rejected by {booking.rejectedBy?.name || 'Sales Team'} · {fmtDateTime(booking.rejectedAt)}</p>
            </div>
          )}

          {booking.cancellationReason && (
            <div className="rounded-2xl bg-gray-100 border border-gray-200 p-4">
              <div className="font-medium text-gray-700 mb-1">Cancelled</div>
              <p className="text-sm text-gray-600">Reason: {booking.cancellationReason}</p>
              <p className="text-xs text-gray-500 mt-1">By {booking.cancelledBy || '—'} · {fmtDateTime(booking.cancelledAt)}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Internal Notes (Sales only)</label><textarea value={f.internalNotes} onChange={set('internalNotes')} rows={2} className="input-field rounded-xl w-full resize-none" placeholder="Not visible to the customer" /></div>
            {reviewStatus === 'PENDING' && (
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Approval Reason</label><textarea value={pricing.offerMessage} onChange={(e) => setP2('offerMessage', e.target.value)} rows={2} className="input-field rounded-xl w-full resize-none" placeholder="Shown to the customer" /></div>
            )}
          </div>

          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2"><FaHistory className="text-gray-400" /> Booking History</h4>
            {booking.history?.length ? (
              <ol className="relative border-l border-gray-200 ml-3 space-y-5">
                {[...booking.history].reverse().map((h, i) => (
                  <li key={i} className="ml-6">
                    <span className="absolute -left-[7px] mt-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-luxury-accent" />
                    <div className="text-sm font-medium">{h.action}</div>
                    <div className="text-xs text-gray-500">{h.actor}{h.note ? ` — ${h.note}` : ''}</div>
                    <div className="text-[11px] text-gray-400">{fmtDateTime(h.at)}</div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-gray-400">No history recorded yet.</p>
            )}
          </div>

          {actions.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {actions.map((a) => (
                <button key={a.key} onClick={a.onClick} disabled={saving}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-medium disabled:opacity-50 ${a.style}`}>
                  <a.icon /> {a.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {showReject && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowReject(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h4 className="font-display text-xl mb-4">Reject Booking Request</h4>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
              <select value={rejectCat} onChange={(e) => setRejectCat(e.target.value)} className="input-field rounded-xl w-full mb-3">
                <option value="">Select a reason...</option>
                {REJECT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} className="input-field rounded-xl w-full mb-4 resize-none" placeholder="Add details (visible to the customer)" />
              <div className="flex gap-3">
                <button onClick={() => setShowReject(false)} className="flex-1 py-2.5 rounded-xl bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300">Cancel</button>
                <button onClick={handleRejectConfirm} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50">Confirm Reject</button>
              </div>
            </div>
          </div>
        )}

        {showPayment && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowPayment(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h4 className="font-display text-xl mb-4 flex items-center gap-2"><FaMoneyBillWave className="text-emerald-500" /> Confirm Payment</h4>
              <p className="text-sm text-gray-500 mb-3">Mark payment as received. This confirms the booking and notifies the customer.</p>
              <label className="block text-xs font-medium text-gray-600 mb-1">Payment / Transaction ID (optional)</label>
              <input value={paymentId} onChange={(e) => setPaymentId(e.target.value)} className="input-field rounded-xl w-full mb-4" placeholder="txn_123456" />
              <div className="flex gap-3">
                <button onClick={() => setShowPayment(false)} className="flex-1 py-2.5 rounded-xl bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300">Cancel</button>
                <button onClick={handleConfirmPayment} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">Confirm &amp; Notify</button>
              </div>
            </div>
          </div>
        )}

        {showCancel && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCancel(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h4 className="font-display text-xl mb-4">Cancel Booking</h4>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
              <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} className="input-field rounded-xl w-full mb-4 resize-none" placeholder="Reason for cancellation (visible to the customer)" />
              <div className="flex gap-3">
                <button onClick={() => setShowCancel(false)} className="flex-1 py-2.5 rounded-xl bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300">Go Back</button>
                <button onClick={handleCancelConfirm} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50">Confirm Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesBookingReview;