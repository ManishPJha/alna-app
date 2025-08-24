'use client';

import { Button } from '@/components/ui/button';
import { appConfig } from '@/config/appConfig';
import { MenuFormData } from '@/types/menu';
import { Download, Globe, Share2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import QRCode from 'react-qr-code';

interface QRCodeTabProps {
    form: UseFormReturn<MenuFormData>;
}

export function QRCodeTab({ form }: QRCodeTabProps) {
    const menuId = form.watch('id');
    const menuName = form.watch('name');
    const restaurantId = form.watch('restaurantId');

    // Generate menu URL - use different strategies based on available data
    const getMenuUrl = () => {
        const baseUrl = appConfig.appBaseUrl || 'https://yourapp.com';

        if (menuId) {
            return `${baseUrl}/menu/${menuId}`;
        } else if (restaurantId) {
            return `${baseUrl}/restaurant/${restaurantId}/menu`;
        } else {
            return `${baseUrl}/menu/preview`;
        }
    };

    const menuUrl = getMenuUrl();

    const downloadQRCode = () => {
        const svg = document.getElementById('menu-qr-code');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);

            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `${menuName || 'menu'}-qr-code.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    const shareQRCode = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `QR Code for ${menuName || 'Menu'}`,
                    text: 'Scan this QR code to view our menu',
                    url: menuUrl,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            // Fallback: copy URL to clipboard
            try {
                await navigator.clipboard.writeText(menuUrl);
                alert('Menu URL copied to clipboard!');
            } catch (error) {
                console.log('Could not copy URL:', error);
            }
        }
    };

    return (
        <div className="p-6">
            <div className="max-w-md mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        QR Code for Your Menu
                    </h3>
                    <p className="text-sm text-gray-600">
                        Customers can scan this code to view your menu instantly
                    </p>
                </div>

                {/* URL Display */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-gray-600 mb-2">
                        <Globe className="w-4 h-4" />
                        <span className="text-sm font-medium">Menu URL:</span>
                    </div>
                    <div className="bg-white rounded border p-2">
                        <p className="text-xs text-gray-800 break-all font-mono">
                            {menuUrl}
                        </p>
                    </div>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                    <div className="bg-white p-6 rounded-xl shadow-lg border">
                        <QRCode
                            id="menu-qr-code"
                            value={menuUrl}
                            size={200}
                            level="M"
                            fgColor="#1f2937"
                            bgColor="#ffffff"
                        />
                    </div>
                </div>

                {/* Instructions */}
                <div className="text-center text-sm text-gray-500">
                    {menuId ? (
                        <p>
                            This QR code links directly to your published menu
                        </p>
                    ) : restaurantId ? (
                        <p>
                            This QR code will link to your menu once it&apos;s
                            saved
                        </p>
                    ) : (
                        <p className="text-amber-600">
                            Complete the menu setup to generate a functional QR
                            code
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={downloadQRCode}
                        className="flex-1"
                        disabled={!restaurantId}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={shareQRCode}
                        className="flex-1"
                        disabled={!restaurantId}
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                </div>

                {/* Usage Tips */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">
                        Usage Tips:
                    </h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Print and place on tables for easy access</li>
                        <li>
                            • Add to business cards or promotional materials
                        </li>
                        <li>• Share on social media or websites</li>
                        <li>• Works on any smartphone camera app</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
