'use client'

import UserGuard from '../../../src/components/guards/UserGuard';
import WishlistPage from '../../../src/views/Wishlist';

export default function WishlistRoute() {
  return (
    <UserGuard>
      <WishlistPage />
    </UserGuard>
  );
}
