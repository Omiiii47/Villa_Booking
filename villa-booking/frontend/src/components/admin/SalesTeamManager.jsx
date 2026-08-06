'use client'
import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import * as adminService from '../../services/adminService';

const SalesTeamManager = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try { const data = await adminService.getSalesTeam(); setMembers(data.staff || []); }
    catch { setMembers([]); }
    setLoading(false);
  }, []);

  useEffect(() => { const t = setTimeout(() => fetchMembers(), 300); return () => clearTimeout(t); }, [fetchMembers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      await adminService.createSalesTeam(form);
      setForm({ name: '', email: '', password: '' });
      await fetchMembers();
    } catch (err) { setErr(err.response?.data?.message || 'Failed to add member'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this sales team member?')) return;
    try { await adminService.deleteSalesTeam(id); await fetchMembers(); }
    catch { alert('Failed to delete'); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div>
        <h3 className="font-display text-xl mb-4">Add Sales Team Member</h3>
        <form onSubmit={handleCreate} className="bg-luxury-cream rounded-2xl p-6 space-y-4">
          {err && <div className="bg-red-50 text-red-500 text-sm p-3 rounded-xl">⚠ {err}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input-field rounded-xl w-full" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="input-field rounded-xl w-full" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} className="input-field rounded-xl w-full" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full text-[10px]"><span><FaPlus className="inline mr-1" /> {saving ? 'Adding...' : 'Add Member'}</span></button>
        </form>
        <p className="text-xs text-gray-400 mt-3">Sales team members sign in at /sales.</p>
      </div>

      <div className="lg:col-span-2">
        <h3 className="font-display text-xl mb-4">Sales Team Members</h3>
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-luxury-accent border-t-transparent rounded-full animate-spin" /></div>
        ) : members.length === 0 ? (
          <p className="text-gray-400 py-10">No sales team members yet.</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-luxury-cream">
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m._id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium">{m.name}</td>
                    <td className="p-4 text-gray-500">{m.email}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(m._id)} className="text-red-400 hover:text-red-600"><FaTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesTeamManager;