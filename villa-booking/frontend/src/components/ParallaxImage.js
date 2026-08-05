'use client'
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const ParallaxImage = ({ src, alt, className = '', speed = 0.3 }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, speed * -100]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.img style={{ y }} src={src} alt={alt} className="w-full h-[120%] object-cover" loading="lazy" />
    </div>
  );
};

export default ParallaxImage;

