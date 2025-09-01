/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Download,
    ExternalLink,
    Eye,
    QrCode as QrIcon,
    Trash2,
} from 'lucide-react';
import QRCode from 'react-qr-code';

interface QRCodeTableProps {
    qrCodes: any[];
    loading: boolean;
    error: string | null;
    selectedRestaurantId: string;
    selectedMenuId: string;
    onPreview: (preview: { token: string; table?: string }) => void;
    onDownload: (qrToken: string, table?: string) => void;
    onDelete: (qrCode: any) => void;
}

export function QRCodeTable({
    qrCodes,
    loading,
    error,
    selectedRestaurantId,
    selectedMenuId,
    onPreview,
    onDownload,
    onDelete,
}: QRCodeTableProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-indigo-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">
                    QR Codes ({qrCodes.length})
                </h3>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
                <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-semibold bg-gray-50 text-gray-600">
                    <div className="col-span-3">Created</div>
                    <div className="col-span-1">Table</div>
                    <div className="col-span-4">Token / Link</div>
                    <div className="col-span-2">QR</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                <div>
                    {error && (
                        <div className="p-4 text-red-700 bg-red-50 border border-red-200">
                            {error}
                        </div>
                    )}
                    {!error && qrCodes.length === 0 && !loading && (
                        <div className="p-6 text-center text-gray-500">
                            <QrIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">
                                No QR codes yet.
                            </p>
                            <p className="text-sm">
                                Create your first QR code to get started.
                            </p>
                        </div>
                    )}

                    {qrCodes.map((q) => (
                        <div
                            key={q.id}
                            className="grid grid-cols-12 gap-4 px-4 py-3 border-t border-gray-100 text-sm items-center hover:bg-indigo-50 transition-colors"
                        >
                            <div className="col-span-3 text-gray-800">
                                {new Date(q.createdAt).toLocaleString()}
                            </div>
                            <div className="col-span-1 text-gray-800">
                                {q.tableNumber || '-'}
                            </div>

                            <div className="col-span-4 text-gray-700 truncate flex items-center gap-2">
                                <code className="px-2 py-1 bg-gray-100 rounded text-xs truncate">
                                    {q.qrToken}
                                </code>
                                <a
                                    href={`${
                                        typeof window !== 'undefined'
                                            ? window.location.origin
                                            : ''
                                    }/menu/${selectedMenuId}?qr=${q.qrToken}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-indigo-600 hover:underline flex items-center gap-1"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>

                            <div className="col-span-2 flex items-center gap-3">
                                <div className="p-1 bg-white border rounded">
                                    <div className="w-16 h-16 flex items-center justify-center">
                                        <QRCode
                                            id={`hub-qr-svg-${q.qrToken}`}
                                            value={`${
                                                typeof window !== 'undefined'
                                                    ? window.location.origin
                                                    : ''
                                            }/menu/${selectedMenuId}?qr=${
                                                q.qrToken
                                            }`}
                                            size={64}
                                            viewBox="0 0 256 256"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            onPreview({
                                                token: q.qrToken,
                                                table:
                                                    q.tableNumber || undefined,
                                            })
                                        }
                                        className="text-gray-700 inline-flex items-center gap-1 hover:text-indigo-600 transition-colors"
                                        title="Preview QR Code"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() =>
                                            onDownload(
                                                q.qrToken,
                                                q.tableNumber || undefined
                                            )
                                        }
                                        className="text-gray-700 inline-flex items-center gap-1 hover:text-indigo-600 transition-colors"
                                        title="Download PNG"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="col-span-1 text-right">
                                <button
                                    onClick={() => onDelete(q)}
                                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 hover:underline transition-colors"
                                    title="Delete QR Code"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="p-4 text-center text-gray-500">
                            <div className="flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                                <span className="text-gray-600">
                                    Loading QR codes...
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
