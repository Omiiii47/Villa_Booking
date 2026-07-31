import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHeart } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { getWishlist } from '../services/authService';
import VillaCard from '../components/VillaCard';

const WishlistPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [villas, setVillas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const fetch = async () => {
      try { setVillas(await getWishlist()); } catch { setVillas([]); }
      setLoading(false);
    };
    fetch();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <section className="pt-32 pb-20 bg-white min-h-screen">
      <div className="luxury-container">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <FaHeart className="text-red-400" />
            <h1 className="font-display text-4xl md:text-5xl">My Wishlist</h1>
          </div>
          <p className="text-gray-500 mb-10">Your saved villas for future escapes.</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-luxury-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : villas.length === 0 ? (
          <div className="text-center py-20">
            <FaHeart className="text-gray-200 text-6xl mx-auto mb-6" />
            <h2 className="font-display text-2xl mb-4">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-8">Start exploring and save your favorite villas.</p>
            <Link to="/villas" className="btn-primary">Explore Villas</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {villas.map((villa, i) => (
              <VillaCard key={villa._id} villa={villa} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default WishlistPage;
