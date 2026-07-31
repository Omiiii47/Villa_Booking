import { motion } from 'framer-motion';
import { FaCompass, FaUtensils, FaSpa, FaCamera, FaWineGlassAlt, FaMountain } from 'react-icons/fa';

const items = [
  { icon: FaCompass, title: 'Guided Explorations', desc: 'Curated excursions led by local experts to hidden gems and breathtaking viewpoints.' },
  { icon: FaUtensils, title: 'Gourmet Dining', desc: 'Private chef experiences featuring locally-sourced ingredients and seasonal menus.' },
  { icon: FaSpa, title: 'Wellness Retreats', desc: 'Holistic wellness programs including yoga, meditation, and spa treatments.' },
  { icon: FaCamera, title: 'Photography Tours', desc: 'Capture unforgettable moments with professional photographer guides.' },
  { icon: FaWineGlassAlt, title: 'Wine Tastings', desc: 'Exclusive tastings of regional wines in stunning cellars and vineyards.' },
  { icon: FaMountain, title: 'Adventure Sports', desc: 'From hiking to water sports, curated adventures for every thrill level.' },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

const Experiences = () => (
  <section className="section-padding bg-luxury-cream">
    <div className="luxury-container">
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
        <span className="section-label">Experiences</span>
        <h2 className="section-title mb-4">Beyond The Villa</h2>
        <p className="section-subtitle mx-auto">Immersive experiences crafted to make your stay truly unforgettable.</p>
      </motion.div>
      <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((exp) => {
          const Icon = exp.icon;
          return (
            <motion.div key={exp.title} variants={item} whileHover={{ y: -6 }} className="text-center group cursor-default">
              <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mx-auto mb-6 group-hover:bg-luxury-accent transition-all duration-700">
                <Icon className="text-2xl text-luxury-black group-hover:text-white transition-colors duration-700" />
              </div>
              <h3 className="font-display text-xl text-luxury-black mb-3">{exp.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">{exp.desc}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  </section>
);

export default Experiences;
