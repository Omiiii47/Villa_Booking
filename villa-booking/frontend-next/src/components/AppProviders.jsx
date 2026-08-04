'use client'

import { UserAuthProvider } from '../context/UserAuthContext';
import { AdminAuthProvider } from '../context/AdminAuthContext';
import { WishlistProvider } from '../context/WishlistContext';
import ScrollToTop from './ScrollToTop';
import Cursor from './Cursor';
import SmoothScroll from './SmoothScroll';
import WhatsAppButton from './WhatsAppButton';

const AppProviders = ({ children }) => {
  return (
    <UserAuthProvider>
      <AdminAuthProvider>
        <WishlistProvider>
          <ScrollToTop />
          <Cursor />
          <SmoothScroll />
          <div className="noise-overlay" />
          {children}
          <WhatsAppButton />
        </WishlistProvider>
      </AdminAuthProvider>
    </UserAuthProvider>
  );
};

export default AppProviders;
