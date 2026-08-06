'use client'
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaSignOutAlt, FaPlus, FaClipboardCheck, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import { useSalesAuth } from '../context/SalesAuthContext';
import * as salesService from '../services/salesService';
import { getVillas } from '../services/villaService';
import SalesBookingReview from '../components/sales/SalesBookingReview';
import SalesCustomBooking from '../components/sales/SalesCustomBooking';

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  rejected: 'bg-gray-300 text-gray-700',
  cancelled: 'bg-gray-200 text-gray-600',
  completed: 'bg-blue-100 text-blue-700',
};

const filters = [
  { id: 'all', label: 'All Bookings' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'review', label: 'Over Capacity' },
];

const SalesDashboard = () => {
  const { sales, logout } = useSalesAuth();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [villas, setVillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all');
  const [search, setSearch] = useState('');
  const [reviewing, setReviewing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (filter === 'review') params.review = '1';
      else if (filter !== 'all') params.status = filter;
      if (search.trim()) params.search = search.trim();
      const data = await salesService.getBookings(params);
      setBookings(data.bookings);
    } catch { setBookings([]); }
    setLoading(false);
  }, [filter, search]);

  useEffect(() => { const t = setTimeout(() => fetchBookings(), 300); return () => clearTimeout(t); }, [fetchBookings]);

  useEffect(() => {
    getVillas({ limit: 100 }).then((d) => setVillas(d.villas || [])).catch(() => setVillas([]));
  }, []);

  if (!sales) return null;

  return (
    <section className="pt-20 pb-20 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl">Sales Team Dashboard</h1>
            <p className="text-gray-500 mt-1">Every booking request lands here for review and offers.</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden md:block">Signed in as <b>{sales.name}</b></span>
            <button onClick={() => setShowCreate(true)} className="btn-primary text-[10px]"><span><FaPlus className="inline mr-1" /> Create Custom Booking</span></button>
            <button onClick={logout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400"><FaSignOutAlt /> Sign Out</button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
          <div className="flex gap-2 overflow-x-auto flex-1">
            {filters.map((fl) => (
              <button key={fl.id} onClick={() => { setFilter(fl.id); }}
                className={`px-4 py-2 rounded-xl text-sm transition-all whitespace-nowrap ${filter === fl.id ? 'bg-luxury-accent text-white' : 'bg-luxury-cream text-gray-600 hover:bg-gray-200'}`}>
                {fl.label}
              </button>
            ))}
          </div>
          <div className="relative md:w-72">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer..."
              className="input-field !pl-11 rounded-xl w-full" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-2 border-luxury-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-24">
            <FaCalendarAlt className="text-gray-200 text-6xl mx-auto mb-6" />
            <h2 className="font-display text-2xl mb-2">No booking requests</h2>
            <p className="text-gray-400">Bookings submitted by customers will appear here instantly.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-luxury-cream">
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Villa</th>
                    <th className="text-left p-4 font-medium">Dates / Nights</th>
                    <th className="text-left p-4 font-medium">Guests</th>
                    <th className="text-left p-4 font-medium">Price</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const over = (b.extraGuests || 0) > 0;
                    return (
                      <tr key={b._id} className={`border-t border-gray-100 hover:bg-gray-50 ${over ? 'bg-orange-50' : ''}`}>
                        <td className="p-4">
                          <div className="font-medium">{b.customerName || b.user?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-400">{b.customerEmail || b.user?.email}</div>
                        </td>
                        <td className="p-4">{b.villa?.name || 'N/A'}</td>
                        <td className="p-4 text-gray-600">
                          {new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}
                          <div className="text-xs text-gray-400">{b.nights} nights · {b.status}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span>{b.guests} ({b.adults} A{b.kids ? ` · ${b.kids} C` : ''}{b.infants ? ` · ${b.infants} I` : ''}{b.pets ? ` · ${b.pets} P` : ''})</span>
                            {over && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">⚠ Over Capacity</span>}
                          </div>
                        </td>
                        <td className="p-4">${b.totalPrice?.toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`text-xs uppercase tracking-widest px-2 py-1 rounded-full ${statusStyles[b.status] || 'bg-yellow-100 text-yellow-700'}`}>{b.status}</span>
                          {b.offerSent && <div className="text-[10px] text-blue-500 mt-1">Offer sent</div>}
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => setReviewing(b)}
                            className="inline-flex items-center gap-1 text-luxury-accent hover:text-luxury-accent-dark text-xs font-medium">
                            <FaClipboardCheck /> Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {reviewing && (
        <SalesBookingReview
          booking={reviewing}
          villas={villas}
          onClose={() => setReviewing(null)}
          onSaved={() => { setReviewing(null); fetchBookings(); }}
        />
      )}
      {showCreate && (
        <SalesCustomBooking
          villas={villas}
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); fetchBookings(); }}
        />
      )}
    </section>
  );
};

export default SalesDashboard;