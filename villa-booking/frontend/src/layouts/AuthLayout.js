import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
