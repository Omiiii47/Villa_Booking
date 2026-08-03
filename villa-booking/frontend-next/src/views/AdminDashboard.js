'use client'
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaHome, FaUsers, FaCalendarAlt, FaSignOutAlt, FaTrash, FaImage, FaPlus, FaSave } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const inputCls = 'w-full rounded-xl border border-gray-200 bg-luxury-cream/50 px-3 py-2 text-sm outline-none focus:border-luxury-accent';
const labelCls = 'block text-xs uppercase tracking-wider text-gray-400 mb-1';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('villas');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      switch (tab) {
        case 'villas': data = await api.get('/villas?limit=50'); setItems(data.data.villas); break;
        case 'bookings': data = await api.get('/bookings/all'); setItems(data.data.bookings); break;
        case 'users': data = await api.get('/users'); setItems(data.data.users); break;
        case 'content': data = await api.get('/admin/site-content'); setContent(data.data); setItems([]); break;
        default: setItems([]);
      }
    } catch { setItems([]); }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/login'); return; }
    fetchData();
  }, [user, router, tab, fetchData]);

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/${type}/${id}`);
      fetchData();
    } catch { alert('Failed to delete'); }
  };

  const updateContent = (key, value) => setContent((c) => ({ ...c, [key]: value }));

  const updateGalleryItem = (i, key, value) => setContent((c) => {
    const gallery = [...c.gallery];
    gallery[i] = { ...gallery[i], [key]: value };
    return { ...c, gallery };
  });

  const updateShowcaseItem = (i, key, value) => setContent((c) => {
    const showcase = [...c.showcase];
    showcase[i] = { ...showcase[i], [key]: value };
    return { ...c, showcase };
  });

  const handleUpload = async (e, onUrl) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('images', file);
      const res = await api.post('/villas/upload-images', fd);
      const url = res.data.images?.[0];
      if (url) onUrl(url);
    } catch { alert('Upload failed'); }
    e.target.value = '';
  };

  const handleSaveContent = async () => {
    setSaving(true);
    try {
      const res = await api.put('/admin/site-content', content);
      setContent(res.data);
      alert('Site content saved');
    } catch { alert('Failed to save content'); }
    setSaving(false);
  };

  const UploadInput = ({ onUrl }) => {
    const fileRef = useRef(null);
    return (
      <button type="button" onClick={() => fileRef.current?.click()}
        className="shrink-0 rounded-lg border border-luxury-accent/30 text-luxury-accent text-xs px-3 py-2 hover:bg-luxury-accent hover:text-white transition-colors">
        Upload
        <input type="file" accept="image/*" hidden ref={fileRef} onChange={(e) => handleUpload(e, onUrl)} />
      </button>
    );
  };

  const ContentEditor = () => {
    if (!content) return null;
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="font-display text-xl mb-4">Hero Image</h2>
          <div className="flex items-center gap-4">
            {content.heroImage && (
              <img src={content.heroImage} alt="Hero" className="w-40 h-24 object-cover rounded-xl border" />
            )}
            <div className="flex-1 space-y-2">
              <input
                className={inputCls}
                value={content.heroImage || ''}
                onChange={(e) => updateContent('heroImage', e.target.value)}
                placeholder="Image URL"
              />
              <UploadInput onUrl={(url) => updateContent('heroImage', url)} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">Gallery Images</h2>
            <button type="button" onClick={() => updateContent('gallery', [...content.gallery, { src: '', alt: '', location: '', size: 'sm' }])}
              className="flex items-center gap-2 text-xs text-luxury-accent hover:underline">
              <FaPlus /> Add Image
            </button>
          </div>
          <div className="space-y-4">
            {content.gallery.map((img, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-3 md:items-start rounded-xl border border-gray-100 p-4">
                {img.src && <img src={img.src} alt={img.alt || 'Gallery'} className="w-24 h-20 object-cover rounded-lg border shrink-0" />}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input className={inputCls} value={img.src} onChange={(e) => updateGalleryItem(i, 'src', e.target.value)} placeholder="Image URL" />
                  <input className={inputCls} value={img.alt} onChange={(e) => updateGalleryItem(i, 'alt', e.target.value)} placeholder="Alt text" />
                  <input className={inputCls} value={img.location} onChange={(e) => updateGalleryItem(i, 'location', e.target.value)} placeholder="Location" />
                  <select className={inputCls} value={img.size} onChange={(e) => updateGalleryItem(i, 'size', e.target.value)}>
                    <option value="sm">Small</option>
                    <option value="md">Large</option>
                  </select>
                </div>
                <div className="flex gap-2 shrink-0">
                  <UploadInput onUrl={(url) => updateGalleryItem(i, 'src', url)} />
                  <button type="button" onClick={() => updateContent('gallery', content.gallery.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 p-2"><FaTrash /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">Showcase Villas</h2>
            <button type="button" onClick={() => updateContent('showcase', [...content.showcase, { name: '', slug: '', image: '', tag: '', price: '', desc: '' }])}
              className="flex items-center gap-2 text-xs text-luxury-accent hover:underline">
              <FaPlus /> Add Villa
            </button>
          </div>
          <div className="space-y-4">
            {content.showcase.map((villa, i) => (
              <div key={i} className="rounded-xl border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-3 md:items-start">
                  {villa.image && <img src={villa.image} alt={villa.name || 'Showcase'} className="w-24 h-20 object-cover rounded-lg border shrink-0" />}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input className={inputCls} value={villa.name} onChange={(e) => updateShowcaseItem(i, 'name', e.target.value)} placeholder="Name" />
                    <input className={inputCls} value={villa.slug} onChange={(e) => updateShowcaseItem(i, 'slug', e.target.value)} placeholder="Slug (URL)" />
                    <input className={inputCls} value={villa.tag} onChange={(e) => updateShowcaseItem(i, 'tag', e.target.value)} placeholder="Tag" />
                    <input className={inputCls} value={villa.price} onChange={(e) => updateShowcaseItem(i, 'price', e.target.value)} placeholder="Price (e.g. $2,500)" />
                    <input className={inputCls} value={villa.image} onChange={(e) => updateShowcaseItem(i, 'image', e.target.value)} placeholder="Image URL" />
                    <input className={inputCls} value={villa.desc} onChange={(e) => updateShowcaseItem(i, 'desc', e.target.value)} placeholder="Short description" />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <UploadInput onUrl={(url) => updateShowcaseItem(i, 'image', url)} />
                    <button type="button" onClick={() => updateContent('showcase', content.showcase.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-600 p-2"><FaTrash /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSaveContent} disabled={saving}
            className="flex items-center gap-2 bg-luxury-accent text-white px-8 py-3 rounded-xl text-sm disabled:opacity-50">
            <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'villas', label: 'Villas', icon: FaHome },
    { id: 'bookings', label: 'Bookings', icon: FaCalendarAlt },
    { id: 'users', label: 'Users', icon: FaUsers },
    { id: 'content', label: 'Site Content', icon: FaImage },
  ];

  if (!user || user.role !== 'admin') return null;

  return (
    <section className="pt-32 pb-20 bg-white min-h-screen">
      <div className="luxury-container">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-4xl md:text-5xl">Admin Dashboard</h1>
            <p className="text-gray-500">Manage your platform</p>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400">
            <FaSignOutAlt /> Sign Out
          </button>
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

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-luxury-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'content' ? (
          <ContentEditor />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-luxury-cream">
                    {tab === 'villas' && <><th className="text-left p-4 font-medium">Name</th><th className="text-left p-4 font-medium">Price</th><th className="text-left p-4 font-medium">Location</th><th className="text-left p-4 font-medium">Rating</th><th className="text-right p-4 font-medium">Actions</th></>}
                    {tab === 'bookings' && <><th className="text-left p-4 font-medium">Guest</th><th className="text-left p-4 font-medium">Villa</th><th className="text-left p-4 font-medium">Dates</th><th className="text-left p-4 font-medium">Status</th><th className="text-left p-4 font-medium">Total</th><th className="text-right p-4 font-medium">Actions</th></>}
                    {tab === 'users' && <><th className="text-left p-4 font-medium">Name</th><th className="text-left p-4 font-medium">Email</th><th className="text-left p-4 font-medium">Role</th><th className="text-right p-4 font-medium">Actions</th></>}
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
                          <td className="p-4"><span className="capitalize">{item.role}</span></td>
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

