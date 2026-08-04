'use client'
import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { gsap } from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaChevronLeft, FaChevronRight, FaExpand } from 'react-icons/fa';
import useSiteContent from '../hooks/useSiteContent';

const FRAME_W = 220;
const PHOTO_H = 200;
const SPROCKET_H = 30;
const STAGE_H = PHOTO_H + SPROCKET_H * 2 + 6;
const MARQUEE_SPEED = 30;
const FILM_BASE = '#171614';
const SPROCKET_GOLD = '#C9A96A';
const FILM_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const SPROCKET_STYLE = {
  backgroundColor: FILM_BASE,
  backgroundImage:
    `radial-gradient(ellipse 6px 5px at center, ${SPROCKET_GOLD} 55%, rgba(0,0,0,0) 60%)`,
  backgroundSize: '30px 100%',
  backgroundPosition: 'center',
  backgroundRepeat: 'repeat-x',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
};

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

const Gallery = () => {
  const stageRef = useRef(null);
  const trackRef = useRef(null);
  const filmBaseRef = useRef(null);
  const ctaRef = useRef(null);
  const frameRefs = useRef([]);
  const flickerRef = useRef(null);
  const shakeRef = useRef(null);
  const marqueeState = useRef({ x: 0, paused: false, dragging: false, lastX: 0 });
  const metricsRef = useRef({ dist: 0 });
  const reduceMotionRef = useRef(false);
  const unrolledRef = useRef(false);
  const [lightbox, setLightbox] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [gutterW, setGutterW] = useState(0);
  const [unrolled, setUnrolled] = useState(false);

  const siteContent = useSiteContent();
  const galleryImages = siteContent?.gallery?.length ? siteContent.gallery : DEFAULT_IMAGES;
  const desktopImages = galleryImages.length > 6 ? galleryImages.filter((_, i) => i !== 6) : galleryImages;
  const mobileSource = useMemo(() => galleryImages.slice(0, Math.min(6, galleryImages.length)), [galleryImages]);
  const stackImages = mobileSource.slice(0, Math.min(4, mobileSource.length));
  const images = desktopImages;
  const lightboxImages = isMobile ? mobileSource : galleryImages;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const next = Math.max(0, Math.round((stage.clientWidth - FRAME_W) / 2));
      setGutterW((prev) => (prev === next ? prev : next));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isMobile]);

  const stopAtmosphere = useCallback(() => {
    if (flickerRef.current) { flickerRef.current.kill(); flickerRef.current = null; }
    if (shakeRef.current) { shakeRef.current.kill(); shakeRef.current = null; }
  }, []);

  const startAtmosphere = useCallback(() => {
    stopAtmosphere();
    const film = filmBaseRef.current;
    const stage = stageRef.current;
    if (reduceMotionRef.current || !film || !stage) return;
    flickerRef.current = gsap.to(film, { opacity: 0.985, duration: 0.32, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    shakeRef.current = gsap.to(stage, { x: '+=0.7', duration: 0.22, repeat: -1, yoyo: true, ease: 'sine.inOut', repeatDelay: 0.9 });
  }, [stopAtmosphere]);

  const handleUnroll = useCallback(() => {
    if (unrolledRef.current) return;
    unrolledRef.current = true;
    setUnrolled(true);

    const track = trackRef.current;
    const film = filmBaseRef.current;
    const frames = frameRefs.current.filter(Boolean);
    if (!track || !film || !frames.length) return;
    const reduce = reduceMotionRef.current;

    if (ctaRef.current) {
      gsap.to(ctaRef.current, { opacity: 0, scale: 1.06, duration: 0.4, ease: 'power2.in' });
    }

    gsap.to(film, { opacity: 1, duration: 0.5, ease: 'power1.out', delay: 0.05 });
    gsap.to(track, { opacity: 1, duration: 0.4, ease: 'power1.out', delay: 0.05 });

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(frames, { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, transformOrigin: '50% 50%' });
        marqueeState.current.x = 0;
        marqueeState.current.paused = false;
        if (!reduce) startAtmosphere();
      },
    });

    tl.fromTo(
      frames,
      { x: 70, y: 46, rotation: 7, scaleY: 0.45, opacity: 0 },
      { x: 0, y: 0, rotation: 0, scaleY: 1, opacity: 1, duration: 1.0, ease: 'elastic.out(1, 0.55)', stagger: 0.06 }
    );

    if (!reduce) {
      gsap.fromTo(
        track,
        { x: 40 },
        { x: 0, duration: 1.1, ease: 'power1.out' }
      );
    }
  }, [startAtmosphere]);

  useEffect(() => {
    if (!isMobile) return;
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!stage || !track) return;
    reduceMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    metricsRef.current.dist = mobileSource.length * FRAME_W + gutterW;
    const s = marqueeState.current;

    const onDown = (e) => {
      if (!unrolledRef.current) return;
      s.paused = true;
      s.dragging = true;
      s.lastX = e.touches ? e.touches[0].clientX : e.clientX;
    };
    const onMove = (e) => {
      if (!s.dragging) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const dx = x - s.lastX;
      s.lastX = x;
      s.x -= dx;
      const d = metricsRef.current.dist || 1;
      gsap.set(track, { x: -(((s.x % d) + d) % d) });
    };
    const onUp = () => {
      if (!s.dragging) return;
      s.dragging = false;
      const d = metricsRef.current.dist || 1;
      s.x = ((s.x % d) + d) % d;
      s.paused = false;
    };

    const tick = () => {
      if (!unrolledRef.current || s.paused || reduceMotionRef.current) return;
      const d = metricsRef.current.dist;
      if (!d) return;
      s.x += MARQUEE_SPEED * 0.016;
      gsap.set(track, { x: -(((s.x % d) + d) % d) });
    };

    stage.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    if (unrolledRef.current) {
      gsap.set(track, { x: 0, opacity: 1 });
      if (filmBaseRef.current) gsap.set(filmBaseRef.current, { opacity: 1 });
      startAtmosphere();
    }

    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      stopAtmosphere();
      stage.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isMobile, mobileSource, gutterW, startAtmosphere, stopAtmosphere]);

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

          <div className="px-6 pb-14">
            <div
              ref={stageRef}
              className="relative overflow-hidden rounded-2xl select-none shadow-[0_30px_60px_-25px_rgba(0,0,0,0.45)]"
              style={{ height: STAGE_H, background: '#F8F6F2' }}
            >
              <div
                ref={filmBaseRef}
                className="absolute inset-0 opacity-0"
                style={{ background: FILM_BASE }}
              >
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay"
                  style={{ backgroundImage: FILM_GRAIN, backgroundSize: '256px 256px' }}
                />
                <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
              </div>

              <div
                ref={trackRef}
                className="absolute left-0 top-0 h-full flex items-center will-change-transform opacity-0"
                style={{ width: (mobileSource.length * FRAME_W + gutterW) * 2 }}
              >
                <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ height: SPROCKET_H, ...SPROCKET_STYLE }} />
                <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: SPROCKET_H, ...SPROCKET_STYLE }} />

                {Array.from({ length: 2 }).flatMap((_, copy) => {
                  const base = copy * mobileSource.length;
                  return [
                    <div key={`spacer-${copy}`} aria-hidden className="shrink-0" style={{ width: gutterW }} />,
                    ...mobileSource.map((img, i) => {
                      const idx = base + i;
                      return (
                        <div
                          key={`${img.src}-${idx}`}
                          ref={(el) => { frameRefs.current[idx] = el; }}
                          className="relative shrink-0 cursor-pointer"
                          style={{ width: FRAME_W, padding: '3px 2px' }}
                        >
                          <div
                            className="overflow-hidden"
                            style={{
                              height: PHOTO_H,
                              marginTop: SPROCKET_H,
                              marginBottom: SPROCKET_H,
                              boxShadow: '0 3px 10px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.08)',
                            }}
                          >
                            <img
                              src={img.src}
                              alt={img.alt}
                              className="w-full h-full object-cover"
                              loading={i < 2 ? 'eager' : 'lazy'}
                              draggable={false}
                              onClick={() => setLightbox(i % mobileSource.length)}
                            />
                          </div>
                        </div>
                      );
                    }),
                  ];
                })}
              </div>

              <AnimatePresence>
                {!unrolled && (
                  <motion.button
                    key="cta"
                    ref={ctaRef}
                    onClick={handleUnroll}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-luxury-cream/60 backdrop-blur-[2px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="relative" style={{ width: 200, height: 200 }}>
                      {stackImages.map((img, i) => (
                        <div
                          key={`${img.src}-${i}`}
                          className="absolute inset-0 overflow-hidden rounded-xl"
                          style={{
                            transform: `rotate(${(i - (stackImages.length - 1) / 2) * 7}deg) translateY(${(i - (stackImages.length - 1) / 2) * 10}px)`,
                            boxShadow: '0 14px 34px rgba(0,0,0,0.32)',
                            zIndex: i,
                            background: '#fff',
                          }}
                        >
                          <img src={img.src} alt={img.alt} className="w-full h-full object-cover" draggable={false} />
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-luxury-black text-white text-[10px] uppercase tracking-[0.2em] px-6 py-3 shadow-xl shadow-black/20">
                        <span className="text-sm">🎎️</span> Tap to Unroll
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.3em] text-luxury-accent">Reveal the Journey</span>
                    </div>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {unrolled && (
              <p className="text-center mt-5 text-[10px] uppercase tracking-[0.25em] text-gray-400">Swipe the film strip ⟷</p>
            )}
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

