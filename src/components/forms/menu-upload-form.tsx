'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { File, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface MenuUploadFormProps {
    onUpload: (file: File) => void;
    onCancel: () => void;
    loading?: boolean;
}

export function MenuUploadForm({
    onUpload,
    onCancel,
    loading,
}: MenuUploadFormProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            setSelectedFile(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            setSelectedFile(files[0]);
        }
    };

    const handleUpload = () => {
        if (selectedFile) {
            onUpload(selectedFile);
        }
    };

    return (
        <div className="space-y-4">
            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
            >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-sm font-medium text-gray-900">
                        Click to upload
                    </span>{' '}
                    <span className="text-sm text-gray-500">
                        or drag and drop
                    </span>
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX up to 10MB
                </p>
                <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileSelect}
                />
            </div>

            {selectedFile && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <File className="h-5 w-5 text-gray-500" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                {selectedFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)}{' '}
                                MB
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || loading}
                >
                    {loading ? 'Uploading...' : 'Upload Menu'}
                </Button>
            </div>
        </div>
    );
}
