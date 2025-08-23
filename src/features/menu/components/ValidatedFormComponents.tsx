import { MenuFormData } from '@/types/menu';
import { FieldError, UseFormReturn } from 'react-hook-form';

interface ValidatedInputProps {
    name: string;
    form: UseFormReturn<MenuFormData>;
    label: string;
    placeholder?: string;
    type?: string;
    required?: boolean;
    maxLength?: number;
    className?: string;
    step?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rules?: any;
}

export function ValidatedInput({
    name,
    form,
    label,
    placeholder = '',
    type = 'text',
    required = false,
    maxLength,
    className = '',
    step,
    rules = {},
}: ValidatedInputProps) {
    const error = form.formState.errors[
        name as keyof MenuFormData
    ] as FieldError;
    const value = form.watch(name as keyof MenuFormData);

    // Build validation rules
    const validationRules = {
        required: required ? `${label} is required` : false,
        maxLength: maxLength
            ? {
                  value: maxLength,
                  message: `${label} cannot exceed ${maxLength} characters`,
              }
            : undefined,
        pattern:
            type === 'color'
                ? {
                      value: /^#[0-9A-Fa-f]{6}$/,
                      message: 'Please enter a valid hex color (e.g., #1f2937)',
                  }
                : undefined,
        min:
            type === 'number'
                ? {
                      value: 0,
                      message: `${label} cannot be negative`,
                  }
                : undefined,
        max:
            type === 'number'
                ? {
                      value: 99999,
                      message: `${label} cannot exceed 99,999`,
                  }
                : undefined,
        ...rules,
    };

    return (
        <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <input
                    type={type}
                    step={step}
                    {...form.register(
                        name as keyof MenuFormData,
                        validationRules
                    )}
                    className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                        error
                            ? 'border-red-500 bg-red-50 text-red-900 placeholder-red-400'
                            : 'border-gray-300 text-black'
                    } ${className}`}
                    placeholder={placeholder}
                />
                {maxLength && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                        {String(value || '').length}/{maxLength}
                    </div>
                )}
            </div>
            {error && (
                <p className="text-red-500 text-sm flex items-center">
                    <span className="mr-1">⚠</span>
                    {error.message}
                </p>
            )}
        </div>
    );
}

interface ValidatedTextareaProps {
    name: string;
    form: UseFormReturn<MenuFormData>;
    label: string;
    placeholder?: string;
    required?: boolean;
    maxLength?: number;
    rows?: number;
    className?: string;
}

export function ValidatedTextarea({
    name,
    form,
    label,
    placeholder = '',
    required = false,
    maxLength,
    rows = 3,
    className = '',
}: ValidatedTextareaProps) {
    const error = form.formState.errors[
        name as keyof MenuFormData
    ] as FieldError;
    const value = form.watch(name as keyof MenuFormData);

    const validationRules = {
        required: required ? `${label} is required` : false,
        maxLength: maxLength
            ? {
                  value: maxLength,
                  message: `${label} cannot exceed ${maxLength} characters`,
              }
            : undefined,
    };

    return (
        <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <textarea
                    rows={rows}
                    {...form.register(
                        name as keyof MenuFormData,
                        validationRules
                    )}
                    className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none ${
                        error
                            ? 'border-red-500 bg-red-50 text-red-900 placeholder-red-400'
                            : 'border-gray-300 text-black'
                    } ${className}`}
                    placeholder={placeholder}
                />
                {maxLength && (
                    <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                        {String(value || '').length}/{maxLength}
                    </div>
                )}
            </div>
            {error && (
                <p className="text-red-500 text-sm flex items-center">
                    <span className="mr-1">⚠</span>
                    {error.message}
                </p>
            )}
        </div>
    );
}

interface ValidatedSelectProps {
    name: string;
    form: UseFormReturn<MenuFormData>;
    label: string;
    required?: boolean;
    options: { value: string; label: string }[];
    placeholder?: string;
    className?: string;
}

export function ValidatedSelect({
    name,
    form,
    label,
    required = false,
    options,
    placeholder = 'Select an option',
    className = '',
}: ValidatedSelectProps) {
    const error = form.formState.errors[
        name as keyof MenuFormData
    ] as FieldError;

    const validationRules = {
        required: required ? `${label} is required` : false,
    };

    return (
        <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
                {...form.register(name as keyof MenuFormData, validationRules)}
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                    error
                        ? 'border-red-500 bg-red-50 text-red-900'
                        : 'border-gray-300 text-black'
                } ${className}`}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="text-red-500 text-sm flex items-center">
                    <span className="mr-1">⚠</span>
                    {error.message}
                </p>
            )}
            {options.length === 0 && (
                <p className="text-amber-600 text-sm flex items-center">
                    <span className="mr-1">⚠</span>
                    No options available
                </p>
            )}
        </div>
    );
}
