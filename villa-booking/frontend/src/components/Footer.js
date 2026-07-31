import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowRight, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';

const links = [
  { title: 'Navigation', items: [
    { to: '/', label: 'Home' }, { to: '/villas', label: 'Our Villas' },
    { to: '/about', label: 'About Us' }, { to: '/contact', label: 'Contact' },
  ]},
  { title: 'Villa Types', items: [
    { to: '/villas', label: 'Beachfront' }, { to: '/villas', label: 'Mountain' },
    { to: '/villas', label: 'Forest' }, { to: '/villas', label: 'Desert' },
  ]},
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-luxury-black text-white">
      <div className="luxury-container py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h3 className="font-display text-2xl mb-3">Serenity<span className="text-luxury-accent">Escapes</span></h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-sm mb-8">
                Curating extraordinary villa experiences for discerning travelers who seek the exceptional.
              </p>
              <div className="flex gap-6">
                {['Instagram', 'Twitter', 'Facebook', 'Pinterest'].map((s) => (
                  <a key={s} href="#/" className="text-gray-600 hover:text-luxury-accent text-xs uppercase tracking-widest transition-colors">{s}</a>
                ))}
              </div>
            </motion.div>
          </div>
          {links.map((col) => (
            <div key={col.title}>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h4 className="font-display text-base mb-6">{col.title}</h4>
                <div className="flex flex-col gap-3">
                  {col.items.map((link) => (
                    <Link key={link.label} to={link.to}
                      className="text-gray-500 hover:text-luxury-accent text-sm transition-colors flex items-center gap-2 group">
                      <FaArrowRight className="text-[10px] opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                      {link.label}
                    </Link>
                  ))}
                </div>
              </motion.div>
            </div>
          ))}
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h4 className="font-display text-base mb-6">Contact</h4>
              <div className="flex flex-col gap-4 text-sm">
                <div className="flex items-start gap-3 text-gray-500"><FaMapMarkerAlt className="text-luxury-accent mt-1 shrink-0" /> 123 Luxury Lane, Paradise Valley, AZ 85253</div>
                <div className="flex items-center gap-3 text-gray-500"><FaPhone className="text-luxury-accent shrink-0" /> +1 (555) 123-4567</div>
                <div className="flex items-center gap-3 text-gray-500"><FaEnvelope className="text-luxury-accent shrink-0" /> concierge@serenityescapes.com</div>
              </div>
            </motion.div>
          </div>
        </div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-600 text-xs"
        >
          <p>&copy; {year} Serenity Escapes. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="#/" className="hover:text-luxury-accent transition-colors">Privacy Policy</Link>
            <Link to="#/" className="hover:text-luxury-accent transition-colors">Terms of Service</Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
