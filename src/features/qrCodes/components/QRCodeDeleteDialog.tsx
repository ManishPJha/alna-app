import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface QRCode {
    id: string;
    qrToken: string;
    tableNumber?: string;
    createdAt: string;
}

interface QRCodeDeleteDialogProps {
    deleteTarget: QRCode | null;
    deleting: boolean;
    onClose: () => void;
    onDelete: (id: string) => void;
}

export function QRCodeDeleteDialog({
    deleteTarget,
    deleting,
    onClose,
    onDelete,
}: QRCodeDeleteDialogProps) {
    if (!deleteTarget) return null;

    const description = `This will permanently remove the QR for Table ${deleteTarget.tableNumber || '-'}. You can't undo this action.

Token: ${deleteTarget.qrToken}
Created: ${new Date(deleteTarget.createdAt).toLocaleString()}`;

    return (
        <ConfirmDialog
            open={!!deleteTarget}
            onOpenChange={onClose}
            onConfirm={() => onDelete(deleteTarget.id)}
            title="Delete QR Code"
            description={description}
            confirmText="Delete QR Code"
            cancelText="Cancel"
            loading={deleting}
            destructive={true}
        />
    );
} 