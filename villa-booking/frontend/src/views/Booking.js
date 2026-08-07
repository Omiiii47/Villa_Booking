'use client'
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaCalendar, FaUsers, FaCommentDots, FaCheck, FaLock, FaUser, FaChild, FaBaby, FaPaw, FaPhone, FaGlobe, FaBriefcase, FaClock } from 'react-icons/fa';
import { getVillaBySlug } from '../services/villaService';
import { createBooking } from '../services/bookingService';
import Magnetic from '../components/Magnetic';

const Booking = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get('slug');
  const prefill = { checkIn: searchParams.get('checkIn') || '', checkOut: searchParams.get('checkOut') || '' };
  const [villa, setVilla] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ checkIn: prefill.checkIn, checkOut: prefill.checkOut, adults: 2, kids: 0, infants: 0, pets: 0, purposeOfStay: '', arrivalTime: '', customerPhone: '', customerCountry: '', specialRequests: '' });

  useEffect(() => {
    if (!slug) { router.push('/villas'); return; }
    const fetch = async () => { try { setVilla(await getVillaBySlug(slug)); } catch { router.push('/villas'); } setLoading(false); };
    fetch();
  }, [slug, router]);

  const capacity = villa?.capacity || 10;
  const nights = () => { if (!form.checkIn || !form.checkOut) return 0; return Math.max(0, Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / (1000 * 60 * 60 * 24))); };
  const total = () => villa ? nights() * villa.pricePerNight : 0;
  const adultsCount = Number(form.adults) || 1;
  const kidsCount = Number(form.kids) || 0;
  const infantsCount = Number(form.infants) || 0;
  const petsCount = Number(form.pets) || 0;
  const totalGuests = Math.max(1, adultsCount + kidsCount + infantsCount);
  const isOverCapacity = totalGuests > capacity;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.checkIn || !form.checkOut) return;
    setSubmitting(true);
    try {
      await createBooking({ villa: villa._id, checkIn: form.checkIn, checkOut: form.checkOut, adults: adultsCount, kids: kidsCount, infants: infantsCount, pets: petsCount, purposeOfStay: form.purposeOfStay, arrivalTime: form.arrivalTime, customerPhone: form.customerPhone, customerCountry: form.customerCountry, specialRequests: form.specialRequests });
      setSuccess(true);
    }
    catch (err) { alert(err.response?.data?.message || 'Booking failed'); }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-8 h-8 border-2 border-luxury-accent border-t-transparent rounded-full" /></div>;

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 150 }} className="text-center px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }} className="w-24 h-24 rounded-3xl bg-luxury-green flex items-center justify-center mx-auto mb-8"><FaCheck className="text-white text-3xl" /></motion.div>
        <h1 className="font-display text-4xl md:text-5xl mb-4">Booking Request Submitted!</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">Your request for <span className="text-luxury-accent font-medium">{villa?.name}</span> has been received. Our Sales Team will review it and prepare a personalized booking offer based on your requirements.</p>
        <div className="flex gap-4 justify-center">
          <button onClick={() => router.push('/dashboard')} className="btn-primary"><span>View Dashboard</span></button>
          <button onClick={() => router.push('/villas')} className="btn-outline"><span>Browse More</span></button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <section className="pt-36 pb-24 bg-white min-h-screen">
      <div className="luxury-container">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
          <span className="section-label">Reservation</span>
          <h1 className="font-display text-display-lg mt-2 mb-2">Complete Your Booking</h1>
          <p className="text-gray-500 mb-12">{villa?.name} — {villa?.location}</p>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-7">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[{ label: 'Check-In Date', icon: FaCalendar, key: 'checkIn' }, { label: 'Check-Out Date', icon: FaCalendar, key: 'checkOut' }].map((f) => (
                  <div key={f.key}>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2"><f.icon className="text-luxury-accent" /> {f.label}</label>
                    <input type="date" value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      min={f.key === 'checkOut' && form.checkIn ? form.checkIn : new Date().toISOString().split('T')[0]} required className="input-field rounded-2xl" />
                  </div>
                ))}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-3"><FaUsers className="text-luxury-accent" /> Guests</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-3xl">
                  {[
                    { key: 'adults', label: 'Adults', icon: FaUser, min: 1 },
                    { key: 'kids', label: 'Children', icon: FaChild, min: 0 },
                    { key: 'infants', label: 'Infants', icon: FaBaby, min: 0 },
                    { key: 'pets', label: 'Pets', icon: FaPaw, min: 0 },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2"><f.icon className="text-luxury-accent" /> {f.label}</label>
                      <div className="flex items-center justify-between gap-2 rounded-full border border-gray-200 px-2 py-1.5">
                        <button type="button" aria-label={`Decrease ${f.label}`}
                          onClick={() => setForm({ ...form, [f.key]: Math.max(f.min, (Number(form[f.key]) || 0) - 1) })}
                          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">−</button>
                        <span className="w-6 text-center font-medium">{Number(form[f.key]) || 0}</span>
                        <button type="button" aria-label={`Increase ${f.label}`}
                          onClick={() => setForm({ ...form, [f.key]: Math.min(30, (Number(form[f.key]) || 0) + 1) })}
                          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">+</button>
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Total Guests</label>
                    <div className="flex items-center h-[42px] px-3 rounded-full bg-luxury-cream text-sm font-display">{totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}</div>
                  </div>
                </div>
                {petsCount > 0 && (
                  <p className="mt-3 text-xs text-gray-500">Includes {petsCount} {petsCount === 1 ? 'pet' : 'pets'} (not counted toward villa capacity).</p>
                )}
                {isOverCapacity && (
                  <div className="mt-4 max-w-xl p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-800 text-sm">
                    <p className="font-medium mb-1">Custom booking request</p>
                    <p>Your group size ({totalGuests} guests) exceeds this villa&apos;s standard capacity ({capacity} guests). We&apos;ve received your request, and our Sales Team will review it and prepare a personalized booking offer based on your requirements.</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2"><FaBriefcase className="text-luxury-accent" /> Purpose of Stay</label>
                  <select value={form.purposeOfStay} onChange={(e) => setForm({ ...form, purposeOfStay: e.target.value })} className="input-field rounded-2xl">
                    <option value="">Select purpose</option>
                    {['Vacation', 'Wedding', 'Family Reunion', 'Business / Workation', 'Celebration', 'Retreat', 'Other'].map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2"><FaClock className="text-luxury-accent" /> Arrival Time</label>
                  <input type="time" value={form.arrivalTime} onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })} className="input-field rounded-2xl" />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2"><FaPhone className="text-luxury-accent" /> Phone Number</label>
                  <input type="tel" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} placeholder="+1 555 000 0000" className="input-field rounded-2xl" />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2"><FaGlobe className="text-luxury-accent" /> Country</label>
                  <input value={form.customerCountry} onChange={(e) => setForm({ ...form, customerCountry: e.target.value })} placeholder="e.g. India" className="input-field rounded-2xl" />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2"><FaCommentDots className="text-luxury-accent" /> Special Requests</label>
                <textarea value={form.specialRequests} onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
                  rows={4} placeholder="Any special requirements?" className="input-field rounded-2xl resize-none" />
              </div>
              <Magnetic>
                <button type="submit" disabled={submitting || !form.checkIn || !form.checkOut}
                  className="btn-primary w-full disabled:opacity-50 text-[10px]">
                  <span>{submitting ? 'Processing...' : 'Submit Booking Request (Free)'}</span>
                </button>
              </Magnetic>
              <div className="flex items-center gap-4 text-gray-400 text-xs"><FaLock /> Secure checkout Â· Free cancellation within 48h</div>
            </form>
          </div>
          <div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="sticky top-28">
              <div className="card-premium p-8">
                <div className="flex gap-4 mb-6">
                  <img src={villa?.images?.[0]} alt={villa?.name} className="w-20 h-20 rounded-2xl object-cover" />
<div><h3 className="font-display text-lg">{villa?.name}</h3><p className="text-gray-400 text-sm">{villa?.location}</p></div>
                </div>
                <div className="space-y-3 mb-6 pb-6 border-b border-gray-100">
                  {[{ label: `$${villa?.pricePerNight} x ${nights()} nights`, value: `$${(villa?.pricePerNight || 0) * nights()}` },
                    { label: 'Service fee', value: `$${Math.round(total() * 0.1)}` },
                    { label: 'Tax', value: `$${Math.round(total() * 0.08)}` },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between text-sm"><span className="text-gray-500">{item.label}</span><span>{item.value}</span></div>
                  ))}
                  <div className="flex justify-between font-display text-lg pt-2"><span>Estimated total</span><span className="text-luxury-accent">${(total() + Math.round(total() * 0.18)).toLocaleString()}</span></div>
                  {isOverCapacity && (
                    <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-xl p-3">
                      Your group size ({totalGuests} guests) exceeds the {capacity}-guest capacity. Final nightly rate and charges will be confirmed by our Sales Team in your personalized offer.
                    </p>
                  )}
                  <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-3">
                    Estimate only. Submitting this request is <span className="font-medium text-luxury-accent">free</span> — final pricing will be confirmed by our Sales Team in your personalized offer.
                  </p>
                </div>
                <div className="flex justify-between font-display text-xl"><span>Total due now</span><span className="text-luxury-accent">$0</span></div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Booking;

