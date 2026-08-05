'use client'
import { useState, useEffect, useCallback } from 'react';
import { FaHome, FaUsers, FaCalendarAlt, FaSignOutAlt, FaTrash, FaImage } from 'react-icons/fa';
import { useAdminAuth } from '../context/AdminAuthContext';
import * as adminService from '../services/adminService';
import LandingCmsEditor from '../components/admin/LandingCmsEditor';
import VillaManager from '../components/admin/VillaManager';

const AdminDashboard = () => {
  const { admin, logout } = useAdminAuth();
  const [tab, setTab] = useState('villas');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      switch (tab) {
        case 'villas': data = await adminService.getVillas({ limit: 50 }); setItems(data.villas); break;
        case 'bookings': data = await adminService.getBookings(); setItems(data.bookings); break;
        case 'users': data = await adminService.getUsers(); setItems(data.users); break;
        default: setItems([]);
      }
    } catch { setItems([]); }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    if (!admin) return;
    fetchData();
  }, [admin, tab, fetchData]);

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      if (type === 'villas') await adminService.deleteVilla(id);
      else if (type === 'bookings') await adminService.deleteBooking(id);
      else if (type === 'users') await adminService.deleteUser(id);
      fetchData();
    } catch { alert('Failed to delete'); }
  };

  const tabs = [
    { id: 'villas', label: 'Villas', icon: FaHome },
    { id: 'bookings', label: 'Bookings', icon: FaCalendarAlt },
    { id: 'users', label: 'Users', icon: FaUsers },
    { id: 'cms', label: 'Landing CMS', icon: FaImage },
  ];

  if (!admin) return null;

  return (
    <section className="pt-32 pb-20 bg-white min-h-screen">
      <div className="luxury-container">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-4xl md:text-5xl">Admin Dashboard</h1>
            <p className="text-gray-500">Manage your platform</p>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-400 hidden sm:block">Signed in as {admin.name}</span>
            <button onClick={logout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400">
              <FaSignOutAlt /> Sign Out
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm transition-all whitespace-nowrap ${
                tab === t.id ? 'bg-luxury-accent text-white' : 'bg-luxury-cream text-gray-600 hover:bg-gray-200'
              }`}
            >
              <t.icon /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'cms' ? (
          <LandingCmsEditor />
        ) : tab === 'villas' ? (
          <VillaManager />
        ) : loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-luxury-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-luxury-cream">
                    {tab === 'villas' && <><th className="text-left p-4 font-medium">Name</th><th className="text-left p-4 font-medium">Price</th><th className="text-left p-4 font-medium">Location</th><th className="text-left p-4 font-medium">Rating</th><th className="text-right p-4 font-medium">Actions</th></>}
                    {tab === 'bookings' && <><th className="text-left p-4 font-medium">Guest</th><th className="text-left p-4 font-medium">Villa</th><th className="text-left p-4 font-medium">Dates</th><th className="text-left p-4 font-medium">Status</th><th className="text-left p-4 font-medium">Total</th><th className="text-right p-4 font-medium">Actions</th></>}
                    {tab === 'users' && <><th className="text-left p-4 font-medium">Name</th><th className="text-left p-4 font-medium">Email</th><th className="text-right p-4 font-medium">Actions</th></>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item._id} className="border-t border-gray-100 hover:bg-gray-50">
                      {tab === 'villas' && (
                        <>
                          <td className="p-4 font-medium">{item.name}</td>
                          <td className="p-4">${item.pricePerNight}</td>
                          <td className="p-4 text-gray-500">{item.location}</td>
                          <td className="p-4">{item.rating} ({item.numReviews})</td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleDelete(item._id, 'villas')} className="text-red-400 hover:text-red-600"><FaTrash /></button>
                          </td>
                        </>
                      )}
                      {tab === 'bookings' && (
                        <>
                          <td className="p-4 font-medium">{item.user?.name || 'N/A'}</td>
                          <td className="p-4">{item.villa?.name || 'N/A'}</td>
                          <td className="p-4 text-gray-500">{new Date(item.checkIn).toLocaleDateString()} - {new Date(item.checkOut).toLocaleDateString()}</td>
                          <td className="p-4"><span className={`text-xs uppercase tracking-widest px-2 py-1 rounded-full ${
                            item.status === 'confirmed' ? 'bg-green-100 text-green-700' : item.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>{item.status}</span></td>
                          <td className="p-4">${item.totalPrice}</td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleDelete(item._id, 'bookings')} className="text-red-400 hover:text-red-600"><FaTrash /></button>
                          </td>
                        </>
                      )}
                      {tab === 'users' && (
                        <>
                          <td className="p-4 font-medium">{item.name}</td>
                          <td className="p-4 text-gray-500">{item.email}</td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleDelete(item._id, 'users')} className="text-red-400 hover:text-red-600"><FaTrash /></button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 && <p className="text-center text-gray-400 py-10">No items found.</p>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminDashboard;
