'use client'
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaQuoteLeft } from 'react-icons/fa';
import { useLandingCms } from '../context/LandingCmsContext';
import useIsMobile from '../hooks/useIsMobile';

const DEFAULT_TESTIMONIALS = [
  { name: 'Sarah & James Mitchell', location: 'London, UK', villa: 'The Grand Horizon', text: 'An absolutely transcendent experience. Every detail was curated with such care that we felt like the only people in the world. The sunset from the infinity pool is something we will never forget.', rating: 5 },
  { name: 'The Patel Family', location: 'Mumbai, India', villa: 'Azure Cove Villa', text: 'Our family reunion at Azure Cove was magical. The children loved the private beach, and we adults cherished the wine cellar and sunset dinners. Already planning our return.', rating: 5 },
  { name: 'Emma & Thomas Keller', location: 'Zurich, Switzerland', villa: 'The Mountain Aerie', text: 'The Mountain Aerie exceeded every expectation. Waking up to those alpine views with a crackling fire — pure poetry. The hot springs after a day of skiing were heavenly.', rating: 5 },
  { name: 'Olivia Chen', location: 'Singapore', villa: 'The Zen Pavilion', text: 'The Zen Pavilion is a masterpiece of tranquility. I found a peace there that I did not know was possible. The tea ceremony at dawn overlooking the bamboo forest was life-changing.', rating: 5 },
];

const Testimonials = () => {
  const { landing } = useLandingCms();
  const isMobile = useIsMobile();
  const testimonialsData = (isMobile ? landing?.mobile : landing?.desktop)?.testimonials || {};
  const testimonials = testimonialsData.items?.length ? testimonialsData.items : DEFAULT_TESTIMONIALS;
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);

  const paginate = useCallback((d) => { setDir(d); setCurrent((p) => (p + d + testimonials.length) % testimonials.length); }, [testimonials.length]);

  useEffect(() => {
    const t = setInterval(() => paginate(1), 5000);
    return () => clearInterval(t);
  }, [paginate]);

  return (
    <section className="section-padding bg-luxury-black relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 border border-white/5 rounded-full animate-spin-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 border border-white/5 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse' }} />
      </div>
      <div className="luxury-container relative">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="section-label">{testimonialsData.label || 'Testimonials'}</span>
          <h2 className="section-title text-white">{testimonialsData.title || 'What Our Guests Say'}</h2>
        </motion.div>
        <div className="max-w-3xl mx-auto">
          <div className="overflow-hidden min-h-[280px]">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={current}
                custom={dir}
                variants={{
                  enter: (d) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
                  center: { x: 0, opacity: 1 },
                  exit: (d) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-center px-4"
              >
                <FaQuoteLeft className="text-luxury-accent/20 text-6xl mx-auto mb-6" />
                <p className="font-display text-xl md:text-2xl text-white/90 leading-relaxed italic mb-8">
                  &ldquo;{testimonials[current].text}&rdquo;
                </p>
                <div className="flex justify-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className={i < testimonials[current].rating ? 'text-yellow-400' : 'text-white/10'} />
                  ))}
                </div>
                <p className="font-body font-semibold text-white">{testimonials[current].name}</p>
                <p className="text-white/40 text-sm">{testimonials[current].villa} — {testimonials[current].location}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex justify-center gap-2 mt-10">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => { setDir(i > current ? 1 : -1); setCurrent(i); }}
                className={`h-2 rounded-full transition-all duration-500 ${i === current ? 'bg-luxury-accent w-10' : 'bg-white/20 w-2 hover:bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

