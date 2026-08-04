'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserAuth } from '../context/UserAuthContext';
import Magnetic from './Magnetic';

const Navbar = () => {
  const { user, logout } = useUserAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const location = usePathname();

  useEffect(() => {
    let lastScroll = 0;
    const handleScroll = () => {
      const current = window.scrollY;
      setScrolled(current > 50);
      setHidden(current > lastScroll && current > 200);
      lastScroll = current;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/villas', label: 'Villas' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  const isActive = (path) => location === path || (path !== '/' && location.startsWith(path));

  return (
    <>
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: hidden ? -120 : 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
          scrolled ? 'glass-premium shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="luxury-container">
          <div className="flex items-center justify-between h-20 md:h-24">
            <Link href="/" className="flex items-center gap-1.5 group">
              <span className={`font-display text-xl md:text-2xl tracking-tight transition-colors duration-500 ${
                scrolled ? 'text-luxury-black' : 'text-white'
              }`}>
                Solscape
              </span>
              <span className="font-display text-xl md:text-2xl font-light italic text-luxury-accent">Stays</span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-5 py-2 font-body text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 ${
                    isActive(link.href)
                      ? 'text-luxury-accent'
                      : scrolled
                      ? 'text-luxury-black/70 hover:text-luxury-black'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <motion.div layoutId="nav" className="absolute bottom-0 left-4 right-4 h-[2px] bg-luxury-accent rounded-full" />
                  )}
                </Link>
              ))}
              <div className="ml-6 flex items-center gap-3">
                {user ? (
                  <>
                    <Link href="/dashboard" className={`font-body text-xs uppercase tracking-[0.2em] font-medium transition-colors ${
                      scrolled ? 'text-luxury-black/70 hover:text-luxury-black' : 'text-white/70 hover:text-white'
                    }`}>
                      Dashboard
                    </Link>
                    <Magnetic>
                      <button onClick={logout} className="btn-primary !py-2.5 !px-6 text-[10px]">
                        <span>Sign Out</span>
                      </button>
                    </Magnetic>
                  </>
                ) : (
                  <Magnetic>
                    <Link href="/login" className="btn-primary !py-2.5 !px-6 text-[10px]">
                      <span>Sign In</span>
                    </Link>
                  </Magnetic>
                )}
              </div>
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`lg:hidden relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-500 ${
                scrolled
                  ? 'text-luxury-black hover:bg-black/5'
                  : 'text-white bg-white/10 backdrop-blur-sm hover:bg-white/20'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <motion.span animate={mobileOpen ? { rotate: 45, y: 5.5 } : { rotate: 0, y: 0 }} className="block w-5 h-[1.5px] bg-current" />
                <motion.span animate={mobileOpen ? { opacity: 0, x: -4 } : { opacity: 1, x: 0 }} className="block w-5 h-[1.5px] bg-current" />
                <motion.span animate={mobileOpen ? { rotate: -45, y: -5.5 } : { rotate: 0, y: 0 }} className="block w-5 h-[1.5px] bg-current" />
              </div>
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed inset-0 z-[60] bg-white overflow-y-auto"
          >
            <div className="luxury-container flex items-center justify-between h-20 md:h-24">
              <Link href="/" className="flex items-center gap-1.5" onClick={() => setMobileOpen(false)}>
                <span className="font-display text-xl md:text-2xl tracking-tight text-luxury-black">Solscape</span>
                <span className="font-display text-xl md:text-2xl font-light italic text-luxury-accent">Stays</span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-12 h-12 flex items-center justify-center rounded-full text-luxury-black hover:bg-black/5 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="luxury-container flex flex-col gap-2 mt-8">
              {links.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block font-display text-3xl py-4 transition-colors ${
                      isActive(link.href) ? 'text-luxury-accent' : 'text-luxury-black/60 hover:text-luxury-black'
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="pt-6 border-t border-gray-100 mt-4"
              >
                {user ? (
                  <div className="flex flex-col gap-3">
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="font-body text-sm uppercase tracking-widest text-luxury-black/60 py-2">Dashboard</Link>
                    <button onClick={() => { logout(); setMobileOpen(false); }} className="btn-primary w-full text-center"><span>Sign Out</span></button>
                  </div>
                ) : (
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-primary w-full text-center"><span>Sign In</span></Link>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;

