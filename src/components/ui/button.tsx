import { cn } from '@/shared/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const buttonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transform hover:-translate-y-1 shadow-lg hover:shadow-xl',
    {
        variants: {
            variant: {
                default:
                    'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800',
                destructive:
                    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
                outline:
                    'border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100',
                secondary:
                    'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300',
                ghost: 'hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 shadow-none hover:shadow-md transform-none hover:translate-y-0',
                link: 'text-indigo-600 underline-offset-4 hover:underline shadow-none transform-none hover:translate-y-0',
                success:
                    'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
                warning:
                    'bg-yellow-600 text-white hover:bg-yellow-700 active:bg-yellow-800',
                purple: 'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 rounded-lg px-3',
                lg: 'h-11 rounded-xl px-8',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
