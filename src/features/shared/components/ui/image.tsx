'use client';

import { cn } from '@/shared/utils';
import Image, { ImageProps } from 'next/image';

interface AppImageProps extends ImageProps {
    rounded?: boolean;
    withBorder?: boolean;
    shadow?: boolean;
}

export default function AppImage({
    rounded = true,
    withBorder = false,
    shadow = false,
    className,
    ...props
}: AppImageProps) {
    return (
        <div
            className={cn(
                'relative overflow-hidden',
                rounded && 'rounded-2xl',
                withBorder && 'border-2 border-indigo-700',
                shadow && 'shadow-lg shadow-indigo-700/40',
                className
            )}
        >
            <Image
                {...props}
                alt={props.alt ?? 'App image'}
                className={cn(
                    'object-cover',
                    rounded && 'rounded-2xl',
                    className
                )}
            />
        </div>
    );
}
