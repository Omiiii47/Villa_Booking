'use client'
import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaTrash, FaEdit, FaChevronUp, FaChevronDown, FaTimes, FaImages } from 'react-icons/fa';
import * as adminService from '../../services/adminService';

const emptyForm = {
  name: '', shortDescription: '', description: '', pricePerNight: '', capacity: 2, bedrooms: 1,
  bathrooms: 1, size: '', location: '', images: [], amenities: '', facilities: '', rules: '', featured: false,
  showBookNow: true, showExploreVilla: true,
};

const VillaManager = () => {
  const [villas, setVillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const fetchVillas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getVillas({ limit: 200, sort: 'order' });
      setVillas(data.villas);
    } catch { setVillas([]); }
    setLoading(false);
  }, []);

  useEffect(() => { const t = setTimeout(() => fetchVillas(), 300); return () => clearTimeout(t); }, [fetchVillas]);

  const openNew = () => { setForm(emptyForm); setShowForm(true); setEditing(null); };

  const openEdit = (v) => {
    setForm({
      name: v.name, shortDescription: v.shortDescription || '', description: v.description || '',
      pricePerNight: v.pricePerNight, capacity: v.capacity, bedrooms: v.bedrooms, bathrooms: v.bathrooms,
      size: v.size || '', location: v.location, images: v.images || [],
      amenities: (v.amenities || []).join(', '),
      facilities: (v.facilities || []).join(', '),
      rules: (v.rules || []).join(', '),
      featured: v.featured, showBookNow: v.showBookNow, showExploreVilla: v.showExploreVilla,
    });
    setEditing(v);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        pricePerNight: Number(form.pricePerNight),
        capacity: Number(form.capacity),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        amenities: form.amenities.split(',').map((s) => s.trim()).filter(Boolean),
        facilities: form.facilities.split(',').map((s) => s.trim()).filter(Boolean),
        rules: form.rules.split(',').map((s) => s.trim()).filter(Boolean),
      };
      if (editing) await adminService.updateVilla(editing._id, payload);
      else await adminService.createVilla(payload);
      await fetchVillas();
      setShowForm(false);
    } catch (err) { alert(err.response?.data?.message || 'Failed to save villa'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this villa?')) return;
    try { await adminService.deleteVilla(id); await fetchVillas(); }
    catch { alert('Failed to delete'); }
  };

  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= villas.length) return;
    const ordered = [...villas].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const cur = ordered[index];
    const swap = ordered[target];
    try {
      await adminService.updateVilla(cur._id, { order: swap.order ?? cur.order });
      await adminService.updateVilla(swap._id, { order: cur.order ?? swap.order });
      await fetchVillas();
    } catch { alert('Failed to reorder'); }
  };

  const toggleCta = async (v, field) => {
    try { await adminService.updateVilla(v._id, { [field]: !v[field] }); await fetchVillas(); }
    catch { alert('Failed to update'); }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    setUploading(true);
    try {
      const { images } = await adminService.uploadImages(fd);
      setForm({ ...form, images: [...form.images, ...images] });
    } catch { alert('Upload failed'); }
    setUploading(false);
    e.target.value = '';
  };

  const removeImage = (idx) => setForm({ ...form, images: form.images.filter((_, i) => i !== idx) });

  const addImageUrl = () => {
    const url = imageUrl.trim();
    if (!url) return;
    setForm({ ...form, images: [...form.images, url] });
    setImageUrl('');
  };

  const moveImage = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= form.images.length) return;
    const next = [...form.images];
    [next[idx], next[target]] = [next[target], next[idx]];
    setForm({ ...form, images: next });
  };

  const ordered = [...villas].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{ordered.length} villas · slugs auto-generate from the name</p>
        <button onClick={openNew} className="btn-primary text-[10px]"><FaPlus /> <span>Add Villa</span></button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-luxury-cream">
                <th className="text-left p-4 font-medium">Order</th>
                <th className="text-left p-4 font-medium">Villa</th>
                <th className="text-left p-4 font-medium">Price</th>
                <th className="text-left p-4 font-medium">Location</th>
                <th className="text-left p-4 font-medium">Rating</th>
                <th className="text-left p-4 font-medium">CTAs</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((v, i) => (
                <tr key={v._id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => move(i, -1)} disabled={i === 0} className="text-gray-300 hover:text-luxury-accent disabled:opacity-30"><FaChevronUp /></button>
                      <button onClick={() => move(i, 1)} disabled={i === ordered.length - 1} className="text-gray-300 hover:text-luxury-accent disabled:opacity-30"><FaChevronDown /></button>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {v.images?.[0] && <img src={v.images[0]} alt="" className="w-12 h-10 rounded-lg object-cover" />}
                      <div>
                        <p className="font-medium">{v.name}</p>
                        <p className="text-xs text-gray-400">/{v.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">${v.pricePerNight}</td>
                  <td className="p-4 text-gray-500">{v.location}</td>
                  <td className="p-4">{v.rating} ({v.numReviews})</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => toggleCta(v, 'showBookNow')}
                        className={`text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full ${v.showBookNow ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        Book
                      </button>
                      <button onClick={() => toggleCta(v, 'showExploreVilla')}
                        className={`text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full ${v.showExploreVilla ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                        Explore
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => openEdit(v)} className="text-gray-400 hover:text-luxury-accent"><FaEdit /></button>
                      <button onClick={() => handleDelete(v._id)} className="text-red-400 hover:text-red-600"><FaTrash /></button>
                      <a href={`/villas/${v.slug}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-luxury-accent text-xs self-center">View</a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && ordered.length === 0 && <p className="text-center text-gray-400 py-10">No villas yet. Add your first villa.</p>}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-display text-2xl">{editing ? 'Edit Villa' : 'Add Villa'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Villa Name *"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" /></Field>
                <Field label="Location *"><input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" /></Field>
                <Field label="Price / Night *"><input type="number" required min="0" value={form.pricePerNight} onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })} className="input-field" /></Field>
                <Field label="Size (e.g. 4500 sq ft)"><input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="input-field" /></Field>
                <Field label="Bedrooms"><input type="number" min="1" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} className="input-field" /></Field>
                <Field label="Bathrooms"><input type="number" min="1" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} className="input-field" /></Field>
                <Field label="Capacity (guests)"><input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="input-field" /></Field>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
                </div>
                <Field label="Short Tagline"><input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} className="input-field" /></Field>
                <Field label="Amenities (comma separated)"><input value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} className="input-field" placeholder="Pool, Private Chef, Spa" /></Field>
                <Field label="Facilities (comma separated)"><input value={form.facilities} onChange={(e) => setForm({ ...form, facilities: e.target.value })} className="input-field" placeholder="Infinity Pool, Gym, Helipad" /></Field>
                <Field label="Rules (comma separated)"><input value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} className="input-field" placeholder="Check-in 3 PM, No smoking" /></Field>
              </div>
              <Field label="Description"><textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" /></Field>

              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-3">Images (Cloudinary URLs)</label>
                <div className="flex gap-2 mb-3">
                  <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                    placeholder="Paste a Cloudinary image URL" className="input-field" />
                  <button type="button" onClick={addImageUrl} className="btn-outline text-[10px] !px-5"><span>Add URL</span></button>
                </div>
                <div className="flex flex-wrap gap-3 mb-3">
                  {form.images.map((src, i) => (
                    <div key={i} className="relative w-28 h-24 rounded-xl overflow-hidden group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-1 right-1 flex gap-1">
                        <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0}
                          className="w-5 h-5 bg-black/60 text-white rounded-full text-xs disabled:opacity-30"><FaChevronUp /></button>
                        <button type="button" onClick={() => removeImage(i)} className="w-5 h-5 bg-black/60 text-white rounded-full text-xs"><FaTimes /></button>
                        <button type="button" onClick={() => moveImage(i, 1)} disabled={i === form.images.length - 1}
                          className="w-5 h-5 bg-black/60 text-white rounded-full text-xs disabled:opacity-30"><FaChevronDown /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <label className="cursor-pointer inline-flex items-center gap-2 text-sm text-gray-500 hover:text-luxury-accent">
                  <FaImages /> {uploading ? 'Uploading...' : 'Upload images'}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>

              <div className="flex gap-6 pt-4 border-t">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.showBookNow} onChange={(e) => setForm({ ...form, showBookNow: e.target.checked })} />
                  Show &ldquo;Book Now&rdquo; button
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.showExploreVilla} onChange={(e) => setForm({ ...form, showExploreVilla: e.target.checked })} />
                  Show &ldquo;Explore Villa&rdquo; button
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline text-[10px]"><span>Cancel</span></button>
                <button type="submit" disabled={saving} className="btn-primary text-[10px]"><span>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Villa'}</span></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">{label}</label>
    {children}
  </div>
);

export default VillaManager;