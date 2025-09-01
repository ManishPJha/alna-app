import { Button } from '@/components/ui/button';
import QRCode from 'react-qr-code';

interface QRCodePreviewProps {
    preview: {
        token: string;
        table?: string;
    } | null;
    selectedMenuId: string;
    onClose: () => void;
    onDownload: (qrToken: string, table?: string) => void;
}

export function QRCodePreview({
    preview,
    selectedMenuId,
    onClose,
    onDownload,
}: QRCodePreviewProps) {
    if (!preview) return null;

    const menuUrl = `${
        typeof window !== 'undefined' ? window.location.origin : ''
    }/menu/${selectedMenuId}?qr=${preview.token}`;

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold mb-4 text-black">
                    QR Code {preview.table ? `(Table ${preview.table})` : ''}
                </h3>

                <div className="text-center mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                        Scan to access menu directly
                    </p>
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border break-all">
                        {menuUrl}
                    </div>
                </div>

                <div className="flex items-center justify-center p-4 border rounded-lg mb-4 bg-white">
                    <QRCode
                        id={`hub-qr-svg-${preview.token}`}
                        value={menuUrl}
                        size={240}
                        viewBox="0 0 256 256"
                        level="M"
                        // includeMargin={true}
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => onDownload(preview.token, preview.table)}
                    >
                        Download PNG
                    </Button>
                </div>
            </div>
        </div>
    );
}
