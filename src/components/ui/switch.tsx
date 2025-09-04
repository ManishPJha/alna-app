'use client';

import { cn } from '@/shared/utils';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const switchVariants = cva(
    'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
    {
        variants: {
            variant: {
                default:
                    'data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-indigo-600 data-[state=checked]:to-purple-600 data-[state=unchecked]:bg-gray-200 focus-visible:ring-indigo-500',
                success:
                    'data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-200 focus-visible:ring-green-500',
                warning:
                    'data-[state=checked]:bg-orange-500 data-[state=unchecked]:bg-gray-200 focus-visible:ring-orange-500',
                danger: 'data-[state=checked]:bg-red-500 data-[state=unchecked]:bg-gray-200 focus-visible:ring-red-500',
            },
            size: {
                default: 'h-6 w-11',
                sm: 'h-5 w-9',
                lg: 'h-7 w-12',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

const switchThumbVariants = cva(
    'pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform',
    {
        variants: {
            size: {
                default:
                    'h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
                sm: 'h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
                lg: 'h-6 w-6 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
);

export interface SwitchProps
    extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
        VariantProps<typeof switchVariants> {
    label?: string;
    description?: string;
    labelPosition?: 'left' | 'right';
    showIcon?: boolean;
}

const Switch = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitives.Root>,
    SwitchProps
>(
    (
        {
            className,
            variant,
            size,
            label,
            description,
            labelPosition = 'right',
            showIcon = false,
            ...props
        },
        ref
    ) => {
        const switchElement = (
            <SwitchPrimitives.Root
                className={cn(switchVariants({ variant, size, className }))}
                {...props}
                ref={ref}
            >
                <SwitchPrimitives.Thumb
                    className={cn(switchThumbVariants({ size }))}
                >
                    {showIcon && (
                        <div className="flex items-center justify-center h-full w-full">
                            <div className="data-[state=checked]:block data-[state=unchecked]:hidden">
                                <CheckIcon className="h-3 w-3 text-white" />
                            </div>
                            <div className="data-[state=checked]:hidden data-[state=unchecked]:block">
                                <XIcon className="h-3 w-3 text-gray-400" />
                            </div>
                        </div>
                    )}
                </SwitchPrimitives.Thumb>
            </SwitchPrimitives.Root>
        );

        if (!label) {
            return switchElement;
        }

        return (
            <div className="flex items-center space-x-3">
                {labelPosition === 'left' && (
                    <div className="flex-1">
                        <label
                            htmlFor={props.id}
                            className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                        >
                            {label}
                        </label>
                        {description && (
                            <p className="text-xs text-gray-500 mt-1">
                                {description}
                            </p>
                        )}
                    </div>
                )}

                {switchElement}

                {labelPosition === 'right' && (
                    <div className="flex-1">
                        <label
                            htmlFor={props.id}
                            className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                        >
                            {label}
                        </label>
                        {description && (
                            <p className="text-xs text-gray-500 mt-1">
                                {description}
                            </p>
                        )}
                    </div>
                )}
            </div>
        );
    }
);
Switch.displayName = SwitchPrimitives.Root.displayName;

// Simple icons for the switch (optional)
const CheckIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const XIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
        />
    </svg>
);

export { Switch, switchVariants };
