import { useRef, useEffect, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaChevronLeft, FaChevronRight, FaExpand } from 'react-icons/fa';
import useSiteContent from '../hooks/useSiteContent';

gsap.registerPlugin(ScrollTrigger);

const CARD_GAP = 18;
const CARD_PAD = 24;
const FAN_ANGLE = 10;
const ROW_OFFSET = 52;

const UNFOLD_END = 0.85;
const DRIFT_PX = 26;
const MARQUEE_SPEED = 50;
const EASE_IN = 1.1;

const DEFAULT_IMAGES = [
  { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80', alt: 'The Grand Horizon', location: 'Cliffside Bay, Maldives', size: 'md' },
  { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80', alt: 'Infinity Serenity', location: 'Azure Coast, Greece', size: 'sm' },
  { src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80', alt: 'Sunset Pavilion', location: 'Tuscany, Italy', size: 'sm' },
  { src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80', alt: 'Azure Cove', location: 'Private Beach, Seychelles', size: 'md' },
  { src: 'https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=1200&q=80', alt: 'Golden Hour Lounge', location: 'Coastal Ridge, Bali', size: 'sm' },
  { src: 'https://images.unsplash.com/photo-1615571022219-eb45cf7faa36?w=1200&q=80', alt: 'Canopy Haven', location: 'Rainforest Reserve, Costa Rica', size: 'sm' },
  { src: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=1200&q=80', alt: 'Crystal Baths', location: 'Alpine Retreat, Switzerland', size: 'md' },
];

const itemVariants = {
  hidden: { opacity: 0, scale: 0.6, y: 30 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (t) => t * t * (3 - 2 * t);

const Gallery = () => {
  const mobileRef = useRef(null);
  const stageRef = useRef(null);
  const trackRef = useRef(null);
  const cardsRef = useRef([]);
  const committedRef = useRef(false);
  const [lightbox, setLightbox] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const siteContent = useSiteContent();
  const galleryImages = (siteContent?.gallery?.length ? siteContent.gallery : DEFAULT_IMAGES);
  const desktopImages = galleryImages.length > 6 ? galleryImages.filter((_, i) => i !== 6) : galleryImages;
  const mobileSource = useMemo(() => galleryImages.slice(0, Math.min(6, galleryImages.length)), [galleryImages]);
  const mobileCards = useMemo(() => [...mobileSource, ...mobileSource], [mobileSource]);
  const images = isMobile ? mobileCards : desktopImages;
  const lightboxImages = isMobile ? mobileSource : galleryImages;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const cards = cardsRef.current.filter(Boolean).slice(0, mobileSource.length * 2);
    const stage = stageRef.current;
    const track = trackRef.current;
    const section = mobileRef.current;
    if (!cards.length || !stage || !track || !section) return;

    const n = mobileSource.length;
    if (!n) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const metrics = { stageW: 0, stageH: 0, cardW: 0, cardH: 0, spacing: 0, slotX: [], dist: 0 };
    const computeMetrics = () => {
      metrics.stageW = stage.offsetWidth;
      metrics.stageH = stage.offsetHeight;
      metrics.cardW = cards[0].offsetWidth;
      metrics.cardH = cards[0].offsetHeight;
      metrics.spacing = metrics.cardW + CARD_GAP;
      metrics.slotX = cards.map((_, i) => CARD_PAD + i * metrics.spacing + metrics.cardW / 2 - metrics.stageW / 2);
      metrics.dist = n * metrics.spacing;
    };

    const center = (n - 1) / 2;

    let committed = false;
    let marqueeX = 0;
    let launchT = 0;
    let paused = false;

    const progress = { p: 0 };

    const render = () => {
      const p = committed ? 1 : progress.p;
      const u = smoothstep(clamp01(p / UNFOLD_END));

      if (u < 1) {
        const pivotY = Math.min(metrics.stageH - 40, Math.max(metrics.stageH * 0.62, metrics.cardH + 180));
        const fanY = pivotY - metrics.stageH / 2 - metrics.cardH / 2;
        for (let i = 0; i < n; i++) {
          const off = i - center;
          const fanRot = off * FAN_ANGLE;
          const fanScale = 1 - Math.abs(off) * 0.03;
          gsap.set(cards[i], {
            x: metrics.slotX[i] * u,
            y: fanY + (ROW_OFFSET - fanY) * u,
            rotation: fanRot * (1 - u),
            scale: fanScale + (1 - fanScale) * u,
            transformOrigin: '50% 100%',
            zIndex: Math.round(n - Math.abs(off)),
            opacity: 1,
          });
        }
        const fade = clamp01((u - 0.72) / 0.28);
        for (let i = n; i < cards.length; i++) {
          gsap.set(cards[i], {
            x: metrics.slotX[i],
            y: ROW_OFFSET,
            rotation: 0,
            scale: 1,
            transformOrigin: '50% 50%',
            zIndex: 2,
            opacity: fade,
          });
        }
      } else {
        for (let i = 0; i < cards.length; i++) {
          gsap.set(cards[i], {
            x: metrics.slotX[i],
            y: ROW_OFFSET,
            rotation: 0,
            scale: 1,
            transformOrigin: '50% 50%',
            zIndex: 2,
            opacity: 1,
          });
        }
      }

      let trackX;
      if (reduceMotion) {
        trackX = 0;
      } else if (!committed) {
        trackX = p <= UNFOLD_END ? 0 : -DRIFT_PX * ((p - UNFOLD_END) / (1 - UNFOLD_END));
      } else {
        trackX = -(marqueeX % metrics.dist);
      }
      gsap.set(track, { x: trackX });
    };

    const tick = (_time, deltaTime) => {
      if (!committed || paused || reduceMotion) return;
      const dt = (deltaTime || 16) / 1000;
      launchT = Math.min(launchT + dt, EASE_IN);
      const mul = 0.35 + 0.65 * (1 - Math.pow(1 - launchT / EASE_IN, 3));
      marqueeX += MARQUEE_SPEED * mul * dt;
      render();
    };

    const onResize = () => {
      computeMetrics();
      if (committed) {
        render();
      } else if (tl && tl.scrollTrigger) {
        render();
        tl.scrollTrigger.refresh();
      }
    };

    const pauseMarquee = () => { paused = true; };
    const resumeMarquee = () => { paused = false; };
    track.addEventListener('pointerdown', pauseMarquee);
    window.addEventListener('pointerup', resumeMarquee);

    computeMetrics();
    gsap.set(cards, { left: '50%', top: '50%', xPercent: -50, yPercent: -50 });

    let tl = null;

    if (committedRef.current || reduceMotion) {
      committed = true;
      committedRef.current = true;
      progress.p = 1;
      render();
      gsap.ticker.add(tick);
      return () => {
        if (tl) { if (tl.scrollTrigger) tl.scrollTrigger.kill(); tl.kill(); }
        gsap.ticker.remove(tick);
        window.removeEventListener('resize', onResize);
        track.removeEventListener('pointerdown', pauseMarquee);
        window.removeEventListener('pointerup', resumeMarquee);
      };
    }

    render();

    tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=100vh',
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: () => render(),
        onRefresh: () => render(),
      },
    });
    tl.to(progress, { p: 1, duration: 1, ease: 'none' });
    tl.eventCallback('onComplete', () => {
      if (committed) return;
      committed = true;
      committedRef.current = true;
      progress.p = 1;
      marqueeX = DRIFT_PX;
      render();
    });

    gsap.ticker.add(tick);

    return () => {
      if (tl) {
        if (tl.scrollTrigger) tl.scrollTrigger.kill();
        tl.kill();
      }
      gsap.ticker.remove(tick);
      window.removeEventListener('resize', onResize);
      track.removeEventListener('pointerdown', pauseMarquee);
      window.removeEventListener('pointerup', resumeMarquee);
    };
  }, [isMobile, mobileSource]);

  return (
    <section className="relative bg-luxury-cream">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      {isMobile ? (
        <div className="relative bg-luxury-cream">
          <div className="luxury-container text-center pt-14 pb-6">
            <span className="section-label">Gallery</span>
            <h2 className="section-title mb-3">A Visual Journey</h2>
            <p className="section-subtitle mx-auto">Explore the beauty and elegance that awaits at our handpicked destinations.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 px-6 pb-14">
            {lightboxImages.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`relative overflow-hidden rounded-2xl bg-luxury-cream ${
                  img.size === 'md' ? 'col-span-2 aspect-[16/10]' : 'col-span-1 aspect-[4/5]'
                }`}
                onClick={() => setLightbox(i)}
              >
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover" loading={i < 2 ? 'eager' : 'lazy'} draggable={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
                  <h3 className="font-display text-sm text-white leading-tight">{img.alt}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="section-padding">
          <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="section-label">Gallery</span>
              <h2 className="section-title mt-2">A Visual Journey</h2>
              <p className="section-subtitle mx-auto mt-4">Explore the beauty and elegance that awaits at our handpicked destinations.</p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-100px' }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
            >
              {images.map((img, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setLightbox(i)}
                  className={`relative overflow-hidden rounded-2xl group cursor-pointer ${
                    img.size === 'md' ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'
                  }`}
                >
                  <img src={img.src} alt={img.alt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading={i < 2 ? 'eager' : 'lazy'} />
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      whileHover={{ scale: 1 }}
                      className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
                    >
                      <FaExpand className="text-white text-sm" />
                    </motion.div>
                  </motion.div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none">
                    <h3 className="font-display text-sm md:text-base text-white">{img.alt}</h3>
                    <p className="text-white/60 text-[9px] md:text-[10px] tracking-wider uppercase mt-0.5">{img.location}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            <button onClick={() => setLightbox(null)} className="absolute top-8 right-8 text-white/50 hover:text-white text-xl z-10 transition-colors">
              <FaTimes />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setLightbox((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length); }}
              className="absolute left-6 top-1/2 -translate-x-1/2 text-white/50 hover:text-white text-2xl z-10 transition-colors">
              <FaChevronLeft />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setLightbox((prev) => (prev + 1) % lightboxImages.length); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-2xl z-10 transition-colors">
              <FaChevronRight />
            </button>
            <motion.img
              key={lightbox}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              src={lightboxImages[lightbox % lightboxImages.length].src}
              alt={lightboxImages[lightbox % lightboxImages.length].alt}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
            >
              <p className="text-white/70 text-xs tracking-widest uppercase">{lightbox + 1} / {lightboxImages.length}</p>
              <p className="text-white/50 text-[10px] tracking-widest uppercase mt-1">{lightboxImages[lightbox % lightboxImages.length].alt} — {lightboxImages[lightbox % lightboxImages.length].location}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Gallery;
