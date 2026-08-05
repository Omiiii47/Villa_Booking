'use client'
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaArrowRight, FaPaperPlane } from 'react-icons/fa';
import { useLandingCms } from '../context/LandingCmsContext';
import useIsMobile from '../hooks/useIsMobile';

const Newsletter = () => {
  const { landing } = useLandingCms();
  const isMobile = useIsMobile();
  const newsletter = (isMobile ? landing?.mobile : landing?.desktop)?.newsletter || {};
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) { setSubscribed(true); setEmail(''); }
  };

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-luxury-black via-luxury-dark to-luxury-black" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #C4A484 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <motion.div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-luxury-accent/5 blur-[150px]"
        animate={{ x: [0, 50, 0], y: [0, -50, 0] }}
        transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
      />
      <div className="luxury-container relative z-10">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto text-center">
          <span className="section-label text-luxury-accent">{newsletter.label || 'Stay Connected'}</span>
          <h2 className="font-display text-display-lg text-white mb-4">{newsletter.title || 'Join Our Concierge Circle'}</h2>
          <p className="text-white/50 font-light mb-10 max-w-md mx-auto">{newsletter.subtitle || 'Receive exclusive offers, new villa announcements, and curated travel inspiration.'}</p>
          {subscribed ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
              className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-8 py-6"
            >
              <FaPaperPlane className="text-luxury-accent text-xl" />
              <div className="text-left">
                <p className="text-luxury-accent font-display text-lg">{newsletter.successTitle || 'Thank you!'}</p>
                <p className="text-white/50 text-sm">{newsletter.successMessage || 'Welcome to the Solscape Stays family.'}</p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="flex-1 relative">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={newsletter.placeholder || 'Your email address'} required
                  className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 font-body text-sm focus:outline-none focus:border-luxury-accent transition-all backdrop-blur-sm" />
              </div>
              <button type="submit" className="btn-primary !rounded-2xl !px-8">
                <span>{newsletter.buttonText || 'Subscribe'}</span>
                <FaArrowRight className="relative z-10" />
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default Newsletter;

