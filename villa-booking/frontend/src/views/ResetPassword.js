'use client'
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { resetPassword } from '../services/userAuthService';

const ResetPassword = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('This reset link is missing or incomplete. Please request a new one.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, form.password);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'This reset link is invalid or has expired. Please request a new one.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-luxury-cream to-white py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md px-4"
      >
        <div className="bg-white rounded-3xl shadow-xl shadow-black/[0.02] border border-gray-100 p-8 md:p-10">
          <div className="text-center mb-8">
            <Link href="/" className="font-display text-2xl text-luxury-black">
              Solscape<span className="text-luxury-accent">Stays</span>
            </Link>
            <h1 className="font-display text-3xl mt-8 mb-2">Set a New Password</h1>
            <p className="text-gray-400 text-sm">Choose a strong password for your account.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 text-sm p-3.5 rounded-2xl mb-5">⚠ {error}</div>
          )}

          {done && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mb-5">
                <FaCheckCircle className="text-3xl text-green-500" />
              </div>
              <h2 className="font-display text-xl mb-3">Password updated</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                Your password has been reset. You can now sign in with your new password.
              </p>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="btn-primary w-full text-[10px]"
              >
                <span>Go to Login</span>
              </button>
            </div>
          )}

          {!done && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">New Password</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type={show ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={6}
                    className="input-field !pl-12 !pr-12 rounded-2xl"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                  >
                    {show ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Confirm New Password</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type={show ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                    className="input-field !pl-12 rounded-2xl"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full text-[10px]"
              >
                {submitting ? <FaSpinner className="animate-spin" /> : <FaLock />}
                <span>{submitting ? 'Updating…' : 'Update Password'}</span>
              </button>
            </form>
          )}

          <p className="text-center text-gray-400 text-sm mt-8">
            Remembered it?{' '}
            <Link href="/login" className="text-luxury-accent hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </section>
  );
};

export default ResetPassword;