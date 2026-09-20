'use client'
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaEnvelope, FaPaperPlane, FaEnvelopeOpenText, FaSpinner } from 'react-icons/fa';
import { forgotPassword } from '../services/userAuthService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverMessage, setServerMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    setSent(false);
    try {
      const res = await forgotPassword(email);
      setServerMessage(res.message || 'Sent');
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
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
            <h1 className="font-display text-3xl mt-8 mb-2">Forgot Password</h1>
            <p className="text-gray-400 text-sm">Enter your email and we will send you a reset link.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 text-sm p-3.5 rounded-2xl mb-5">⚠ {error}</div>
          )}

          {sent ? (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mb-5">
                <FaEnvelopeOpenText className="text-3xl text-green-500" />
              </div>
              <h2 className="font-display text-xl mb-3">Check your inbox</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">{serverMessage}</p>
              <Link href="/login" className="btn-primary w-full text-[10px] block text-center">
                <span>Back to Login</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-500 mb-2 block">Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field !pl-12 rounded-2xl"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full text-[10px]"
              >
                {submitting ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                <span>{submitting ? 'Sending…' : 'Send Reset Link'}</span>
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

export default ForgotPassword;