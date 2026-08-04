'use client'
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLandingCms } from '../context/LandingCmsContext';
import useIsMobile from '../hooks/useIsMobile';

const DEFAULT_FAQS = [
  { q: 'What is the booking process?', a: 'Simply browse our collection, select your desired villa and dates, and complete your booking online. A member of our concierge team will confirm your reservation within 24 hours.' },
  { q: 'Can I modify or cancel my booking?', a: 'Yes, modifications and cancellations are subject to our flexible policy. Full refunds are available up to 14 days before check-in, with partial refunds thereafter.' },
  { q: 'Are meals included in the villa price?', a: 'The villa price includes accommodation only. However, we offer private chef services, grocery pre-stocking, and local restaurant reservations upon request.' },
  { q: 'What amenities are provided in the villas?', a: 'All villas come fully equipped with premium linens, toiletries, kitchen essentials, WiFi, and smart entertainment systems. Specific amenities vary by villa.' },
  { q: 'Is airport transfer available?', a: 'Yes, we offer private airport transfers in luxury vehicles for all guests. This can be arranged during the booking process or by contacting our concierge team.' },
  { q: 'Are children allowed in all villas?', a: 'Most of our villas welcome children. Family-friendly amenities such as cribs, high chairs, and child-safe pools are available upon request.' },
];

const FAQ = () => {
  const { landing } = useLandingCms();
  const isMobile = useIsMobile();
  const faqsData = (isMobile ? landing?.mobile : landing?.desktop)?.faqs || {};
  const faqs = faqsData.items?.length ? faqsData.items : DEFAULT_FAQS;
  const [open, setOpen] = useState(null);

  return (
    <section className="section-padding bg-luxury-cream">
      <div className="luxury-container">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="section-label">{faqsData.label || 'FAQ'}</span>
          <h2 className="section-title mb-4">{faqsData.title || 'Frequently Asked Questions'}</h2>
          <p className="section-subtitle mx-auto">{faqsData.subtitle || 'Everything you need to know about booking your dream villa.'}</p>
        </motion.div>
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className={`rounded-2xl transition-all duration-500 ${open === i ? 'bg-luxury-black text-white shadow-xl' : 'bg-white hover:shadow-md'}`}
            >
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-7 py-5 text-left"
              >
                <span className={`font-body font-medium text-sm md:text-base pr-4 ${open === i ? 'text-white' : 'text-luxury-black'}`}>{faq.q}</span>
                <motion.svg
                  animate={{ rotate: open === i ? 45 : 0 }}
                  transition={{ duration: 0.3 }}
                  className={`w-5 h-5 shrink-0 ${open === i ? 'text-luxury-accent' : 'text-luxury-accent'}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="M12 5v14M5 12h14" />
                </motion.svg>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-7 pb-6 text-gray-300 text-sm leading-relaxed">{faq.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;

