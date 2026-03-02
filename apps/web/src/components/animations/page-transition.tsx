'use client';

import { motion } from 'framer-motion';

import React from 'react';

const pageVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
};

const pageTransition = {
    type: 'tween' as const,
    ease: 'easeInOut' as const,
    duration: 0.2,
};

export function PageTransition({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            variants={pageVariants}
            transition={pageTransition}
            className="h-full"
        >
            {children}
        </motion.div>
    );
}

// Staggered list animation wrapper
export function StaggeredList({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            variants={{
                initial: {},
                animate: { transition: { staggerChildren: 0.05 } },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export const staggeredItem = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

// Card hover animation
export function AnimatedCard({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
