'use client'
import { motion } from 'framer-motion';

const SplitText = ({ text, as: Tag = 'span', className = '', delay = 0, stagger = 0.02, type = 'word' }) => {
  const items = type === 'word' ? text.split(' ') : text.split('');

  const container = {
    hidden: { opacity: 1 },
    show: { opacity: 1, transition: { staggerChildren: stagger, delayChildren: delay } },
  };

  const child = {
    hidden: { y: 40, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
  };

  return (
    <motion.span variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }} className={`inline-flex flex-wrap ${className}`}>
      <Tag className="sr-only">{text}</Tag>
      {items.map((item, i) => (
        <motion.span
          key={i}
          variants={child}
          className="inline-block"
          style={type === 'word' ? { marginRight: '0.3em' } : {}}
          aria-hidden
        >
          {item}
        </motion.span>
      ))}
    </motion.span>
  );
};

export const CharSplit = ({ text, ...props }) => <SplitText {...props} text={text} type="char" />;
export const WordSplit = ({ text, ...props }) => <SplitText {...props} text={text} type="word" />;

export default SplitText;

