'use client'

import { UserAuthProvider } from '../context/UserAuthContext';
import { AdminAuthProvider } from '../context/AdminAuthContext';
import { SalesAuthProvider } from '../context/SalesAuthContext';
import { WishlistProvider } from '../context/WishlistContext';
import ScrollToTop from './ScrollToTop';
import Cursor from './Cursor';
import SmoothScroll from './SmoothScroll';
import WhatsAppButton from './WhatsAppButton';

const AppProviders = ({ children }) => {
  return (
    <UserAuthProvider>
      <AdminAuthProvider>
        <SalesAuthProvider>
          <WishlistProvider>
            <ScrollToTop />
            <Cursor />
            <SmoothScroll />
            <div className="noise-overlay" />
            {children}
            <WhatsAppButton />
          </WishlistProvider>
        </SalesAuthProvider>
      </AdminAuthProvider>
    </UserAuthProvider>
  );
};

export default AppProviders;
