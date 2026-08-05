'use client'

import UserGuard from '../../../src/components/guards/UserGuard';
import BookingsPage from '../../../src/views/Bookings';

export default function BookingsRoute() {
  return (
    <UserGuard>
      <BookingsPage />
    </UserGuard>
  );
}
