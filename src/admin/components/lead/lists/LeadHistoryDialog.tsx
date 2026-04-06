import { useLeadsStore } from '@/stores/externalLeadsStore';
import type { Lead } from '@/types/externalLeads';
import { formatDate, STATUS_CONFIG } from '../../../utils/leadHelpers';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    History,
    Clock,
    Calendar,
    CheckCircle2,
    XCircle,
    RefreshCw,
} from 'lucide-react';

const STATUS_ICONS: Record<string, React.ComponentType<any>> = {
    pending: Clock,
    scheduled: Calendar,
    rescheduled: RefreshCw,
    arrived: CheckCircle2,
    cancelled: XCircle,
};

interface LeadHistoryDialogProps {
    open: boolean;
    lead: Lead | null;
    onClose: () => void;
}

export default function LeadHistoryDialog({
    open,
    lead,
    onClose,
}: LeadHistoryDialogProps) {
    const rawHistory = useLeadsStore((s) => s.leadHistory);
    const leadHistory = Array.isArray(rawHistory) ? rawHistory : [];

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-blue-600" />
                        ประวัติการนัด - {lead?.patient.fullname}
                    </DialogTitle>
                    <DialogDescription className="sr-only">ประวัตินัดหมาย</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {leadHistory.map((historyLead, index) => {
                        const cfg = STATUS_CONFIG[historyLead.appointments.status] || STATUS_CONFIG.pending;
                        const Icon = STATUS_ICONS[historyLead.appointments.status] || Clock;

                        return (
                            <div
                                key={historyLead._id}
                                className={`p-4 rounded-lg border ${historyLead._id === lead?._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-500">#{index + 1}</span>
                                    <Badge variant="outline" className={cfg.color}>
                                        <Icon className="h-3 w-3 mr-1" />
                                        {cfg.label}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500 text-xs">วันนัด</p>
                                        <p className="font-medium">{formatDate(historyLead.appointments.date)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">สร้างเมื่อ</p>
                                        <p className="font-medium">{formatDate(historyLead.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs">หมายเหตุ</p>
                                        <p className="font-medium">{historyLead.appointments.note || historyLead.note || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {leadHistory.length === 0 && (
                        <p className="text-center text-gray-500 py-8">ไม่พบประวัติการนัด</p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>ปิด</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}