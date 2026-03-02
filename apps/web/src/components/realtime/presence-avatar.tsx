'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface PresenceAvatarProps {
    userId: string;
    name?: string;
    avatarUrl?: string | null;
    showTooltip?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function PresenceAvatar({
    userId,
    name,
    avatarUrl,
    showTooltip = true,
    size = 'md',
}: PresenceAvatarProps) {
    const sizeClasses = {
        sm: 'w-6 h-6 text-xs',
        md: 'w-8 h-8 text-sm',
        lg: 'w-10 h-10 text-base',
    };

    const fallback = name?.charAt(0).toUpperCase() || userId.charAt(0).toUpperCase();

    const avatar = (
        <Avatar className={cn(sizeClasses[size], 'ring-2 ring-background')}>
            <AvatarImage src={avatarUrl || undefined} alt={name || userId} />
            <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
    );

    if (!showTooltip || !name) {
        return avatar;
    }

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>{avatar}</TooltipTrigger>
                <TooltipContent>
                    <p>{name}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
