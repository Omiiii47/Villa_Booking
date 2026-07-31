import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { FaAward, FaGlobe, FaHandshake, FaHeart } from 'react-icons/fa';

const stats = [
  { value: 15, suffix: '+', label: 'Years of Excellence' },
  { value: 200, suffix: '+', label: 'Premium Villas' },
  { value: 30, suffix: '+', label: 'Destinations' },
  { value: 50, suffix: 'K+', label: 'Happy Guests' },
];

const values = [
  { icon: FaAward, title: 'Uncompromising Quality', desc: 'Every villa in our collection meets the highest standards of luxury and comfort.' },
  { icon: FaGlobe, title: 'Global Reach', desc: 'Curated properties in the most breathtaking destinations across six continents.' },
  { icon: FaHandshake, title: 'Personalized Service', desc: 'Dedicated concierge crafting bespoke experiences for every guest.' },
  { icon: FaHeart, title: 'Sustainable Luxury', desc: 'Commitment to eco-conscious travel and supporting local communities.' },
];

const Counter = ({ value, suffix, label, delay }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const inc = value / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= value) { setCount(value); clearInterval(t); }
      else setCount(Math.floor(cur));
    }, duration / steps);
    return () => clearInterval(t);
  }, [isInView, value]);

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay }} className="text-center">
      <motion.span initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: delay + 0.2, type: 'spring' }}
        className="font-display text-5xl md:text-6xl text-luxury-accent block mb-2">{count}{suffix}</motion.span>
      <span className="text-gray-500 text-sm">{label}</span>
    </motion.div>
  );
};

const About = () => (
  <>
    <section className="pt-36 pb-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-luxury-accent/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/4" />
      <div className="luxury-container relative">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
          <span className="section-label">About Us</span>
          <h1 className="font-display text-display-xl text-luxury-black mt-4 mb-8">
            Redefining the Art of <span className="italic text-luxury-accent">Extraordinary Travel</span>
          </h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-gray-500 text-lg leading-relaxed font-light">
            Serenity Escapes was born from a simple belief: that the right setting can transform a vacation into a
            life-defining memory. For over a decade, we have been curating the world's most exceptional villas,
            pairing unparalleled properties with impeccable service.
          </motion.p>
        </motion.div>
      </div>
    </section>

    <section className="py-24 bg-luxury-cream">
      <div className="luxury-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((s, i) => <Counter key={s.label} {...s} delay={i * 0.1} />)}
        </div>
      </div>
    </section>

    <section className="py-24">
      <div className="luxury-container">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="section-title mb-4">Our Values</h2>
          <p className="section-subtitle mx-auto">The principles that guide every interaction and every villa we curate.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <motion.div key={v.title} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }} whileHover={{ y: -6 }} className="text-center group cursor-default">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-luxury-accent/20 to-luxury-accent/5 flex items-center justify-center mx-auto mb-5 group-hover:from-luxury-accent group-hover:to-luxury-accent/80 transition-all duration-500">
                  <Icon className="text-2xl text-luxury-accent group-hover:text-white transition-colors duration-500" />
                </div>
                <h3 className="font-display text-xl text-luxury-black mb-3">{v.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">{v.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>

    <section className="py-24 bg-luxury-black text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #C4A484 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      <div className="luxury-container relative">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-display-lg mb-6">A Message From Our Founder</h2>
          <div className="w-16 h-[1px] bg-luxury-accent mx-auto mb-8" />
          <p className="text-gray-400 font-light text-lg leading-relaxed italic">
            "We believe that luxury is not about excess — it is about perfection in every detail.
            From the thread count of your sheets to the angle of your sunset view, we obsess over
            what matters so you can focus on what truly does: creating memories that last a lifetime."
          </p>
          <p className="mt-8 font-display text-luxury-accent">— Isabella Romano, Founder</p>
        </motion.div>
      </div>
    </section>
  </>
);

export default About;
