'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaMapMarkerAlt, FaTimes, FaCheckCircle, FaHourglassHalf, FaExclamationTriangle } from 'react-icons/fa';
import { useUserAuth } from '../context/UserAuthContext';
import { getUserBookings, cancelBooking, syncBookingPayment } from '../services/bookingService';

const reviewColors = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const reviewLabels = {
  PENDING: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const bookingColors = {
  REQUESTED: 'bg-sky-100 text-sky-700',
  UNDER_REVIEW: 'bg-indigo-100 text-indigo-700',
  APPROVED: 'bg-teal-100 text-teal-700',
  PAYMENT_PENDING: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-gray-300 text-gray-700',
  EXPIRED: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-violet-100 text-violet-700',
};

const bookingLabels = {
  REQUESTED: 'Request Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  PAYMENT_PENDING: 'Payment Awaiting',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  COMPLETED: 'Completed',
};

const paymentLabels = {
  UNPAID: 'Unpaid',
  PENDING: 'Payment Initiated',
  LINK_SENT: 'Payment Link Sent',
  LINK_EXPIRED: 'Link Expired',
  PAID: 'Paid',
  FAILED: 'Payment Failed',
  REFUNDED: 'Refunded',
};

const cancellable = (b) => ['PAYMENT_PENDING', 'CONFIRMED', 'APPROVED'].includes(b.bookingStatus);

const formatExpiry = (date, now) => {
  const diff = new Date(date).getTime() - now;
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

const PaymentCTA = ({ booking, onUpdated }) => {
  const amount = booking.finalPrice ?? booking.quotedPrice ?? booking.customPricing?.totalAmount ?? booking.totalPrice;
  const [now, setNow] = useState(() => Date.now());
  const [checking, setChecking] = useState(false);
  const paid = booking.paymentStatus === 'PAID';

  useEffect(() => {
    if (!booking.paymentLinkExpiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [booking.paymentLinkExpiresAt]);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      await syncBookingPayment(booking._id);
      onUpdated?.();
    } catch (e) {
      alert(e.response?.data?.message || 'Could not check payment status');
    }
    setChecking(false);
  };

  if (paid) {
    return (
      <div className="mt-3 max-w-sm p-4 rounded-xl bg-emerald-50 border border-emerald-200">
        <p className="text-sm font-medium text-emerald-800 mb-1 flex items-center gap-2">
          <FaCheckCircle className="text-emerald-600" /> Payment Successful — Booking Confirmed
        </p>
        {booking.amountPaid != null && (
          <p className="font-display text-xl text-emerald-700">${Number(booking.amountPaid).toLocaleString()}</p>
        )}
        <div className="mt-2 text-xs text-emerald-800 space-y-0.5">
          {booking.paymentId && <p>Payment ID: <span className="font-mono">{booking.paymentId}</span></p>}
          {booking.paymentDate && <p>Paid on: {new Date(booking.paymentDate).toLocaleString()}</p>}
          {booking.paymentId && <p>Amount: ${Number(booking.amountPaid ?? amount ?? 0).toLocaleString()}</p>}
        </div>
      </div>
    );
  }

  const hasLink = Boolean(booking.paymentLink);
  const expired = hasLink && booking.paymentLinkExpiresAt && new Date(booking.paymentLinkExpiresAt).getTime() <= now;

  if (!hasLink) return null;

  return (
    <div className={`mt-3 max-w-sm p-4 rounded-xl border ${expired ? 'bg-gray-50 border-gray-300' : 'bg-emerald-50 border-emerald-200'}`}>
      <p className="text-sm font-medium text-emerald-800 mb-1">Final Amount Due</p>
      <p className="font-display text-2xl text-emerald-700">${Number(amount || 0).toLocaleString()}</p>

      {booking.paymentLinkExpiresAt && (
        <p className={`mt-2 text-xs font-medium flex items-center gap-1 ${expired ? 'text-red-600' : 'text-amber-700'}`}>
          {expired ? <FaExclamationTriangle /> : <FaHourglassHalf />}
          {expired ? 'Payment link expired' : `Expires on ${new Date(booking.paymentLinkExpiresAt).toLocaleString()} (${formatExpiry(booking.paymentLinkExpiresAt, now)})`}
        </p>
      )}

      {expired ? (
        <p className="mt-2 text-xs text-gray-500">
          This payment link has expired. Contact us to request a new one.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a href={booking.paymentLink} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">
            Pay Now
          </a>
          <button onClick={handleCheckStatus} disabled={checking}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-700 border border-emerald-300 text-sm font-medium hover:bg-emerald-50 disabled:opacity-50">
            {checking ? 'Checking…' : 'Check Payment Status'}
          </button>
        </div>
      )}
    </div>
  );
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

  const refreshBookings = async () => {
    try { setBookings(await getUserBookings()); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!user) return;
    const live = bookings.some((b) => ['PAYMENT_PENDING', 'CONFIRMED'].includes(b.bookingStatus));
    if (!live) return;
    const timer = setInterval(async () => {
      try {
        const list = await getUserBookings();
        const pending = list.filter((b) => b.paymentLinkId && b.paymentStatus !== 'PAID');
        await Promise.all(pending.map((b) => syncBookingPayment(b._id).catch(() => null)));
        setBookings(await getUserBookings());
      } catch { /* ignore */ }
    }, 20000);
    return () => clearInterval(timer);
  }, [user, bookings]);

  const handleCancel = async (id) => {
    const reason = window.prompt('Reason for cancellation (optional):', '') || '';
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await cancelBooking(id, reason);
      setBookings((prev) => prev.map((b) => b._id === id
        ? { ...b, bookingStatus: 'CANCELLED', cancellationReason: reason || 'Customer cancelled the booking', cancelledBy: 'customer' }
        : b));
    } catch (e) { alert(e.response?.data?.message || 'Failed to cancel booking'); }
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
            {bookings.map((booking, i) => {
              const review = booking.reviewStatus || 'PENDING';
              const bstatus = booking.bookingStatus || 'REQUESTED';
              const pstatus = booking.paymentStatus || 'UNPAID';
              return (
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
                          <p className="font-display text-xl mt-3">
                            ${(booking.finalPrice ?? booking.quotedPrice ?? booking.customPricing?.totalAmount ?? booking.totalPrice)?.toLocaleString()}
                          </p>
                          {bstatus === 'PAYMENT_PENDING' && <PaymentCTA booking={booking} onUpdated={refreshBookings} />}
                          {bstatus === 'EXPIRED' && (
                            <p className="mt-3 max-w-sm text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-xl p-3">
                              Payment was not completed, so these dates were released. You have not been charged. Please rebook if you still wish to stay.
                            </p>
                          )}
                          {booking.isCustomBooking && (
                            <div className="mt-3 max-w-sm p-3 rounded-xl bg-orange-50 border border-orange-200">
                              <p className="text-sm text-orange-800 font-medium mb-1">Custom booking request</p>
                              <p className="text-xs text-orange-700">
                                {booking.standardCapacity} guests capacity · {booking.requestedGuests} requested ({booking.extraGuests} extra)
                                {booking.reviewStatus === 'PENDING' ? ' · Awaiting Sales Team review' : ''}
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
                          {review === 'REJECTED' && booking.rejectionReason && (
                            <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">Rejection reason: {booking.rejectionReason}</p>
                          )}
                          {bstatus === 'CANCELLED' && booking.cancellationReason && (
                            <p className="mt-3 text-xs text-gray-600 bg-gray-100 border border-gray-200 rounded-xl p-3">Cancellation reason: {booking.cancellationReason}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-2">
                          <div className="flex flex-wrap gap-2 justify-end">
                            <span className={`text-xs uppercase tracking-widest px-3 py-1.5 rounded-full ${reviewColors[review]}`}>
                              {reviewLabels[review]}
                            </span>
                            <span className={`text-xs uppercase tracking-widest px-3 py-1.5 rounded-full ${bookingColors[bstatus]}`}>
                              {bookingLabels[bstatus]}
                            </span>
                            <span className="text-xs uppercase tracking-widest px-3 py-1.5 rounded-full bg-gray-200 text-gray-600">
                              {paymentLabels[pstatus]}
                            </span>
                          </div>
                          {cancellable(booking) && (
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
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default BookingsPage;