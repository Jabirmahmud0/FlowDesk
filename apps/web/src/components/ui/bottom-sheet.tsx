'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

export function BottomSheet({
    open,
    onOpenChange,
    title,
    description,
    children,
    footer,
    className,
}: BottomSheetProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (open && contentRef.current) {
            setHeight(contentRef.current.scrollHeight);
        }
    }, [open, children]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onOpenChange(false)}
                        className="fixed inset-0 bg-black/50 z-50 md:hidden"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={cn(
                            'fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-2xl md:hidden',
                            'max-h-[90vh] overflow-hidden flex flex-col',
                            className
                        )}
                        style={{ height: open ? 'auto' : 0 }}
                    >
                        {/* Drag Handle */}
                        <div className="flex items-center justify-center pt-3 pb-2">
                            <div className="w-10 h-1.5 bg-muted rounded-full" />
                        </div>

                        {/* Header */}
                        {(title || description) && (
                            <div className="px-4 pb-4 border-b">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        {title && (
                                            <h2 className="text-lg font-semibold">{title}</h2>
                                        )}
                                        {description && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {description}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onOpenChange(false)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Content */}
                        <div
                            ref={contentRef}
                            className="flex-1 overflow-y-auto px-4 py-4"
                        >
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className="px-4 py-3 border-t bg-muted/30">
                                {footer}
                            </div>
                        )}
                    </motion.div>

                    {/* Desktop Dialog (hidden on mobile) */}
                    <div className="hidden md:block">
                        {children}
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

interface BottomSheetTriggerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
    asChild?: boolean;
}

export function BottomSheetTrigger({
    open,
    onOpenChange,
    children,
    asChild,
}: BottomSheetTriggerProps) {
    if (asChild) {
        return (
            <div onClick={() => onOpenChange(!open)}>
                {children}
            </div>
        );
    }

    return (
        <Button variant="outline" onClick={() => onOpenChange(!open)}>
            {children}
        </Button>
    );
}
