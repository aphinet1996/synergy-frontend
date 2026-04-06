import { useLeadsStore } from '@/stores/externalLeadsStore';
import type { Lead } from '@/types/externalLeads';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, Loader2 } from 'lucide-react';

interface LeadDeleteDialogProps {
    open: boolean;
    lead: Lead | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function LeadDeleteDialog({
    open,
    lead,
    onClose,
    onSuccess,
}: LeadDeleteDialogProps) {
    const isSubmitting = useLeadsStore((s) => s.isSubmitting);
    const deleteLead = useLeadsStore((s) => s.deleteLead);

    const handleDelete = async () => {
        if (!lead) return;
        const success = await deleteLead(lead._id, lead.clinic.clinicId);
        if (success) {
            onClose();
            onSuccess();
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <Trash2 className="h-5 w-5" />
                        ยืนยันการลบ Lead
                    </DialogTitle>
                    <DialogDescription className="sr-only">ยืนยันการลบ</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-gray-700">
                        ต้องการลบ Lead ของ <span className="font-semibold">{lead?.patient.fullname}</span> หรือไม่?
                    </p>
                    <p className="text-sm text-gray-500 mt-2">การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>ยกเลิก</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        ยืนยันลบ
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}