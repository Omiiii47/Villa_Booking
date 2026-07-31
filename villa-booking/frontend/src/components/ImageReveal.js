import { motion } from 'framer-motion';

const ImageReveal = ({ src, alt, className = '', overlay = true }) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        initial={{ scaleX: 1 }}
        whileInView={{ scaleX: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.77, 0, 0.18, 1] }}
        className="absolute inset-0 bg-luxury-accent origin-left z-10"
      />
      <motion.img
        src={src}
        alt={alt}
        initial={{ scale: 1.15 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: [0.77, 0, 0.18, 1] }}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      )}
    </div>
  );
};

export default ImageReveal;
