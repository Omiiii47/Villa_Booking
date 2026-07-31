import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCalendar, FaUsers, FaCommentDots, FaCheck, FaLock } from 'react-icons/fa';
import { getVillaBySlug } from '../services/villaService';
import { createBooking } from '../services/bookingService';
import Magnetic from '../components/Magnetic';

const Booking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const slug = searchParams.get('slug');
  const [villa, setVilla] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ checkIn: '', checkOut: '', guests: 2, specialRequests: '' });

  useEffect(() => {
    if (!slug) { navigate('/villas'); return; }
    const fetch = async () => { try { setVilla(await getVillaBySlug(slug)); } catch { navigate('/villas'); } setLoading(false); };
    fetch();
  }, [slug, navigate]);

  const nights = () => { if (!form.checkIn || !form.checkOut) return 0; return Math.max(0, Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / (1000 * 60 * 60 * 24))); };
  const total = () => villa ? nights() * villa.pricePerNight : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.checkIn || !form.checkOut) return;
    setSubmitting(true);
    try { await createBooking({ villa: villa._id, checkIn: form.checkIn, checkOut: form.checkOut, guests: form.guests, specialRequests: form.specialRequests }); setSuccess(true); }
    catch (err) { alert(err.response?.data?.message || 'Booking failed'); }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-8 h-8 border-2 border-luxury-accent border-t-transparent rounded-full" /></div>;

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 150 }} className="text-center px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }} className="w-24 h-24 rounded-3xl bg-luxury-green flex items-center justify-center mx-auto mb-8"><FaCheck className="text-white text-3xl" /></motion.div>
        <h1 className="font-display text-4xl md:text-5xl mb-4">Booking Confirmed!</h1>
        <p className="text-gray-500 mb-8">Your stay at <span className="text-luxury-accent font-medium">{villa?.name}</span> has been reserved.</p>
        <div className="flex gap-4 justify-center">
          <button onClick={() => navigate('/dashboard')} className="btn-primary"><span>View Dashboard</span></button>
          <button onClick={() => navigate('/villas')} className="btn-outline"><span>Browse More</span></button>
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
                <label className="flex items-center gap-2 text-sm font-medium mb-2"><FaUsers className="text-luxury-accent" /> Guests</label>
                <select value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })} className="input-field rounded-2xl max-w-xs">
                  {[...Array(villa?.capacity || 10)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Guest' : 'Guests'}</option>)}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2"><FaCommentDots className="text-luxury-accent" /> Special Requests</label>
                <textarea value={form.specialRequests} onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
                  rows={4} placeholder="Any special requirements?" className="input-field rounded-2xl resize-none" />
              </div>
              <Magnetic>
                <button type="submit" disabled={submitting || !form.checkIn || !form.checkOut}
                  className="btn-primary w-full disabled:opacity-50 text-[10px]">
                  <span>{submitting ? 'Processing...' : `Confirm Booking — $${total().toLocaleString()}`}</span>
                </button>
              </Magnetic>
              <div className="flex items-center gap-4 text-gray-400 text-xs"><FaLock /> Secure checkout · Free cancellation within 48h</div>
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
                </div>
                <div className="flex justify-between font-display text-xl"><span>Total</span><span className="text-luxury-accent">${(total() + Math.round(total() * 0.18)).toLocaleString()}</span></div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Booking;
