'use client'

import { AuthProvider } from '../context/AuthContext';
import { WishlistProvider } from '../context/WishlistContext';
import ScrollToTop from './ScrollToTop';
import Cursor from './Cursor';
import SmoothScroll from './SmoothScroll';
import WhatsAppButton from './WhatsAppButton';

const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <WishlistProvider>
        <ScrollToTop />
        <Cursor />
        <SmoothScroll />
        <div className="noise-overlay" />
        {children}
        <WhatsAppButton />
      </WishlistProvider>
    </AuthProvider>
  );
};

export default AppProviders;
