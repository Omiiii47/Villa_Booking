'use client'
import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import Link from 'next/link';
import { FaStar, FaArrowRight, FaMapMarkerAlt } from 'react-icons/fa';
import { useWishlist } from '../context/WishlistContext';
import { useUserAuth } from '../context/UserAuthContext';

const BookNowLink = ({ villa, className, children }) => (
  <Link href={`/villas/${villa.slug}?book=1`}
    className={`${villa.showBookNow === false ? 'pointer-events-none opacity-40' : ''} ${className}`}>
    {children}
  </Link>
);

const ExploreLink = ({ villa, className, children }) => (
  <Link href={`/villas/${villa.slug}`} className={`${villa.showExploreVilla === false ? 'pointer-events-none opacity-40' : ''} ${className}`}>
    {children}
  </Link>
);
const VillaCard = ({ villa, index = 0 }) => {
  const { user } = useUserAuth();
  const { isInWishlist, toggle } = useWishlist();
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouse = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(px * 8);
    y.set(-py * 8);
  };

  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div
        ref={ref}
        onMouseMove={handleMouse}
        onMouseLeave={handleLeave}
        className="card-premium perspective-1000 group h-full"
      >
        <motion.div
          style={{ rotateX: springY, rotateY: springX }}
          className="preserve-3d flex flex-col h-full"
        >
          <Link href={`/villas/${villa.slug}`} className="relative block h-72 overflow-hidden">
            <motion.img
              src={villa.images?.[0] || '/img/villa-placeholder.svg'}
              alt={villa.name}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            {villa.featured && (
              <span className="absolute top-5 left-5 bg-luxury-accent/90 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
                Featured
              </span>
            )}
            {user && (
              <button
                onClick={(e) => { e.preventDefault(); toggle(villa._id); }}
                className={`absolute top-5 right-5 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                  isInWishlist(villa._id) ? 'bg-red-400/20 text-red-400' : 'bg-white/20 text-white hover:bg-white/40'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isInWishlist(villa._id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            )}
            <div className="absolute bottom-5 left-5 right-5">
              <div className="flex items-center gap-1.5 text-white/90 text-xs">
                <FaStar className="text-yellow-400" />
                <span className="font-semibold">{villa.rating}</span>
                <span className="text-white/50">({villa.numReviews})</span>
              </div>
            </div>
          </Link>

          <div className="p-7 flex flex-col flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-display text-xl text-luxury-black group-hover:text-luxury-accent transition-colors duration-300">
                {villa.name}
              </h3>
              <span className="font-display text-lg text-luxury-accent whitespace-nowrap ml-4">
                ${villa.pricePerNight}
                <span className="font-body text-xs text-gray-400 font-normal">/nt</span>
              </span>
            </div>
            {villa.location && (
              <p className="flex items-center gap-1.5 text-gray-400 text-xs mb-2">
                <FaMapMarkerAlt className="text-luxury-accent text-[10px]" /> {villa.location}
              </p>
            )}
            <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-4">{villa.shortDescription}</p>
            <div className="flex items-center gap-4 text-gray-400 text-xs mb-6">
              <span className="flex items-center gap-1.5 bg-luxury-cream px-3 py-1.5 rounded-full">{villa.bedrooms} bd</span>
              <span className="flex items-center gap-1.5 bg-luxury-cream px-3 py-1.5 rounded-full">{villa.bathrooms} ba</span>
              <span className="flex items-center gap-1.5 bg-luxury-cream px-3 py-1.5 rounded-full">Up to {villa.capacity}</span>
            </div>
            <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100">
              <BookNowLink villa={villa} className="btn-primary flex-1 text-[9px] text-center">
                <span>Book Now</span>
              </BookNowLink>
              <ExploreLink villa={villa} className="btn-outline flex-1 text-[9px] text-center">
                <span className="flex items-center justify-center gap-2">Explore Villa <FaArrowRight className="relative z-10 text-[10px]" /></span>
              </ExploreLink>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default VillaCard;

