import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

interface QRCodeFormProps {
    newTable: string;
    setNewTable: (value: string) => void;
    bulkTotal: string;
    setBulkTotal: (value: string) => void;
    creating: boolean;
    bulkLoading: boolean;
    selectedMenuId: string;
    onCreateQrCode: () => void;
    onBulkGenerate: () => void;
}

export function QRCodeForm({
    newTable,
    setNewTable,
    bulkTotal,
    setBulkTotal,
    creating,
    bulkLoading,
    selectedMenuId,
    onCreateQrCode,
    onBulkGenerate,
}: QRCodeFormProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Table number
                        </label>
                        <Input
                            placeholder="e.g. 12"
                            value={newTable}
                            onChange={(e) => setNewTable(e.target.value)}
                            className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            onKeyDown={(e) => {
                                if (
                                    e.key === 'Enter' &&
                                    !creating &&
                                    newTable.trim() &&
                                    selectedMenuId
                                ) {
                                    onCreateQrCode();
                                }
                            }}
                        />
                    </div>
                    <div>
                        <Button
                            onClick={onCreateQrCode}
                            disabled={
                                creating || !newTable.trim() || !selectedMenuId
                            }
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {creating ? 'Creating...' : 'Create'}
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bulk generate (total tables 1–25)
                        </label>
                        <Input
                            type="number"
                            min={1}
                            max={25}
                            placeholder="e.g. 10"
                            value={bulkTotal}
                            onChange={(e) => setBulkTotal(e.target.value)}
                            className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            onKeyDown={(e) => {
                                if (
                                    e.key === 'Enter' &&
                                    !bulkLoading &&
                                    bulkTotal &&
                                    selectedMenuId
                                ) {
                                    onBulkGenerate();
                                }
                            }}
                        />
                    </div>
                    <div>
                        <Button
                            onClick={onBulkGenerate}
                            disabled={
                                bulkLoading || !bulkTotal || !selectedMenuId
                            }
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {bulkLoading ? 'Generating...' : 'Generate'}
                        </Button>
                    </div>
                </div>
            </div>

            {!selectedMenuId && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                        Please select a menu to create QR codes. QR codes will
                        link directly to the selected menu.
                    </p>
                </div>
            )}
        </div>
    );
}
