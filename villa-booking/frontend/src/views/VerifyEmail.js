'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaEnvelope,
  FaPaperPlane,
  FaSpinner,
  FaInbox,
} from 'react-icons/fa';
import { verifyEmail, resendVerification } from '../services/userAuthService';

const VerifyEmail = () => {
  const searchParams = useSearchParams();
  const hasToken = Boolean(searchParams.get('token'));

  const [status, setStatus] = useState(hasToken ? 'verifying' : 'missing'); // verifying | success | error | missing | resending
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [sentMessage, setSentMessage] = useState('');

  useEffect(() => {
    if (!hasToken) return;
    // One-shot run against an external URL value (the emailed verification
    // link). Initial status is already 'verifying', so nothing is set
    // synchronously here.
    (async () => {
      try {
        await verifyEmail(searchParams.get('token'));
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'This verification link is invalid or has expired.');
      }
    })();
  }, [hasToken, searchParams]);

  const handleResend = async (e) => {
    e.preventDefault();
    setStatus('resending');
    setSentMessage('');
    try {
      const res = await resendVerification(email);
      setSentMessage(res.message || 'Sent');
      setStatus('error');
    } catch (err) {
      setSentMessage(err.response?.data?.message || 'Could not send the verification email. Please try again later.');
      setStatus('error');
    }
  };

  const spinner = <FaSpinner className="animate-spin" />;

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
            <h1 className="font-display text-3xl mt-8 mb-2">Verify Your Email</h1>
            <p className="text-gray-400 text-sm">Confirm your email address to activate your account.</p>
          </div>

          {(status === 'verifying' || status === 'resending') && (
            <div className="flex flex-col items-center py-8">
              <div className="w-12 h-12 rounded-full bg-luxury-cream flex items-center justify-center mb-4">{spinner}</div>
              <p className="text-sm text-gray-500">Verifying your email&hellip;</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mb-5">
                <FaCheckCircle className="text-3xl text-green-500" />
              </div>
              <h2 className="font-display text-2xl mb-2">Email Verified!</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                Your account is ready. You can now sign in and start booking.
              </p>
              <Link href="/login" className="btn-primary w-full text-[10px] block text-center">
                <span>Go to Login</span>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-5">
                <FaExclamationTriangle className="text-3xl text-red-500" />
              </div>
              <h2 className="font-display text-xl mb-2">Link Invalid or Expired</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">{message}</p>

              <form onSubmit={handleResend} className="w-full space-y-4">
                <div className="relative text-left">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="input-field !pl-12 rounded-2xl"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'resending'}
                  className="btn-primary w-full text-[10px]"
                >
                  {status === 'resending' ? spinner : <FaPaperPlane />}
                  <span>{status === 'resending' ? 'Sending…' : 'Send New Verification Link'}</span>
                </button>
              </form>
              {sentMessage && (
                <p className="mt-4 w-full text-center text-xs text-luxury-accent">{sentMessage}</p>
              )}
            </div>
          )}

          {status === 'missing' && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-luxury-cream flex items-center justify-center mb-4">
                <FaInbox className="text-xl text-luxury-accent" />
              </div>
              <p className="text-sm text-gray-500 mb-6">
                No verification link provided. If you have an unverified account, request a new link below.
              </p>
              <form onSubmit={handleResend} className="w-full space-y-4">
                <div className="relative text-left">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="input-field !pl-12 rounded-2xl"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'resending'}
                  className="btn-primary w-full text-[10px]"
                >
                  <FaPaperPlane />
                  <span>Request New Link</span>
                </button>
              </form>
              {sentMessage && (
                <p className="mt-4 w-full text-center text-xs text-luxury-accent">{sentMessage}</p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default VerifyEmail;