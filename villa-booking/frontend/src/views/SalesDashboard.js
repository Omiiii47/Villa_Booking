'use client'
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FaSignOutAlt, FaPlus, FaClipboardCheck, FaSearch, FaCalendarAlt, FaBell,
  FaHourglassHalf, FaCheckCircle, FaBan, FaMoneyBillWave, FaCheck, FaTimes,
  FaBed, FaChartLine, FaDollarSign, FaUserCheck, FaDoorOpen,
} from 'react-icons/fa';
import { useSalesAuth } from '../context/SalesAuthContext';
import * as salesService from '../services/salesService';
import { getVillas } from '../services/villaService';
import SalesBookingReview from '../components/sales/SalesBookingReview';
import SalesCustomBooking from '../components/sales/SalesCustomBooking';

const reviewStyles = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const bookingStyles = {
  REQUESTED: 'bg-sky-100 text-sky-700',
  UNDER_REVIEW: 'bg-indigo-100 text-indigo-700',
  APPROVED: 'bg-teal-100 text-teal-700',
  PAYMENT_PENDING: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-gray-300 text-gray-700',
  EXPIRED: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-violet-100 text-violet-700',
};

const reviewFilters = [
  { id: '', label: 'All Reviews' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
];

const bookingFilters = [
  { id: '', label: 'All Lifecycle' },
  { id: 'REQUESTED', label: 'Requested' },
  { id: 'UNDER_REVIEW', label: 'Under Review' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'PAYMENT_PENDING', label: 'Payment Pending' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'CANCELLED', label: 'Cancelled' },
  { id: 'EXPIRED', label: 'Expired' },
  { id: 'COMPLETED', label: 'Completed' },
];

const fmtMoney = (v) => `$${Number(v || 0).toLocaleString()}`;
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : '');

const StatCard = ({ icon: Icon, label, value, tone = 'text-luxury-black' }) => (
  <div className="bg-luxury-cream rounded-2xl p-4 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tone}`}><Icon /></div>
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-widest text-gray-500 truncate">{label}</div>
      <div className="font-display text-lg leading-tight truncate">{value}</div>
    </div>
  </div>
);

const SalesDashboard = () => {
  const { sales, logout } = useSalesAuth();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [villas, setVillas] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewFilter, setReviewFilter] = useState(searchParams.get('review') || '');
  const [bookingFilter, setBookingFilter] = useState(searchParams.get('booking') || '');
  const [search, setSearch] = useState('');
  const [reviewing, setReviewing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const fetchBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = { limit: 100 };
      if (reviewFilter) params.review = reviewFilter;
      if (bookingFilter) params.booking = bookingFilter;
      if (search.trim()) params.search = search.trim();
      const data = await salesService.getBookings(params);
      setBookings(data.bookings);
    } catch { setBookings([]); }
    if (!silent) setLoading(false);
  }, [reviewFilter, bookingFilter, search]);

  const loadStats = useCallback(async () => {
    try { setStats(await salesService.getDashboardStats()); } catch { setStats(null); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchBookings(), 300);
    return () => clearTimeout(t);
  }, [fetchBookings]);

  useEffect(() => {
    salesService.getDashboardStats().then(setStats).catch(() => setStats(null));
    salesService.getNotifications().then(setNotifications).catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    const refresh = () => {
      fetchBookings(true);
      salesService.getDashboardStats().then(setStats).catch(() => setStats(null));
      salesService.getNotifications().then(setNotifications).catch(() => setNotifications([]));
    };
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [fetchBookings]);

  useEffect(() => {
    getVillas({ limit: 100 }).then((d) => setVillas(d.villas || [])).catch(() => setVillas([]));
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  const openNotifications = async () => {
    setShowNotifs((v) => !v);
    if (!showNotifs) {
      await salesService.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  if (!sales) return null;

  const statCards = stats ? [
    { icon: FaHourglassHalf, label: 'Pending Review', value: stats.reviews.pending, tone: 'bg-yellow-100 text-yellow-700' },
    { icon: FaCheckCircle, label: 'Approved', value: stats.reviews.approved, tone: 'bg-green-100 text-green-700' },
    { icon: FaBan, label: 'Rejected', value: stats.reviews.rejected, tone: 'bg-red-100 text-red-700' },
    { icon: FaMoneyBillWave, label: 'Payment Pending', value: stats.awaitingPayment, tone: 'bg-blue-100 text-blue-700' },
    { icon: FaCheck, label: 'Confirmed', value: stats.bookings.confirmed, tone: 'bg-emerald-100 text-emerald-700' },
    { icon: FaBed, label: 'Completed', value: stats.bookings.completed, tone: 'bg-violet-100 text-violet-700' },
    { icon: FaTimes, label: 'Cancelled', value: stats.bookings.cancelled, tone: 'bg-gray-200 text-gray-600' },
    { icon: FaDollarSign, label: 'Revenue', value: fmtMoney(stats.revenue), tone: 'bg-luxury-accent/20 text-luxury-accent' },
    { icon: FaCalendarAlt, label: "Today's Bookings", value: stats.todayBookings, tone: 'bg-orange-100 text-orange-700' },
    { icon: FaDoorOpen, label: 'Upcoming Check-ins', value: stats.upcomingCheckIns, tone: 'bg-cyan-100 text-cyan-700' },
    { icon: FaUserCheck, label: 'Upcoming Check-outs', value: stats.upcomingCheckOuts, tone: 'bg-indigo-100 text-indigo-700' },
    { icon: FaChartLine, label: 'Occupancy', value: `${stats.occupancy}%`, tone: 'bg-teal-100 text-teal-700' },
    { icon: FaDollarSign, label: 'Avg Booking Value', value: fmtMoney(stats.averageBookingValue), tone: 'bg-pink-100 text-pink-700' },
  ] : [];

  return (
    <section className="pt-20 pb-20 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl">Sales Team Dashboard</h1>
            <p className="text-gray-500 mt-1">Every booking request lands here for review, quotations and confirmations.</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden md:block">Signed in as <b>{sales.name}</b></span>
            <div className="relative">
              <button onClick={openNotifications} className="relative p-3 rounded-xl bg-luxury-cream text-gray-500 hover:text-gray-700">
                <FaBell />
                {unread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">{unread}</span>}
              </button>
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl shadow-xl border z-50">
                  <div className="sticky top-0 bg-white p-4 border-b border-gray-100 font-medium text-sm">Notifications</div>
                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-400 p-4">No notifications.</p>
                  ) : notifications.map((n) => (
                    <button key={n._id} onClick={() => { setShowNotifs(false); const ref = n.reference?._id; if (ref && bookings.some((b) => b._id === ref)) setReviewing(bookings.find((b) => b._id === ref)); }}
                      className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 ${n.read ? 'opacity-70' : ''}`}>
                      <div className="text-sm font-medium">{n.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{n.message}</div>
                      <div className="text-[10px] text-gray-400 mt-1">{fmtDateTime(n.createdAt)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setShowCreate(true)} className="btn-primary text-[10px]"><span><FaPlus className="inline mr-1" /> Create Custom Booking</span></button>
            <button onClick={logout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400"><FaSignOutAlt /> Sign Out</button>
          </div>
        </div>

        {statCards.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-8">
            {statCards.map((s) => <StatCard key={s.label} {...s} />)}
          </div>
        )}

        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex gap-2 overflow-x-auto flex-1">
              {reviewFilters.map((fl) => (
                <button key={fl.id || 'all-review'} onClick={() => setReviewFilter(fl.id)}
                  className={`px-4 py-2 rounded-xl text-sm transition-all whitespace-nowrap ${reviewFilter === fl.id ? 'bg-luxury-accent text-white' : 'bg-luxury-cream text-gray-600 hover:bg-gray-200'}`}>
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
          <div className="flex gap-2 overflow-x-auto">
            {bookingFilters.map((fl) => (
              <button key={fl.id || 'all-booking'} onClick={() => setBookingFilter(fl.id)}
                className={`px-4 py-2 rounded-xl text-xs transition-all whitespace-nowrap ${bookingFilter === fl.id ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {fl.label}
              </button>
            ))}
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
                    <th className="text-left p-4 font-medium">Review</th>
                    <th className="text-left p-4 font-medium">Booking</th>
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
                          <div className="text-xs text-gray-400">{b.nights} nights</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span>{b.guests} ({b.adults}A{b.kids ? ` · ${b.kids} C` : ''}{b.infants ? ` · ${b.infants} I` : ''}{b.pets ? ` · ${b.pets} P` : ''})</span>
                            {over && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">⚠ Over Capacity</span>}
                          </div>
                        </td>
                        <td className="p-4">
                          <span>${(b.finalPrice ?? b.quotedPrice ?? b.totalPrice)?.toLocaleString()}</span>
                          {b.offerSent && <div className="text-[10px] text-blue-500 mt-0.5">Offer sent</div>}
                        </td>
                        <td className="p-4">
                          <span className={`text-xs uppercase tracking-widest px-2 py-1 rounded-full ${reviewStyles[b.reviewStatus] || reviewStyles.PENDING}`}>{b.reviewStatus || 'PENDING'}</span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs uppercase tracking-widest px-2 py-1 rounded-full ${bookingStyles[b.bookingStatus] || bookingStyles.PAYMENT_PENDING}`}>{b.bookingStatus || 'PAYMENT_PENDING'}</span>
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
          onSaved={() => { setReviewing(null); fetchBookings(); loadStats(); }}
        />
      )}
      {showCreate && (
        <SalesCustomBooking
          villas={villas}
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); fetchBookings(); loadStats(); }}
        />
      )}
    </section>
  );
};

export default SalesDashboard;