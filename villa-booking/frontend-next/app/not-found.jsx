'use client'

import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../src/components/Navbar';
import Footer from '../src/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center px-4">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 80 }}
            className="font-display text-[200px] md:text-[300px] leading-none text-luxury-cream block"
          >
            404
          </motion.span>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="-mt-10"
          >
            <h1 className="font-display text-3xl md:text-4xl text-luxury-black mb-4">Page Not Found</h1>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              The page you are looking for might have been moved, deleted, or perhaps never existed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/" className="btn-primary text-[10px]"><span>Return Home</span></Link>
              <Link href="/villas" className="btn-outline text-[10px]"><span>Browse Villas</span></Link>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
