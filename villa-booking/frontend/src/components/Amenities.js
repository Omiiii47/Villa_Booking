import { motion } from 'framer-motion';
import { FaSwimmer, FaUtensils, FaSpa, FaWineBottle, FaUmbrellaBeach, FaPray } from 'react-icons/fa';

const items = [
  { icon: FaSwimmer, name: 'Infinity Pool', desc: 'Heated infinity edge pool with panoramic views' },
  { icon: FaUtensils, name: 'Private Chef', desc: 'In-villa dining with personal chef service' },
  { icon: FaSpa, name: 'Spa & Wellness', desc: 'Full-service spa with massage and treatments' },
  { icon: FaWineBottle, name: 'Wine Cellar', desc: 'Curated wine selection and sommelier service' },
  { icon: FaUmbrellaBeach, name: 'Private Beach', desc: 'Exclusive beach access with loungers' },
  { icon: FaPray, name: 'Yoga Pavilion', desc: 'Daily yoga and meditation sessions' },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

const Amenities = () => (
  <section className="section-padding">
    <div className="luxury-container">
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
        <span className="section-label">Amenities</span>
        <h2 className="section-title mb-4">The Finest Experiences</h2>
        <p className="section-subtitle mx-auto">Every villa is curated with world-class amenities designed to elevate your stay.</p>
      </motion.div>
      <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((a) => {
          const Icon = a.icon;
          return (
            <motion.div key={a.name} variants={item} whileHover={{ y: -6 }} className="group card-premium p-8 cursor-default">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-luxury-accent/20 to-luxury-accent/5 flex items-center justify-center mb-5 group-hover:from-luxury-accent group-hover:to-luxury-accent/80 transition-all duration-500">
                <Icon className="text-xl text-luxury-accent group-hover:text-white transition-colors duration-500" />
              </div>
              <h3 className="font-display text-lg text-luxury-black mb-2">{a.name}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{a.desc}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  </section>
);

export default Amenities;
