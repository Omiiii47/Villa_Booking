'use client'
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';
import { useRef } from 'react';
import Magnetic from './Magnetic';
import { useLandingCms } from '../context/LandingCmsContext';
import useIsMobile from '../hooks/useIsMobile';
import { imgUrl } from '../utils/imgUrl';
import { getVillas } from '../services/villaService';

const normalize = (value) => String(value || '').toLowerCase().trim().replace(/\s+/g, ' ');

const VillaCard = ({ villa, i }) => {
  const cardRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: cardRef, offset: ['start end', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], ['-4%', '4%']);
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.12, 1.0, 1.08]);
  const imageSrc = imgUrl(villa.image);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -8 }}
      className="group relative h-[480px] rounded-2xl overflow-hidden cursor-pointer bg-luxury-black"
    >
      {imageSrc && (
        <motion.div style={{ y: imageY }} className="absolute inset-0 will-change-transform">
          <motion.div
            className="w-full h-full"
            style={{ scale: imageScale }}
            initial={{ scale: 1.12 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.img
              src={imageSrc}
              alt={villa.name}
              className="w-full h-full object-cover"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={{ scale: 1.08 }}
            />
          </motion.div>
        </motion.div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: i * 0.15 + 0.3 }}
        className="absolute top-5 left-5"
      >
        <span className="inline-block bg-white/10 backdrop-blur-md text-white text-[8px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-white/10">
          {villa.tag}
        </span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: i * 0.15 + 0.4 }}
        className="absolute bottom-0 left-0 right-0 p-6"
      >
        <h3 className="font-display text-xl text-white mb-1">{villa.name}</h3>
        <p className="text-white/60 text-xs mb-1 line-clamp-2">{villa.desc}</p>
        <p className="text-luxury-accent text-xs mb-4">From {villa.price} / night</p>
        <div className="flex gap-2">
          <Link href={`/villas/${villa.slug}?book=1`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-luxury-accent text-white text-[10px] uppercase tracking-[0.15em] transition-all hover:bg-luxury-accent/90">
            Book Now
          </Link>
          <Link href={`/villas/${villa.slug}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/30 text-white text-[10px] uppercase tracking-[0.15em] hover:bg-white/10 transition-all">
            Explore Villa <FaArrowRight className="text-[10px]" />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
};

const VillaShowcase = () => {
  const { landing } = useLandingCms();
  const isMobile = useIsMobile();
  const showcase = (isMobile ? landing?.mobile : landing?.desktop)?.showcase || {};
  const [dbVillas, setDbVillas] = useState([]);

  useEffect(() => {
    let active = true;
    getVillas({ limit: 100 })
      .then((data) => { if (active) setDbVillas(data.villas || []); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const resolvedItems = useMemo(() => {
    const byName = new Map();
    const bySlug = new Map();
    dbVillas.forEach((v) => {
      byName.set(normalize(v.name), v.slug);
      bySlug.set(normalize(v.slug), v.slug);
    });
    return (showcase.items || []).map((item) => {
      const nameSlug = byName.get(normalize(item.name));
      const slugSlug = bySlug.get(normalize(item.slug));
      const slug = nameSlug || slugSlug || item.slug;
      return { ...item, slug };
    });
  }, [showcase.items, dbVillas]);

  const villas = resolvedItems;

  return (
    <section className="section-padding bg-luxury-cream relative overflow-hidden">
      <div className="luxury-container">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
        >
          <div>
            <span className="section-label">{showcase.label || 'Collection'}</span>
            <h2 className="section-title mb-4">{showcase.title || 'Signature Villas'}</h2>
            <p className="section-subtitle">{showcase.subtitle || "A hand-selected portfolio of the world's most extraordinary private villas."}</p>
          </div>
          <Magnetic>
            <Link href="/villas" className="btn-outline !px-8 !py-3.5 text-[10px]">
              <span>View All</span>
              <FaArrowRight className="relative z-10 text-xs" />
            </Link>
          </Magnetic>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {villas.map((villa, i) => (
            <div key={villa.slug} className={i === 2 ? 'hidden md:block' : ''}>
              <VillaCard villa={villa} i={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VillaShowcase;