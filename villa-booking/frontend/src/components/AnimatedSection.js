import { motion } from 'framer-motion';

const AnimatedSection = ({ children, className = '', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.6, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export const AnimatedText = ({ children, className = '', delay = 0, as: Tag = 'span' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
  >
    <Tag className={className}>{children}</Tag>
  </motion.div>
);

export const ScaleIn = ({ children, className = '', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export default AnimatedSection;
