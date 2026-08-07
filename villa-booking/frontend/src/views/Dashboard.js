'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaUser, FaCalendarAlt, FaHeart, FaSignOutAlt, FaShieldAlt, FaClock, FaEnvelope, FaBell } from 'react-icons/fa';
import { useUserAuth } from '../context/UserAuthContext';
import { useWishlist } from '../context/WishlistContext';
import { getNotifications, markNotificationsRead } from '../services/bookingService';

const Dashboard = () => {
  const { user, logout } = useUserAuth();
  const { wishlist, fetchWishlist } = useWishlist();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => { if (user) fetchWishlist(); }, [user, fetchWishlist]);

  useEffect(() => {
    if (!user) return;
    getNotifications().then(setNotifications).catch(() => setNotifications([]));
  }, [user]);

  if (!user) return null;

  const unread = notifications.filter((n) => !n.read).length;

  const tabs = [
    { href: '/dashboard', label: 'Profile', icon: FaUser, active: true },
    { href: '/bookings', label: 'My Bookings', icon: FaCalendarAlt },
    { href: '/wishlist', label: 'Wishlist', icon: FaHeart, count: wishlist.length },
  ];

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* noop */ }
  };

  return (
    <section className="pt-36 pb-24 bg-white min-h-screen">
      <div className="luxury-container">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-display-lg mb-2">My Dashboard</h1>
          <p className="text-gray-500 mb-12">Welcome back, <span className="text-luxury-accent font-medium">{user.name}</span></p>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1">
            <div className="bg-luxury-cream rounded-3xl p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-luxury-accent to-luxury-accent/80 flex items-center justify-center text-white text-2xl font-display mb-4">{user.name?.[0] || 'U'}</div>
                <h3 className="font-display text-xl">{user.name}</h3>
                <p className="text-gray-400 text-sm">{user.email}</p>
              </div>
              <nav className="flex flex-col gap-2">
                {tabs.map((tab) => (
                  <Link key={tab.href} href={tab.href}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all ${tab.active ? 'bg-luxury-accent text-white shadow-md' : 'text-gray-500 hover:bg-white'}`}>
                    <span className="flex items-center gap-3"><tab.icon /> {tab.label}</span>
                    {tab.count > 0 && <span className="bg-white text-luxury-black text-xs w-5 h-5 rounded-full flex items-center justify-center">{tab.count}</span>}
                  </Link>
                ))}
                <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-gray-500 hover:bg-white transition-all mt-4 w-full"><FaSignOutAlt /> Sign Out</button>
              </nav>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-50 p-8">
              <h2 className="font-display text-2xl mb-8">Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { icon: FaUser, label: 'Full Name', value: user.name },
                  { icon: FaEnvelope, label: 'Email', value: user.email },
                  { icon: FaShieldAlt, label: 'Membership', value: 'Premium Member' },
                  { icon: FaClock, label: 'Account', value: 'Member' },
                ].map((item, i) => (
                  <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                    className="bg-luxury-cream rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-luxury-accent/20 flex items-center justify-center"><item.icon className="text-luxury-accent text-sm" /></div>
                      <span className="text-xs uppercase tracking-widest text-gray-500">{item.label}</span>
                    </div>
<p className="font-body text-luxury-black">{item.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-50 p-8 mt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl flex items-center gap-3">
                  <FaBell className="text-luxury-accent" /> Notifications
                  {unread > 0 && <span className="text-xs font-medium bg-red-500 text-white px-2 py-0.5 rounded-full">{unread} new</span>}
                </h2>
                {notifications.length > 0 && unread > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-luxury-accent hover:underline">Mark all as read</button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="text-gray-400 text-sm">No notifications yet. We&apos;ll keep you posted on your bookings.</p>
              ) : (
                <ul className="space-y-3">
                  {notifications.map((n) => (
                    <li key={n._id} className={`flex items-start gap-3 rounded-2xl p-4 ${n.read ? 'bg-luxury-cream/60' : 'bg-blue-50 border border-blue-100'}`}>
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-gray-300' : 'bg-luxury-accent'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{n.title}</p>
                        {n.message && <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>}
                        <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;

