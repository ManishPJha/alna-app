'use client';

import { MenuFormData } from '@/types/menu';
import { Globe } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import QRCode from 'react-qr-code';

interface QRCodeTabProps {
    form: UseFormReturn<MenuFormData>;
}

export function QRCodeTab({ form }: QRCodeTabProps) {
    const menuId = form.watch('id'); // assume your MenuFormData has "id" or "slug"
    const menuUrl = `${
        process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com'
    }/menu/${menuId || 'preview'}`;

    return (
        <div className="p-6 flex flex-col items-center justify-center space-y-6">
            <div className="flex items-center space-x-2 text-gray-600">
                <Globe className="w-5 h-5" />
                <span className="font-medium">{menuUrl}</span>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <QRCode value={menuUrl} size={200} />
            </div>
            <p className="text-sm text-gray-500">
                Scan this QR code to view your menu.
            </p>
        </div>
    );
}
