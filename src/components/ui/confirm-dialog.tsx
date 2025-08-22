import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
    destructive?: boolean;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    loading = false,
    destructive = false,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={'sm:max-w-[425px] bg-white text-gray-900'}
            >
                <DialogHeader
                    className={
                        destructive
                            ? 'bg-red-50 border-red-100'
                            : 'bg-indigo-50 border-indigo-100'
                    }
                >
                    <div className="flex items-center space-x-3">
                        {destructive && (
                            <div className="bg-red-100 rounded-lg p-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                        )}
                        <DialogTitle
                            className={
                                destructive ? 'text-red-700' : 'text-indigo-700'
                            }
                        >
                            {title}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-600 text-left mt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="bg-gray-50 border-gray-200">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant={destructive ? 'destructive' : 'default'}
                        onClick={onConfirm}
                        disabled={loading}
                        className={
                            destructive
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Processing...
                            </div>
                        ) : (
                            confirmText
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
