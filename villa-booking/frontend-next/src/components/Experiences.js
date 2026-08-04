'use client'
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FaCompass, FaUtensils, FaSpa, FaCamera, FaWineGlassAlt, FaMountain } from 'react-icons/fa';

const items = [
  { icon: FaCompass, title: 'Guided Explorations', desc: 'Curated excursions led by local experts to hidden gems and breathtaking viewpoints.' },
  { icon: FaUtensils, title: 'Gourmet Dining', desc: 'Private chef experiences featuring locally-sourced ingredients and seasonal menus.' },
  { icon: FaSpa, title: 'Wellness Retreats', desc: 'Holistic wellness programs including yoga, meditation, and spa treatments.' },
  { icon: FaCamera, title: 'Photography Tours', desc: 'Capture unforgettable moments with professional photographer guides.' },
  { icon: FaWineGlassAlt, title: 'Wine Tastings', desc: 'Exclusive tastings of regional wines in stunning cellars and vineyards.' },
  { icon: FaMountain, title: 'Adventure Sports', desc: 'From hiking to water sports, curated adventures for every thrill level.' },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

const CARD_GAP = 24;
const LOOP_SECONDS = 22;

const renderExp = (exp) => {
  const Icon = exp.icon;
  return (
    <div className="text-center group cursor-default">
      <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mx-auto mb-6 group-hover:bg-luxury-accent transition-all duration-700">
        <Icon className="text-2xl text-luxury-black group-hover:text-white transition-colors duration-700" />
      </div>
      <h3 className="font-display text-xl text-luxury-black mb-3">{exp.title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">{exp.desc}</p>
    </div>
  );
};

const MobileExperiencesSlider = () => {
  const scrollerRef = useRef(null);
  const cardRefs = useRef([]);
  const cards = [...items, ...items];

const measureRef = useRef(0); // width of one set of cards -> seamless loop boundary
  const speedRef = useRef(0);   // px per second (LEFT -> RIGHT)
  const reducedRef = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const scroller = scrollerRef.current;
    const n = items.length;
    if (!scroller || !n) return undefined;

    const computeMetrics = () => {
      const first = cardRefs.current[0];
      const dup = cardRefs.current[n];
      if (!first || !dup) {
        measureRef.current = 0;
        return;
      }
      measureRef.current = Math.max(0, dup.offsetLeft - first.offsetLeft);
      speedRef.current = measureRef.current > 0 ? measureRef.current / LOOP_SECONDS : 0;
    };

    const onResize = () => {
      computeMetrics();
      if (scroller.scrollLeft < 0) scroller.scrollLeft = 0;
      if (scroller.scrollLeft > scroller.scrollWidth - scroller.clientWidth) {
        scroller.scrollLeft = scroller.scrollWidth - scroller.clientWidth;
      }
    };

    computeMetrics();
    window.addEventListener('resize', onResize);

    let visible = true;

    let raf = 0;
    let last = performance.now();
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      if (!visible || reducedRef.current) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      if (speedRef.current <= 0) return;

      let scrollLeft = scroller.scrollLeft - speedRef.current * dt; // LEFT -> RIGHT
      if (scrollLeft < 0) scrollLeft += measureRef.current;         // seamless wrap
      scroller.scrollLeft = scrollLeft;
    };
    raf = requestAnimationFrame(tick);

    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.05 });
    io.observe(scroller);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={scrollerRef}
      className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing transform-gpu select-none"
      style={{
        touchAction: 'pan-x pan-y',
        overscrollBehaviorX: 'contain',
        WebkitOverflowScrolling: 'touch',
        willChange: 'transform',
      }}
    >
      <div className="flex w-max transform-gpu" style={{ gap: CARD_GAP }}>
        {cards.map((exp, i) => (
          <div
            key={i}
            ref={(el) => { cardRefs.current[i] = el; }}
            className="shrink-0 flex items-center justify-center"
            style={{ width: 'min(85vw, 340px)' }}
          >
            {renderExp(exp)}
          </div>
        ))}
      </div>
    </div>
  );
};

const Experiences = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <section className="section-padding bg-luxury-cream">
      <div className="luxury-container">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="section-label">Experiences</span>
          <h2 className="section-title mb-4">Beyond The Villa</h2>
          <p className="section-subtitle mx-auto">Immersive experiences crafted to make your stay truly unforgettable.</p>
        </motion.div>

        {isMobile ? (
          <div className="-mx-6">
            <MobileExperiencesSlider />
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((exp) => (
              <motion.div key={exp.title} variants={item} whileHover={{ y: -6 }}>
                {renderExp(exp)}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Experiences;
