'use client'
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';
import { useRef } from 'react';
import Magnetic from './Magnetic';
import { useLandingCms } from '../context/LandingCmsContext';
import useIsMobile from '../hooks/useIsMobile';
import { imgUrl } from '../utils/imgUrl';

const DEFAULT_VILLAS = [
  {
    name: 'The Grand Horizon', slug: 'the-grand-horizon',
    image: '',
    tag: 'Oceanfront', price: '$2,500', desc: 'A breathtaking cliffside retreat with panoramic ocean views',
  },
  {
    name: 'Azure Cove Villa', slug: 'azure-cove-villa',
    image: '',
    tag: 'Beachfront', price: '$3,200', desc: 'Private beachfront paradise with crystalline waters',
  },
  {
    name: 'The Emerald Canopy', slug: 'the-emerald-canopy',
    image: '',
    tag: 'Rainforest', price: '$1,800', desc: 'A treetop sanctuary immersed in ancient rainforest',
  },
];

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
      className="group relative h-[420px] rounded-2xl overflow-hidden cursor-pointer bg-luxury-black"
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
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.15 + 0.6 }}
          className="inline-flex items-center gap-2 text-white/80 text-[10px] uppercase tracking-[0.2em] group-hover:gap-3 transition-all duration-300"
        >
          <Link href={`/villas/${villa.slug}`} className="flex items-center gap-2">Explore Villa <FaArrowRight className="text-[10px]" /></Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const VillaShowcase = () => {
  const { landing } = useLandingCms();
  const isMobile = useIsMobile();
  const showcase = (isMobile ? landing?.mobile : landing?.desktop)?.showcase || {};
  const villas = showcase.items?.length ? showcase.items : DEFAULT_VILLAS;

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

