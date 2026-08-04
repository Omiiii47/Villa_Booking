'use client'
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Magnetic from './Magnetic';
import WordSplit from './SplitText';
import { useLandingCms } from '../context/LandingCmsContext';
import useIsMobile from '../hooks/useIsMobile';
import { imgUrl } from '../utils/imgUrl';

const DEFAULT_HERO = {
  eyebrow: 'Extraordinary Stays Await',
  titleLine1: 'Where Luxury',
  titleLine2: 'Meets Nature',
  subtitle: "Discover an exclusive collection of handpicked villas nestled in the world's most breathtaking destinations.",
  ctaPrimary: 'Explore Villas',
  ctaSecondary: 'Discover More',
};

const Hero = () => {
  const ref = useRef(null);
  const { landing } = useLandingCms();
  const isMobile = useIsMobile();
  const hero = (isMobile ? landing?.mobile : landing?.desktop)?.hero || DEFAULT_HERO;
  const heroImage = imgUrl(hero.image);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <section ref={ref} className="relative h-screen min-h-[750px] flex items-center justify-center overflow-hidden bg-luxury-black">
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        {heroImage && (
          <motion.img
            src={heroImage}
            alt={hero.eyebrow || 'Luxury villa'}
            className="w-full h-[120%] object-cover"
            style={{ scale }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/70" />
      </motion.div>

      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0, 0.15, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
      >
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-luxury-accent/20 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-white/10 blur-[100px]" />
      </motion.div>

      <motion.div style={{ opacity }} className="relative z-10 text-center px-6 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-6"
        >
          <span className="inline-block font-body text-[10px] md:text-xs uppercase tracking-[0.3em] text-luxury-accent bg-white/10 backdrop-blur-md px-6 py-2 rounded-full">
            {hero.eyebrow}
          </span>
        </motion.div>

        <h1 className="font-display text-hero text-white leading-[0.95] mb-8">
          <WordSplit text={hero.titleLine1} stagger={0.04} className="block" />
          <WordSplit text={hero.titleLine2} stagger={0.04} delay={0.4} className="block italic font-light mt-2" />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="text-white/70 text-base md:text-lg font-light max-w-xl mx-auto mb-12 leading-relaxed"
        >
          {hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-5 justify-center items-center"
        >
          <Magnetic>
            <Link href="/villas" className="btn-primary !bg-white !text-luxury-black hover:!text-white !px-12">
              <span>{hero.ctaPrimary}</span>
              <svg className="w-4 h-4 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </Magnetic>
          <Magnetic>
            <Link href="/about" className="btn-outline !border-white !text-white hover:!text-white !px-12">
              <span>{hero.ctaSecondary}</span>
            </Link>
          </Magnetic>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-body">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/40 to-transparent" />
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#F8F6F2] to-transparent z-10 pointer-events-none" />
    </section>
  );
};

export default Hero;

