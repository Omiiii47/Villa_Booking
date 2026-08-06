'use client'
import { useState } from 'react';
import { FaTimes, FaSave, FaPaperPlane, FaCheck, FaBan } from 'react-icons/fa';
import * as salesService from '../../services/salesService';
import SalesPricingEditor from './SalesPricingEditor';

const num = (v) => (v === '' || v === null || v === undefined ? 0 : Number(v));

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
    approvalReason: booking.approvalReason || '',
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
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const nights = f.checkIn && f.checkOut ? Math.max(1, Math.ceil((new Date(f.checkOut) - new Date(f.checkIn)) / (1000 * 60 * 60 * 24))) : booking.nights || 1;
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });
  const setP2 = (key) => (e) => setPricing({ ...pricing, [key]: e.target.value });

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
    internalNotes: f.internalNotes, approvalReason: f.approvalReason,
  };

  const run = async (fn) => {
    setSaving(true);
    setErr('');
    try { await fn(); onSaved(); }
    catch (e) { setErr(e.response?.data?.message || 'Action failed'); }
    setSaving(false);
  };

  const handleSave = () => run(() => salesService.updateBooking(booking._id, { ...commonFields, customPricing: toPricingPayload() }));
  const handleSendOffer = () => run(() => salesService.updateBooking(booking._id, { ...commonFields, customPricing: toPricingPayload(), sendOffer: true }));
  const handleApprove = () => run(() => salesService.reviewBooking(booking._id, { action: 'approve', approvalReason: f.approvalReason, customPricing: toPricingPayload() }));
  const handleReject = () => {
    if (window.confirm('Reject this booking request?')) {
      run(() => salesService.reviewBooking(booking._id, { action: 'reject', approvalReason: f.approvalReason }));
    }
  };

  const details = [
    { label: 'Customer Name', value: booking.customerName || booking.user?.name },
    { label: 'Email', value: booking.customerEmail || booking.user?.email },
    { label: 'Phone', value: booking.customerPhone || booking.user?.phone || '—' },
    { label: 'Country', value: booking.customerCountry || '—' },
    { label: 'Villa', value: booking.villa?.name },
    { label: 'Villa ID', value: booking.villa?._id },
    { label: 'Check-in', value: new Date(booking.checkIn).toLocaleDateString() },
    { label: 'Check-out', value: new Date(booking.checkOut).toLocaleDateString() },
    { label: 'Nights', value: booking.nights },
    { label: 'Booking Date', value: new Date(booking.createdAt || booking._id.getTimestamp()).toLocaleDateString() },
    { label: 'Estimated Price', value: `$${(booking.estimatedPrice ?? booking.totalPrice)?.toLocaleString()}` },
  ];

  const overCapacity = (booking.extraGuests || 0) > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white flex items-start justify-between p-6 pb-4 border-b border-gray-100 z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-2xl">Booking Review</h3>
              {overCapacity && <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700">⚠ Over Capacity</span>}
            </div>
            <p className="text-sm text-gray-500 mt-1">Status: <span className="uppercase">{booking.status}</span> · Offer sent: {booking.offerSent ? 'Yes' : 'No'}</p>
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
              <div>
                <div className="text-xs uppercase tracking-widest text-gray-500">Max Capacity</div>
                <div className="font-medium text-sm mt-0.5">{booking.standardCapacity || booking.villa?.capacity || '—'} guests</div>
              </div>
            </div>
            {overCapacity && (
              <div className="mt-3 p-3 rounded-2xl bg-orange-50 border border-orange-200 text-orange-800 text-sm">
                Requested {booking.requestedGuests} guests for a max capacity of {booking.standardCapacity} ({booking.extraGuests} extra). Requires manual review.
              </div>
            )}
            {booking.specialRequests && <p className="mt-3 text-sm text-gray-600"><b>Special Requests:</b> {booking.specialRequests}</p>}
          </div>

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

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Custom Pricing</h4>
              <span className="text-xs text-gray-500">{nights} nights</span>
            </div>
            <SalesPricingEditor pricing={pricing} onChange={setP2} nights={nights} />
            <label className="block text-xs font-medium text-gray-600 mt-3 mb-1">Offer Message to Customer</label>
            <textarea value={pricing.offerMessage} onChange={setP2('offerMessage')} rows={2} className="input-field rounded-xl w-full resize-none" placeholder="Visible to the customer with their booking offer" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Internal Notes (Sales only)</label><textarea value={f.internalNotes} onChange={set('internalNotes')} rows={2} className="input-field rounded-xl w-full resize-none" placeholder="Not visible to the customer" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Approval / Rejection Reason</label><textarea value={f.approvalReason} onChange={set('approvalReason')} rows={2} className="input-field rounded-xl w-full resize-none" placeholder="Visible to the customer with the outcome" /></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-800 text-white text-sm font-medium hover:bg-gray-900 disabled:opacity-50"><FaSave /> Save</button>
            <button onClick={handleSendOffer} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"><FaPaperPlane /> Send Offer</button>
            <button onClick={handleApprove} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"><FaCheck /> Approve</button>
            <button onClick={handleReject} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50"><FaBan /> Reject</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesBookingReview;