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
const UNFOLD_SCROLL = '110vh';

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
    let marqueeTween = null;
    let tl = null;
    let committed = false;

    const cardW = () => cards[0].offsetWidth;
    const spacing = () => cardW() + CARD_GAP;
    const slotX = (i) => CARD_PAD + i * spacing() + cardW() / 2 - stage.offsetWidth / 2;

    const setBase = () => {
      gsap.set(cards, { left: '50%', top: '50%', xPercent: -50, yPercent: -50 });
    };

    const setFan = () => {
      const stageH = stage.offsetHeight;
      const h = cards[0].offsetHeight;
      const center = (n - 1) / 2;
      const pivotY = Math.min(stageH - 40, Math.max(stageH * 0.62, h + 180));
      const y = pivotY - stageH / 2 - h / 2;
      cards.forEach((c, i) => {
        if (i < n) {
          const off = i - center;
          gsap.set(c, {
            x: 0,
            y,
            rotation: off * FAN_ANGLE,
            scale: 1 - Math.abs(off) * 0.03,
            transformOrigin: '50% 100%',
            zIndex: Math.round(n - Math.abs(off)),
            opacity: 1,
          });
        } else {
          gsap.set(c, { x: slotX(i), y: ROW_OFFSET, rotation: 0, scale: 1, transformOrigin: '50% 50%', zIndex: 1, opacity: 0 });
        }
      });
    };

    const setCarousel = () => {
      cards.forEach((c, i) => {
        gsap.set(c, { x: slotX(i), y: ROW_OFFSET, rotation: 0, scale: 1, transformOrigin: '50% 50%', zIndex: 2, opacity: 1 });
      });
      gsap.set(track, { x: 0 });
    };

    const startMarquee = () => {
      if (marqueeTween) marqueeTween.kill();
      if (reduceMotion) { gsap.set(track, { x: 0 }); return; }
      const dist = n * spacing();
      marqueeTween = gsap.to(track, { x: -dist, duration: dist / 40, ease: 'none', repeat: -1 });
      marqueeTween.timeScale(0);
      gsap.to(marqueeTween, { timeScale: 1, duration: 3, ease: 'power2.out', overwrite: true });
    };

    const commit = () => {
      if (committed) return;
      committed = true;
      committedRef.current = true;
      if (tl) {
        if (tl.scrollTrigger) tl.scrollTrigger.kill();
        tl.kill();
        tl = null;
      }
      setCarousel();
      startMarquee();
    };

    const pauseMarquee = () => { if (marqueeTween) marqueeTween.pause(); };
    const resumeMarquee = () => { if (marqueeTween) marqueeTween.play(); };
    track.addEventListener('pointerdown', pauseMarquee);
    window.addEventListener('pointerup', resumeMarquee);

    const onResize = () => {
      if (committed || committedRef.current) {
        setCarousel();
        startMarquee();
      } else if (tl && tl.scrollTrigger) {
        setFan();
        tl.scrollTrigger.refresh();
      }
    };
    window.addEventListener('resize', onResize);

    setBase();

    if (committedRef.current) {
      setCarousel();
      startMarquee();
      return () => {
        if (marqueeTween) marqueeTween.kill();
        window.removeEventListener('resize', onResize);
        track.removeEventListener('pointerdown', pauseMarquee);
        window.removeEventListener('pointerup', resumeMarquee);
      };
    }

    if (reduceMotion) {
      setCarousel();
      committedRef.current = true;
      committed = true;
      startMarquee();
      return () => {
        window.removeEventListener('resize', onResize);
        track.removeEventListener('pointerdown', pauseMarquee);
        window.removeEventListener('pointerup', resumeMarquee);
      };
    }

    setFan();

    tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: `+=${UNFOLD_SCROLL}`,
        scrub: true,
        invalidateOnRefresh: true,
        onRefresh: setFan,
      },
    });
    tl.eventCallback('onComplete', commit);

    const center = (n - 1) / 2;
    cards.forEach((c, i) => {
      if (i < n) {
        const delay = Math.abs(i - center) * 0.12;
        tl.to(c, {
          x: () => slotX(i),
          y: ROW_OFFSET,
          rotation: 0,
          scale: 1,
          transformOrigin: '50% 50%',
          duration: 1.8,
          ease: 'power3.inOut',
        }, delay);
      } else {
        tl.to(c, { opacity: 1, duration: 0.8, ease: 'power1.out' }, 0.65);
      }
    });

    return () => {
      if (tl) {
        if (tl.scrollTrigger) tl.scrollTrigger.kill();
        tl.kill();
      }
      if (marqueeTween) marqueeTween.kill();
      window.removeEventListener('resize', onResize);
      track.removeEventListener('pointerdown', pauseMarquee);
      window.removeEventListener('pointerup', resumeMarquee);
    };
  }, [isMobile, mobileSource]);

  return (
    <section className="relative bg-luxury-cream">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      {isMobile ? (
        <div ref={mobileRef} className="relative bg-luxury-cream" style={{ height: `calc(100dvh + ${UNFOLD_SCROLL})` }}>
          <div className="sticky top-0 h-[100dvh] overflow-hidden bg-luxury-cream">
            <div className="absolute top-0 left-0 right-0 z-20 pt-8 pb-4 bg-gradient-to-b from-luxury-cream via-luxury-cream/80 to-transparent pointer-events-none">
              <div className="luxury-container text-center">
                <span className="section-label">Gallery</span>
                <h2 className="section-title mb-3">A Visual Journey</h2>
                <p className="section-subtitle mx-auto">Explore the beauty and elegance that awaits at our handpicked destinations.</p>
              </div>
            </div>

            <div ref={stageRef} className="absolute inset-0">
              <div ref={trackRef} className="absolute inset-0 bg-luxury-cream will-change-transform">
                {mobileCards.map((img, i) => (
                  <div
                    key={i}
                    ref={(el) => { cardsRef.current[i] = el; }}
                    className="absolute will-change-transform cursor-pointer"
                    style={{ width: 'min(76vw, 310px)', height: 'min(102vw, 420px)' }}
                    onClick={() => setLightbox(i % mobileSource.length)}
                  >
                    <div className="relative w-full h-full overflow-hidden rounded-2xl shadow-2xl shadow-black/20">
                      <img src={img.src} alt={img.alt} className="w-full h-full object-cover" draggable={false} loading={i < 2 ? 'eager' : 'lazy'} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 p-5 pointer-events-none">
                        <h3 className="font-display text-base text-white">{img.alt}</h3>
                        <p className="text-white/60 text-[10px] tracking-wider uppercase mt-0.5">{img.location}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
