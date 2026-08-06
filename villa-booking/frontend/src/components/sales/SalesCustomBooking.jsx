'use client'
import { useState } from 'react';
import { FaTimes, FaSave, FaPaperPlane } from 'react-icons/fa';
import * as salesService from '../../services/salesService';
import SalesPricingEditor from './SalesPricingEditor';

const num = (v) => (v === '' || v === null || v === undefined ? 0 : Number(v));

const emptyPricing = {
  basePrice: 0, extraGuestFee: 0, extraGuestCount: 0, cleaningFee: 0, additionalServices: 0,
  housekeepingCharges: 0, beddingCharges: 0, securityCharges: 0, transportation: 0, chefServices: 0,
  decoration: 0, airportPickup: 0, discount: 0, complimentaryServices: '', overrideAmount: '', offerMessage: '',
};

const SalesCustomBooking = ({ villas, onClose, onSaved }) => {
  const [f, setF] = useState({
    customerName: '', customerEmail: '', customerPhone: '', customerCountry: '',
    villa: villas[0]?._id || '', checkIn: '', checkOut: '',
    adults: 2, kids: 0, infants: 0, pets: 0,
    purposeOfStay: '', arrivalTime: '', specialRequests: '', internalNotes: '',
  });
  const [pricing, setPricing] = useState(emptyPricing);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const nights = f.checkIn && f.checkOut ? Math.max(1, Math.ceil((new Date(f.checkOut) - new Date(f.checkIn)) / (1000 * 60 * 60 * 24))) : 0;
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });
  const setP = (key, value) => setPricing({ ...pricing, [key]: value });

  const payload = (sendOffer) => ({
    customerName: f.customerName, customerEmail: f.customerEmail, customerPhone: f.customerPhone,
    customerCountry: f.customerCountry, villa: f.villa, checkIn: f.checkIn, checkOut: f.checkOut,
    adults: num(f.adults), kids: num(f.kids), infants: num(f.infants), pets: num(f.pets),
    purposeOfStay: f.purposeOfStay, arrivalTime: f.arrivalTime, specialRequests: f.specialRequests,
    internalNotes: f.internalNotes,
    customPricing: {
      basePrice: num(pricing.basePrice), extraGuestFee: num(pricing.extraGuestFee), extraGuestCount: num(pricing.extraGuestCount),
      cleaningFee: num(pricing.cleaningFee), additionalServices: num(pricing.additionalServices), housekeepingCharges: num(pricing.housekeepingCharges),
      beddingCharges: num(pricing.beddingCharges), securityCharges: num(pricing.securityCharges), transportation: num(pricing.transportation),
      chefServices: num(pricing.chefServices), decoration: num(pricing.decoration), airportPickup: num(pricing.airportPickup),
      discount: num(pricing.discount), complimentaryServices: pricing.complimentaryServices,
      overrideAmount: pricing.overrideAmount === '' ? null : num(pricing.overrideAmount), offerMessage: pricing.offerMessage,
    },
    sendOffer,
  });

  const run = async (fn) => {
    setSaving(true);
    setErr('');
    try { await fn(); onSaved(); }
    catch (e) { setErr(e.response?.data?.message || 'Failed to create booking'); }
    setSaving(false);
  };

  const handleCreate = () => run(() => salesService.createCustomBooking(payload(false)));
  const handleCreateAndOffer = () => run(() => salesService.createCustomBooking(payload(true)));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white flex items-start justify-between p-6 pb-4 border-b border-gray-100 z-10">
          <div>
            <h3 className="font-display text-2xl">Create Custom Booking</h3>
            <p className="text-sm text-gray-500 mt-1">Craft a bespoke booking for a customer.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
        </div>

        <div className="p-6 space-y-6">
          {err && <div className="bg-red-50 text-red-500 text-sm p-3 rounded-2xl">⚠ {err}</div>}

          <div>
            <h4 className="font-medium mb-3">Customer</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label><input value={f.customerName} onChange={set('customerName')} className="input-field rounded-xl w-full" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Email *</label><input type="email" value={f.customerEmail} onChange={set('customerEmail')} className="input-field rounded-xl w-full" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Phone</label><input value={f.customerPhone} onChange={set('customerPhone')} className="input-field rounded-xl w-full" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Country</label><input value={f.customerCountry} onChange={set('customerCountry')} className="input-field rounded-xl w-full" /></div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Villa, Dates &amp; Guests</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Villa *</label><select value={f.villa} onChange={set('villa')} className="input-field rounded-xl w-full">{villas.map((v) => <option key={v._id} value={v._id}>{v.name} (${v.pricePerNight}/night)</option>)}</select></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Check-in *</label><input type="date" value={f.checkIn} onChange={set('checkIn')} className="input-field rounded-xl w-full" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Check-out *</label><input type="date" value={f.checkOut} onChange={set('checkOut')} className="input-field rounded-xl w-full" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Adults</label><input type="number" min="1" value={f.adults} onChange={set('adults')} className="input-field rounded-xl w-full" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Children</label><input type="number" min="0" value={f.kids} onChange={set('kids')} className="input-field rounded-xl w-full" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Infants</label><input type="number" min="0" value={f.infants} onChange={set('infants')} className="input-field rounded-xl w-full" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Pets</label><input type="number" min="0" value={f.pets} onChange={set('pets')} className="input-field rounded-xl w-full" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Purpose of Stay</label><input value={f.purposeOfStay} onChange={set('purposeOfStay')} className="input-field rounded-xl w-full" placeholder="e.g. Vacation, Wedding" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Arrival Time</label><input type="time" value={f.arrivalTime} onChange={set('arrivalTime')} className="input-field rounded-xl w-full" /></div>
            </div>
            <textarea value={f.specialRequests} onChange={set('specialRequests')} rows={2} className="input-field rounded-xl w-full mt-3 resize-none" placeholder="Special requests" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Custom Pricing</h4>
              {nights > 0 && <span className="text-xs text-gray-500">{nights} nights</span>}
            </div>
            <SalesPricingEditor pricing={pricing} onChange={setP} nights={nights} />
            <label className="block text-xs font-medium text-gray-600 mt-3 mb-1">Offer Message to Customer</label>
            <textarea value={pricing.offerMessage} onChange={(e) => setP('offerMessage', e.target.value)} rows={2} className="input-field rounded-xl w-full resize-none" placeholder="Visible to the customer with their booking offer" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Internal Notes (Sales only)</label>
            <textarea value={f.internalNotes} onChange={set('internalNotes')} rows={2} className="input-field rounded-xl w-full resize-none" placeholder="Not visible to the customer" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button onClick={handleCreate} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-800 text-white text-sm font-medium hover:bg-gray-900 disabled:opacity-50"><FaSave /> Create Booking</button>
            <button onClick={handleCreateAndOffer} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"><FaPaperPlane /> Create &amp; Send Offer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesCustomBooking;