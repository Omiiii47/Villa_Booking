import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaSlidersH } from 'react-icons/fa';
import VillaCard from '../components/VillaCard';
import { getVillas } from '../services/villaService';

const Skeleton = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden animate-pulse border border-white/50">
    <div className="h-72 bg-gray-100" />
    <div className="p-7 space-y-4">
      <div className="h-6 bg-gray-100 rounded w-3/4" />
      <div className="h-4 bg-gray-100 rounded w-full" />
      <div className="flex gap-3"><div className="h-7 bg-gray-100 rounded-full w-16" /><div className="h-7 bg-gray-100 rounded-full w-16" /><div className="h-7 bg-gray-100 rounded-full w-20" /></div>
      <div className="h-px bg-gray-50" />
      <div className="flex justify-between"><div className="h-8 bg-gray-100 rounded w-24" /><div className="h-4 bg-gray-100 rounded w-20" /></div>
    </div>
  </div>
);

const Villas = () => {
  const [villas, setVillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', minPrice: '', maxPrice: '', bedrooms: '', sort: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { const t = setTimeout(() => fetchVillas(), 300); return () => clearTimeout(t); }, []);

  const fetchVillas = async (params = {}) => {
    setLoading(true);
    try { const data = await getVillas(params); setVillas(data.villas || []); }
    catch { setVillas([]); }
    setLoading(false);
  };

  const handleFilter = () => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.bedrooms) params.bedrooms = filters.bedrooms;
    if (filters.sort) params.sort = filters.sort;
    fetchVillas(params);
  };

  return (
    <>
      <section className="pt-36 pb-16 bg-white">
        <div className="luxury-container">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
            <span className="section-label">Collection</span>
            <h1 className="font-display text-display-xl text-luxury-black mt-2 mb-4">Our Villas</h1>
            <p className="text-gray-500 font-light max-w-lg">Browse our exclusive collection of handpicked luxury villas across the world's most coveted destinations.</p>
          </motion.div>
        </div>
      </section>

      <section className="pb-24 bg-white">
        <div className="luxury-container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row gap-4 mb-10">
            <div className="relative flex-1">
              <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input type="text" placeholder="Search villas..." value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                className="input-field !pl-12 rounded-2xl" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className="btn-outline !py-3.5 !px-8 text-[10px] flex items-center gap-2 rounded-2xl">
              <FaSlidersH className="relative z-10" /> <span className="relative z-10">Filters</span>
            </button>
          </motion.div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }} className="overflow-hidden">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 p-7 bg-luxury-cream rounded-3xl">
                  {[
                    { label: 'Min Price', placeholder: '$0', key: 'minPrice', type: 'number' },
                    { label: 'Max Price', placeholder: '$10000', key: 'maxPrice', type: 'number' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder} value={filters[f.key]}
                        onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })} className="input-field" />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Bedrooms</label>
                    <select value={filters.bedrooms} onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })} className="input-field">
                      <option value="">Any</option>
                      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}{n === 5 ? '+' : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Sort By</label>
                    <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })} className="input-field">
                      <option value="">Newest</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="rating">Highest Rated</option>
                    </select>
                  </div>
                  <div className="col-span-full">
                    <button onClick={handleFilter} className="btn-primary w-full text-[10px]"><span>Apply Filters</span></button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <Skeleton key={i} />)}
            </div>
          ) : villas.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
              <FaSearch className="text-gray-200 text-6xl mx-auto mb-6" />
              <p className="text-gray-400 text-lg mb-6">No villas found matching your criteria.</p>
              <button onClick={() => { setFilters({ search: '', minPrice: '', maxPrice: '', bedrooms: '', sort: '' }); fetchVillas(); }}
                className="btn-outline text-[10px]"><span>Clear Filters</span></button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {villas.map((villa, i) => <VillaCard key={villa._id} villa={villa} index={i} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Villas;
