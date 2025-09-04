"use client";

import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useId } from "react";

interface DatePickerProps {
  label?: string;
  value?: string; // ISO string or empty
  onChange: (iso: string | "") => void;
  placeholder?: string;
}

export function DatePicker({ label, value, onChange, placeholder }: DatePickerProps) {
  const id = useId();
  const dateValue = value ? new Date(value).toISOString().slice(0, 10) : "";

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <Input
          id={id}
          type="date"
          value={dateValue}
          placeholder={placeholder}
          onChange={(e) => {
            const v = e.target.value ? new Date(e.target.value).toISOString() : "";
            onChange(v);
          }}
          className="pl-10 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
}
