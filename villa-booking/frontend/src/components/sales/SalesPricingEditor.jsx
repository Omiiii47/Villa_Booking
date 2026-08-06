'use client'

const num = (v) => (v === '' || v === null || v === undefined ? 0 : Number(v));

const SalesPricingEditor = ({ pricing, onChange, nights }) => {
  const totalPerNight =
    num(pricing.basePrice) +
    num(pricing.extraGuestFee) * num(pricing.extraGuestCount) +
    num(pricing.cleaningFee) +
    num(pricing.additionalServices) +
    num(pricing.housekeepingCharges) +
    num(pricing.beddingCharges) +
    num(pricing.securityCharges) +
    num(pricing.transportation) +
    num(pricing.chefServices) +
    num(pricing.decoration) +
    num(pricing.airportPickup) -
    num(pricing.discount);
  const totalAmount =
    pricing.overrideAmount !== '' && pricing.overrideAmount !== null && pricing.overrideAmount !== undefined
      ? num(pricing.overrideAmount)
      : Math.max(0, totalPerNight * nights);

  const fields = [
    { key: 'basePrice', label: 'Base Price / Night' },
    { key: 'extraGuestFee', label: 'Extra Guest Fee / Guest' },
    { key: 'extraGuestCount', label: 'Extra Guest Count' },
    { key: 'cleaningFee', label: 'Cleaning Fee' },
    { key: 'additionalServices', label: 'Additional Services' },
    { key: 'housekeepingCharges', label: 'Extra Housekeeping' },
    { key: 'beddingCharges', label: 'Extra Bedding' },
    { key: 'securityCharges', label: 'Security / Maintenance' },
    { key: 'transportation', label: 'Transportation' },
    { key: 'chefServices', label: 'Chef Services' },
    { key: 'decoration', label: 'Decoration' },
    { key: 'airportPickup', label: 'Airport Pickup' },
    { key: 'discount', label: 'Discount' },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
            <input type="number" min="0" value={pricing[f.key]} onChange={(e) => onChange(f.key, e.target.value)} className="input-field rounded-xl w-full" />
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Override Total</label>
          <input type="number" min="0" value={pricing.overrideAmount ?? ''} onChange={(e) => onChange('overrideAmount', e.target.value)} className="input-field rounded-xl w-full" placeholder="Optional" />
        </div>
      </div>
      <textarea value={pricing.complimentaryServices} onChange={(e) => onChange('complimentaryServices', e.target.value)} rows={2} className="input-field rounded-xl w-full mt-3 resize-none" placeholder="Complimentary services (e.g. welcome hamper, late checkout)" />
      <div className="mt-4 p-4 rounded-2xl bg-luxury-cream">
        <div className="flex justify-between text-sm"><span>Total Offer / Night</span><span className="font-display text-lg">${num(totalPerNight).toLocaleString()}</span></div>
        <div className="flex justify-between text-sm mt-1"><span>Total ({nights} nights)</span><span className="font-display text-lg text-luxury-accent">${num(totalAmount).toLocaleString()}</span></div>
      </div>
    </div>
  );
};

export default SalesPricingEditor;