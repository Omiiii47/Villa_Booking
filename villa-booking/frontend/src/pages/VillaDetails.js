import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaMapMarkerAlt, FaChevronLeft, FaChevronRight, FaCheck, FaTimes, FaExpand } from 'react-icons/fa';
import { getVillaBySlug } from '../services/villaService';
import { getVillaReviews } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import Magnetic from '../components/Magnetic';

const VillaDetails = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { isInWishlist, toggle } = useWishlist();
  const [villa, setVilla] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getVillaBySlug(slug);
        setVilla(data);
        const revs = await getVillaReviews(data._id);
        setReviews(revs);
      } catch { setVilla(null); }
      setLoading(false);
    };
    fetch();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-8 h-8 border-2 border-luxury-accent border-t-transparent rounded-full" />
    </div>
  );

  if (!villa) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center"><h1 className="font-display text-4xl mb-4">Villa Not Found</h1><Link to="/villas" className="btn-primary"><span>Browse Villas</span></Link></div>
    </div>
  );

  return (
    <>
      <section className="pt-28">
        <div className="luxury-container">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative h-[55vh] md:h-[75vh] rounded-3xl overflow-hidden mb-6 group">
            <AnimatePresence mode="wait">
              <motion.img key={currentImg} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }} src={villa.images?.[currentImg] || villa.images?.[0]} alt={villa.name}
                className="w-full h-full object-cover" />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <button onClick={() => setLightbox(true)}
              className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100">
              <FaExpand className="text-white" />
            </button>
            {villa.images?.length > 1 && (
              <>
                <button onClick={() => setCurrentImg((p) => (p - 1 + villa.images.length) % villa.images.length)}
                  className="absolute left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all"><FaChevronLeft className="text-white" /></button>
                <button onClick={() => setCurrentImg((p) => (p + 1) % villa.images.length)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all"><FaChevronRight className="text-white" /></button>
              </>
            )}
            <div className="absolute bottom-8 left-8 right-8">
              <h1 className="font-display text-4xl md:text-6xl text-white mb-2">{villa.name}</h1>
              <p className="text-white/70 flex items-center gap-2"><FaMapMarkerAlt /> {villa.location}</p>
            </div>
          </motion.div>

          {villa.images?.length > 1 && (
            <div className="flex gap-3 mb-12 overflow-x-auto pb-2 scrollbar-hide">
              {villa.images.map((img, i) => (
                <button key={i} onClick={() => setCurrentImg(i)}
                  className={`shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === currentImg ? 'border-luxury-accent' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pb-24">
        <div className="luxury-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-4 mb-8">
                <div className="flex items-center gap-1.5 bg-luxury-cream rounded-full px-4 py-2 text-sm">
                  <FaStar className="text-yellow-400" /> <span className="font-semibold">{villa.rating}</span>
                  <span className="text-gray-400">({villa.numReviews})</span>
                </div>
                {villa.bedrooms && <span className="bg-luxury-cream rounded-full px-4 py-2 text-sm text-gray-500">{villa.bedrooms} Bedrooms</span>}
                {villa.bathrooms && <span className="bg-luxury-cream rounded-full px-4 py-2 text-sm text-gray-500">{villa.bathrooms} Bathrooms</span>}
                <span className="bg-luxury-cream rounded-full px-4 py-2 text-sm text-gray-500">Up to {villa.capacity} guests</span>
              </motion.div>

              {user && (
                <button onClick={() => toggle(villa._id)}
                  className={`flex items-center gap-2 text-sm mb-8 px-5 py-2.5 rounded-full transition-all ${isInWishlist(villa._id) ? 'bg-red-50 text-red-400' : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-400'}`}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isInWishlist(villa._id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {isInWishlist(villa._id) ? 'Saved' : 'Save to Wishlist'}
                </button>
              )}

              <div className="mb-12">
                <h2 className="font-display text-2xl mb-5">About This Villa</h2>
                <p className="text-gray-500 leading-relaxed">{villa.description}</p>
              </div>

              {villa.size && (
                <div className="mb-12">
                  <h2 className="font-display text-2xl mb-5">Property Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {[{ label: 'Size', value: villa.size }, { label: 'Location', value: villa.location }].map((d) => (
                      <div key={d.label} className="bg-luxury-cream rounded-2xl p-5"><span className="text-gray-400 text-xs uppercase tracking-widest">{d.label}</span><p className="font-display text-lg mt-1">{d.value}</p></div>
                    ))}
                  </div>
                </div>
              )}

              {villa.amenities?.length > 0 && (
                <div className="mb-12">
                  <h2 className="font-display text-2xl mb-5">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {villa.amenities.map((a, i) => (
                      <motion.div key={a} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                        className="flex items-center gap-2 text-gray-500 group">
                        <FaCheck className="text-luxury-accent text-xs group-hover:rotate-12 transition-transform" /> {a}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {reviews.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl mb-6">Guest Reviews</h2>
                  <div className="space-y-5">
                    {reviews.map((r, i) => (
                      <motion.div key={r._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="card-premium p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-luxury-accent to-luxury-accent/80 flex items-center justify-center text-white font-semibold text-sm">
                            {r.user?.name?.[0] || 'G'}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{r.user?.name || 'Guest'}</p>
                            <div className="flex gap-0.5">{[...Array(5)].map((_, j) => <FaStar key={j} className={j < r.rating ? 'text-yellow-400 text-xs' : 'text-gray-200 text-xs'} />)}</div>
                          </div>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed">{r.comment}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="sticky top-28">
                <div className="card-premium p-8">
                  <div className="mb-6">
                    <span className="font-display text-4xl text-luxury-black">${villa.pricePerNight}</span>
                    <span className="text-gray-400"> / night</span>
                  </div>
                  <Magnetic>
                    <Link to={user ? `/booking?slug=${villa.slug}` : '/login'}
                      className="btn-primary w-full text-center block text-[10px]">
                      <span>{user ? 'Book Now' : 'Sign In to Book'}</span>
                    </Link>
                  </Magnetic>
                  <p className="text-gray-400 text-xs text-center mt-3">No hidden fees · Free cancellation</p>
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="font-body font-semibold text-sm mb-3">Highlights</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                      {villa.amenities?.slice(0, 5).map((a) => (
                        <li key={a} className="flex items-center gap-2"><FaCheck className="text-luxury-accent text-xs" /> {a}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setLightbox(false)}>
            <button onClick={() => setLightbox(false)} className="absolute top-8 right-8 text-white/50 hover:text-white text-xl z-10"><FaTimes /></button>
            {villa.images?.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setCurrentImg((p) => (p - 1 + villa.images.length) % villa.images.length); }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-2xl z-10"><FaChevronLeft /></button>
                <button onClick={(e) => { e.stopPropagation(); setCurrentImg((p) => (p + 1) % villa.images.length); }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-2xl z-10"><FaChevronRight /></button>
              </>
            )}
            <motion.img key={currentImg} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 150 }} src={villa.images?.[currentImg]} alt={villa.name}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VillaDetails;
