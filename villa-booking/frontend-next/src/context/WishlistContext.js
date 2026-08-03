import { createContext, useContext, useState, useCallback } from 'react';
import { toggleWishlist, getWishlist } from '../services/authService';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getWishlist();
      setWishlist(data);
    } catch { setWishlist([]); }
    setLoading(false);
  }, [user]);

  const toggle = async (villaId) => {
    if (!user) return;
    const data = await toggleWishlist(villaId);
    setWishlist((prev) =>
      prev.some((v) => (v._id || v) === villaId)
        ? prev.filter((v) => (v._id || v) !== villaId)
        : [...prev, villaId]
    );
    return data;
  };

  const isInWishlist = (villaId) => wishlist.some((v) => (v._id || v) === villaId);

  return (
    <WishlistContext.Provider value={{ wishlist, loading, fetchWishlist, toggle, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
