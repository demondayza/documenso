'use client';

import { motion } from 'framer-motion';

type AnimateGenericFadeInOutProps = {
  children: React.ReactNode;
};

export const AnimateGenericFadeInOut = ({ children }: AnimateGenericFadeInOutProps) => {
  return (
    <motion.section
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
    >
      {children}
    </motion.section>
  );
};
