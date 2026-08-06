'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaMapMarkerAlt, FaTimes } from 'react-icons/fa';
import { useUserAuth } from '../context/UserAuthContext';
import { getUserBookings, cancelBooking } from '../services/bookingService';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  'pending-custom': 'bg-orange-100 text-orange-700',
  confirmed: 'bg-green-100 text-green-700',
  rejected: 'bg-gray-300 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-700',
};

const statusLabels = {
  pending: 'Pending',
  'pending-custom': 'Pending - Custom Booking',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

const BookingsPage = () => {
  const { user } = useUserAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try { setBookings(await getUserBookings()); } catch { setBookings([]); }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await cancelBooking(id);
      setBookings((prev) => prev.map((b) => b._id === id ? { ...b, status: 'cancelled' } : b));
    } catch { alert('Failed to cancel booking'); }
  };

  if (!user) return null;

  return (
    <section className="pt-32 pb-20 bg-white min-h-screen">
      <div className="luxury-container">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl md:text-5xl mb-2">My Bookings</h1>
          <p className="text-gray-500 mb-10">Track and manage your villa reservations.</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-luxury-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <FaCalendarAlt className="text-gray-200 text-6xl mx-auto mb-6" />
            <h2 className="font-display text-2xl mb-4">No bookings yet</h2>
            <p className="text-gray-500 mb-8">Start your journey by booking a luxury villa.</p>
            <Link href="/villas" className="btn-primary">Browse Villas</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking, i) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-luxury-cream rounded-2xl overflow-hidden"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-48 h-40 md:h-auto shrink-0">
                    <img
                      src={booking.villa?.images?.[0] || '/img/villa-placeholder.svg'}
                      alt={booking.villa?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-xl mb-1">{booking.villa?.name}</h3>
                        <p className="text-gray-500 text-sm flex items-center gap-1 mb-3">
                          <FaMapMarkerAlt className="text-luxury-accent" /> {booking.villa?.location}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span>Check-in: {new Date(booking.checkIn).toLocaleDateString()}</span>
                          <span>Check-out: {new Date(booking.checkOut).toLocaleDateString()}</span>
                          <span>{booking.guests} guests{booking.adults ? ` (${booking.adults} adults${booking.kids ? ` · ${booking.kids} children` : ''}${booking.infants ? ` · ${booking.infants} infants` : ''}${booking.pets ? ` · ${booking.pets} pets` : ''})` : ''}</span>
                        </div>
                        <p className="font-display text-xl mt-3">${booking.totalPrice?.toLocaleString()}</p>
                        {booking.isCustomBooking && (
                          <div className="mt-3 max-w-sm p-3 rounded-xl bg-orange-50 border border-orange-200">
                            <p className="text-sm text-orange-800 font-medium mb-1">Custom booking request</p>
                            <p className="text-xs text-orange-700">
                              {booking.standardCapacity} guests capacity · {booking.requestedGuests} requested ({booking.extraGuests} extra)
                              {booking.requiresManualReview ? ' · Awaiting Sales Team review' : ''}
                            </p>
                          </div>
                        )}
                        {booking.customPricing?.offerMessage && (
                          <div className="mt-3 max-w-sm p-3 rounded-xl bg-blue-50 border border-blue-200">
                            <p className="text-sm text-blue-800 font-medium mb-1">Your booking offer</p>
                            <p className="text-xs text-blue-700">{booking.customPricing.offerMessage}</p>
                            {booking.customPricing.totalAmount > 0 && (
                              <p className="text-sm font-medium text-blue-800 mt-2">Total offer: ${booking.customPricing.totalAmount.toLocaleString()}</p>
                            )}
                          </div>
                        )}
                        {booking.status === 'rejected' && booking.approvalReason && (
                          <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">Reason: {booking.approvalReason}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-start md:items-end gap-3">
                        <span className={`text-xs uppercase tracking-widest px-3 py-1.5 rounded-full ${statusColors[booking.status]}`}>
                          {statusLabels[booking.status]}
                        </span>
                        {(booking.status === 'pending' || booking.status === 'pending-custom' || booking.status === 'confirmed') && (
                          <button onClick={() => handleCancel(booking._id)}
                            className="flex items-center gap-1 text-red-400 text-xs hover:text-red-600 transition-colors">
                            <FaTimes /> Cancel Booking
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BookingsPage;

