'use client'
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLandingCms } from '../context/LandingCmsContext';
import useIsMobile from '../hooks/useIsMobile';
import { getLandingIcon } from '../constants/landingIcons';

const DEFAULT_ITEMS = [
  { icon: 'FaSwimmer', name: 'Infinity Pool', desc: 'Heated infinity edge pool with panoramic views' },
  { icon: 'FaUtensils', name: 'Private Chef', desc: 'In-villa dining with personal chef service' },
  { icon: 'FaSpa', name: 'Spa & Wellness', desc: 'Full-service spa with massage and treatments' },
  { icon: 'FaWineBottle', name: 'Wine Cellar', desc: 'Curated wine selection and sommelier service' },
  { icon: 'FaUmbrellaBeach', name: 'Private Beach', desc: 'Exclusive beach access with loungers' },
  { icon: 'FaPray', name: 'Yoga Pavilion', desc: 'Daily yoga and meditation sessions' },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

const CARD_GAP = 20;
const LOOP_SECONDS = 22;

const renderCard = (a) => {
  const Icon = getLandingIcon(a.icon);
  return (
    <div className="group card-premium p-8 cursor-default">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-luxury-accent/20 to-luxury-accent/5 flex items-center justify-center mb-5 group-hover:from-luxury-accent group-hover:to-luxury-accent/80 transition-all duration-500">
        <Icon className="text-xl text-luxury-accent group-hover:text-white transition-colors duration-500" />
      </div>
      <h3 className="font-display text-lg text-luxury-black mb-2">{a.name}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{a.desc}</p>
    </div>
  );
};

const MobileAmenitiesSlider = ({ items }) => {
  const scrollerRef = useRef(null);
  const cardRefs = useRef([]);
  const cards = [...items, ...items];

  const measureRef = useRef(0); // width of one set of cards -> seamless loop boundary
  const speedRef = useRef(0);   // px per second
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
      if (scroller.scrollLeft > measureRef.current) scroller.scrollLeft = measureRef.current;
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

      let scrollLeft = scroller.scrollLeft;
      if (measureRef.current > 0 && scrollLeft >= measureRef.current) {
        scrollLeft -= measureRef.current;
        scroller.scrollLeft = scrollLeft;
      }

      if (speedRef.current > 0) {
        scroller.scrollLeft = scrollLeft + speedRef.current * dt;
      }
    };
    raf = requestAnimationFrame(tick);

    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.05 });
    io.observe(scroller);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      io.disconnect();
    };
  }, [items.length]);

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
        {cards.map((a, i) => (
          <div
            key={i}
            ref={(el) => { cardRefs.current[i] = el; }}
            className="shrink-0"
            style={{ width: 'min(85vw, 360px)' }}
          >
            {renderCard(a)}
          </div>
        ))}
      </div>
    </div>
  );
};

const Amenities = () => {
  const { landing } = useLandingCms();
  const isMobile = useIsMobile();
  const amenities = (isMobile ? landing?.mobile : landing?.desktop)?.amenities || {};
  const items = amenities.items?.length ? amenities.items : DEFAULT_ITEMS;

  return (
    <section className="section-padding">
      <div className="luxury-container">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="section-label">{amenities.label || 'Amenities'}</span>
          <h2 className="section-title mb-4">{amenities.title || 'The Finest Experiences'}</h2>
          <p className="section-subtitle mx-auto">{amenities.subtitle || 'Every villa is curated with world-class amenities designed to elevate your stay.'}</p>
        </motion.div>

        {isMobile ? (
          <div className="-mx-6">
            <MobileAmenitiesSlider items={items} />
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((a) => (
              <motion.div key={a.name} variants={item} whileHover={{ y: -6 }}>
                {renderCard(a)}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Amenities;
