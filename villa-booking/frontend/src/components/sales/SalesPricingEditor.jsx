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
    { key: 'basePrice', label: 'Base Price / Night', step: 500 },
    { key: 'extraGuestFee', label: 'Extra Guest Fee / Guest', step: 100 },
    { key: 'extraGuestCount', label: 'Extra Guest Count', step: 1 },
    { key: 'cleaningFee', label: 'Cleaning Fee', step: 100 },
    { key: 'additionalServices', label: 'Additional Services', step: 100 },
    { key: 'housekeepingCharges', label: 'Extra Housekeeping', step: 100 },
    { key: 'beddingCharges', label: 'Extra Bedding', step: 100 },
    { key: 'securityCharges', label: 'Security / Maintenance', step: 100 },
    { key: 'transportation', label: 'Transportation', step: 100 },
    { key: 'chefServices', label: 'Chef Services', step: 100 },
    { key: 'decoration', label: 'Decoration', step: 100 },
    { key: 'airportPickup', label: 'Airport Pickup', step: 100 },
    { key: 'discount', label: 'Discount', step: 100 },
  ];

  const step = (value, delta, min = 0) => onChange(String(Math.max(min, (num(value) || 0) + delta)));

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
            <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-1 py-1">
              <button type="button" aria-label={`Decrease ${f.label}`} onClick={() => step(pricing[f.key], -f.step)}
                className="w-7 h-7 shrink-0 rounded-full bg-luxury-cream hover:bg-gray-200 flex items-center justify-center text-gray-600">−</button>
              <input type="number" min="0" value={pricing[f.key]} onChange={(e) => onChange(f.key, e.target.value)} className="w-full min-w-0 bg-transparent text-center text-sm font-medium" />
              <button type="button" aria-label={`Increase ${f.label}`} onClick={() => step(pricing[f.key], f.step)}
                className="w-7 h-7 shrink-0 rounded-full bg-luxury-cream hover:bg-gray-200 flex items-center justify-center text-gray-600">+</button>
            </div>
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Override Total</label>
          <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-1 py-1">
            <button type="button" aria-label="Decrease Override Total" onClick={() => step(pricing.overrideAmount, -500)}
              className="w-7 h-7 shrink-0 rounded-full bg-luxury-cream hover:bg-gray-200 flex items-center justify-center text-gray-600">−</button>
            <input type="number" min="0" value={pricing.overrideAmount ?? ''} onChange={(e) => onChange('overrideAmount', e.target.value)} className="w-full min-w-0 bg-transparent text-center text-sm font-medium" placeholder="Optional" />
            <button type="button" aria-label="Increase Override Total" onClick={() => step(pricing.overrideAmount, 500)}
              className="w-7 h-7 shrink-0 rounded-full bg-luxury-cream hover:bg-gray-200 flex items-center justify-center text-gray-600">+</button>
          </div>
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