'use client'
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useUserAuth } from '../context/UserAuthContext';

const Login = () => {
  const { login } = useUserAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try { await login(form.email, form.password); router.push('/dashboard'); }
    catch (err) { setError(err.response?.data?.message || 'Invalid email or password'); }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-luxury-cream to-white py-20">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md px-4">
        <div className="bg-white rounded-3xl shadow-xl shadow-black/[0.02] border border-gray-100 p-8 md:p-10">
          <div className="text-center mb-8">
            <Link href="/" className="font-display text-2xl text-luxury-black">Solscape<span className="text-luxury-accent">Stays</span></Link>
            <h1 className="font-display text-3xl mt-8 mb-2">Welcome Back</h1>
            <p className="text-gray-400 text-sm">Sign in to manage your bookings and wishlist.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="bg-red-50 text-red-500 text-sm p-3.5 rounded-2xl">⚠ {error}</div>}
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Email</label>
              <div className="relative"><FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" /><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="input-field !pl-12 rounded-2xl" placeholder="your@email.com" /></div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Password</label>
              <div className="relative"><FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" /><input type={show ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="input-field !pl-12 !pr-12 rounded-2xl" placeholder="••••••••" /><button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">{show ? <FaEyeSlash /> : <FaEye />}</button></div>
            </div>
            <button type="submit" className="btn-primary w-full text-[10px]"><span>Sign In</span></button>
          </form>
          <p className="text-center text-gray-400 text-sm mt-8">Don't have an account? <Link href="/register" className="text-luxury-accent hover:underline font-medium">Create one</Link></p>
        </div>
      </motion.div>
    </section>
  );
};

export default Login;

