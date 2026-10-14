'use client'
import { useState, useEffect, useCallback } from 'react';
import { FaTrash, FaEnvelopeOpen } from 'react-icons/fa';
import * as adminService from '../../services/adminService';
import Pagination from '../Pagination';

const PAGE_SIZE = 10;

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getContactMessages({ page, limit: PAGE_SIZE });
      if (!data.messages.length && page > 1) {
        setPage(Math.max(1, data.pages || 1));
      } else {
        setMessages(data.messages);
        setPages(data.pages || 1);
        setTotal(data.total || data.messages.length);
      }
    } catch { setMessages([]); }
    setLoading(false);
  }, [page]);

  useEffect(() => { const t = setTimeout(() => fetchMessages(), 300); return () => clearTimeout(t); }, [fetchMessages]);

  const toggleExpand = async (m) => {
    if (expandedId === m._id) { setExpandedId(null); return; }
    setExpandedId(m._id);
    if (!m.read) {
      try {
        await adminService.markContactMessageRead(m._id);
        setMessages((prev) => prev.map((x) => (x._id === m._id ? { ...x, read: true } : x)));
      } catch { /* keep unread visually until refetch */ }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try { await adminService.deleteContactMessage(id); setExpandedId(null); await fetchMessages(); }
    catch { alert('Failed to delete'); }
  };

  const unread = messages.filter((m) => !m.read).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{total} messages · {unread} unread on this page</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-2 border-luxury-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border py-16 text-center">
          <p className="text-gray-400">No contact messages yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-luxury-cream">
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Subject</th>
                  <th className="text-left p-4 font-medium">Message</th>
                  <th className="text-left p-4 font-medium">Received</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <ContactRow key={m._id} m={m} expanded={expandedId === m._id}
                    onToggle={() => toggleExpand(m)} onDelete={() => handleDelete(m._id)} />
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} onPage={setPage} />
        </div>
      )}
    </div>
  );
};

const ContactRow = ({ m, expanded, onToggle, onDelete }) => (
  <>
    <tr onClick={onToggle} className={`border-t border-gray-100 cursor-pointer ${expanded ? 'bg-luxury-cream/60' : m.read ? 'hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-50'}`}>
      <td className="p-4 font-medium">
        <span className="flex items-center gap-2">
          {!m.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
          {m.name}
        </span>
      </td>
      <td className="p-4 text-gray-500">{m.email}</td>
      <td className="p-4">{m.subject || <span className="text-gray-300">—</span>}</td>
      <td className="p-4 text-gray-600 max-w-xs">
        <span className="line-clamp-2">{m.message}</span>
      </td>
      <td className="p-4 text-gray-500 whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</td>
      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end items-center gap-3">
          {!m.read && (
            <button onClick={onToggle} title="Mark as read" className="text-gray-400 hover:text-luxury-accent"><FaEnvelopeOpen /></button>
          )}
          <button onClick={onDelete} className="text-red-400 hover:text-red-600"><FaTrash /></button>
        </div>
      </td>
    </tr>
    {expanded && (
      <tr className="border-t border-gray-100 bg-luxury-cream/60">
        <td colSpan={6} className="p-4">
          <div className="rounded-xl bg-white border p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Full message from {m.name} ({m.email})</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{m.message}</p>
          </div>
        </td>
      </tr>
    )}
  </>
);

export default ContactMessages;
