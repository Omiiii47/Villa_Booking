'use client'
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaPaperPlane } from 'react-icons/fa';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => { e.preventDefault(); setSent(true); setForm({ name: '', email: '', subject: '', message: '' }); };

  return (
    <>
      <section className="pt-36 pb-16 bg-white">
        <div className="luxury-container">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
            <span className="section-label">Contact</span>
            <h1 className="font-display text-display-xl text-luxury-black mt-2 mb-4">Get In Touch</h1>
            <p className="text-gray-500 font-light max-w-lg">Our concierge team is available 24/7 to assist with bookings, inquiries, or anything you need.</p>
          </motion.div>
        </div>
      </section>
      <section className="pb-24 bg-white">
        <div className="luxury-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              {sent ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-luxury-cream rounded-3xl p-16 text-center">
                  <FaPaperPlane className="text-luxury-accent text-5xl mx-auto mb-4" />
                  <h2 className="font-display text-2xl mb-2">Message Sent!</h2>
                  <p className="text-gray-500 mb-6">We will get back to you within 24 hours.</p>
                  <button onClick={() => setSent(false)} className="btn-outline text-[10px]"><span>Send Another</span></button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div><label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input-field rounded-2xl" placeholder="Your name" /></div>
                    <div><label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="input-field rounded-2xl" placeholder="your@email.com" /></div>
                  </div>
                  <div><label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Subject</label><input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-field rounded-2xl" placeholder="How can we help?" /></div>
                  <div><label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Message</label><textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={6} className="input-field rounded-2xl resize-none" placeholder="Tell us about your dream villa experience..." /></div>
                  <button type="submit" className="btn-primary text-[10px]"><span>Send Message</span></button>
                </form>
              )}
            </div>
            <div>
              <div className="bg-luxury-cream rounded-3xl p-8 space-y-8">
                {[
                  { icon: FaMapMarkerAlt, title: 'Visit Us', desc: '123 Luxury Lane\nParadise Valley, AZ 85253' },
                  { icon: FaPhone, title: 'Call Us', desc: '+1 (555) 123-4567' },
                  { icon: FaEnvelope, title: 'Email Us', desc: 'concierge@solscapestays.com' },
                  { icon: FaClock, title: '24/7 Concierge', desc: 'We are always here for you.' },
                ].map((item) => (
                  <div key={item.title}>
                    <div className="w-12 h-12 rounded-2xl bg-luxury-accent/20 flex items-center justify-center mb-4"><item.icon className="text-luxury-accent" /></div>
                    <h3 className="font-body font-semibold mb-1">{item.title}</h3>
                    <p className="text-gray-400 text-sm whitespace-pre-line">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;

