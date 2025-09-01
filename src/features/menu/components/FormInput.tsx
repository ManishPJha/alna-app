/* eslint-disable @typescript-eslint/no-explicit-any */
interface FormInputProps {
    value: string | number;
    onChange: (value: any) => void;
    placeholder?: string;
    type?: string;
    className?: string;
    [key: string]: any;
}

export function FormInput({
    value,
    onChange,
    placeholder = '',
    type = 'text',
    className = '',
    ...props
}: FormInputProps) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) =>
                onChange(
                    type === 'number'
                        ? parseFloat(e.target.value) || 0
                        : e.target.value
                )
            }
            className={`w-full border border-gray-300 text-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${className}`}
            placeholder={placeholder}
            {...props}
        />
    );
}

interface FormTextareaProps {
    value: string | undefined;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
    [key: string]: any;
}

export function FormTextarea({
    value,
    onChange,
    placeholder = '',
    rows = 3,
    className = '',
    ...props
}: FormTextareaProps) {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className={`w-full border border-gray-300 text-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none ${className}`}
            placeholder={placeholder}
            {...props}
        />
    );
}

interface FormCheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    id: string;
}

export function FormCheckbox({
    checked,
    onChange,
    label,
    id,
}: FormCheckboxProps) {
    return (
        <label
            htmlFor={id}
            className="flex items-center space-x-2 cursor-pointer"
        >
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="h-4 w-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700 font-medium">{label}</span>
        </label>
    );
}
