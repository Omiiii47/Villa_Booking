import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import About from './pages/About';
import Villas from './pages/Villas';
import VillaDetails from './pages/VillaDetails';
import Booking from './pages/Booking';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import WishlistPage from './pages/Wishlist';
import BookingsPage from './pages/Bookings';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import AnimatedOutlet from './components/AnimatedOutlet';
import ScrollToTop from './components/ScrollToTop';
import Cursor from './components/Cursor';
import SmoothScroll from './components/SmoothScroll';
import WhatsAppButton from './components/WhatsAppButton';

function AppContent() {
  const location = useLocation();

  return (
    <AnimatedOutlet location={location}>
      <Routes location={location}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="villas" element={<Villas />} />
          <Route path="villas/:slug" element={<VillaDetails />} />
          <Route path="booking" element={<Booking />} />
          <Route path="contact" element={<Contact />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </AnimatedOutlet>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Cursor />
      <SmoothScroll />
      <div className="noise-overlay" />
      <AuthProvider>
        <WishlistProvider>
          <AppContent />
        </WishlistProvider>
      </AuthProvider>
      <WhatsAppButton />
    </BrowserRouter>
  );
}

export default App;
