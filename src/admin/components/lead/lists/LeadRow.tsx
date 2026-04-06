import { memo } from 'react';
import type { Lead } from '@/types/externalLeads';
import { formatDate, formatCurrency, STATUS_CONFIG } from '../../../utils/leadHelpers';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import {
    Pencil,
    Trash2,
    Eye,
    Phone,
    Building2,
    // History,
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

interface LeadRowProps {
    lead: Lead;
    index: number;
    canManage: boolean;
    onDetail: (lead: Lead) => void;
    // onHistory: (lead: Lead) => void;
    onEdit: (lead: Lead) => void;
    onDelete: (lead: Lead) => void;
}

const LeadRow = memo(function LeadRow({
    lead,
    index,
    canManage,
    onDetail,
    // onHistory,
    onEdit,
    onDelete,
}: LeadRowProps) {
    const statusCfg = STATUS_CONFIG[lead.appointments.status] || STATUS_CONFIG.pending;
    const StatusIcon = STATUS_ICONS[lead.appointments.status] || Clock;

    const paymentAmount = lead.payments?.amount;
    const commissionAmount = lead.payments?.commission?.totalAmount;

    return (
        <TableRow className="hover:bg-gray-50">
            <TableCell className="text-gray-500 text-sm">{index}</TableCell>
            <TableCell>
                <div>
                    <p className="font-medium text-gray-900">{lead.patient.fullname}</p>
                    {lead.patient.tel && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.patient.tel}
                        </p>
                    )}
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1 text-sm">
                    <Building2 className="h-3 w-3 text-gray-400" />
                    <span>{lead.clinic.name}</span>
                </div>
            </TableCell>
            <TableCell className="text-center">
                <Badge variant="outline" className={statusCfg.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusCfg.label}
                </Badge>
            </TableCell>
            <TableCell className="text-sm text-gray-600">
                {lead.appointments.date ? formatDate(lead.appointments.date) : '-'}
            </TableCell>
            <TableCell className="text-sm text-right">
                {formatCurrency(paymentAmount)}
            </TableCell>
            <TableCell className="text-sm text-right">
                {formatCurrency(commissionAmount)}
            </TableCell>
            <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onDetail(lead)} title="ดูรายละเอียด">
                        <Eye className="h-4 w-4" />
                    </Button>
                    {/* <Button variant="ghost" size="sm" onClick={() => onHistory(lead)} title="ประวัติ">
                        <History className="h-4 w-4" />
                    </Button> */}
                    {canManage && (
                        <>
                            <Button variant="ghost" size="sm" onClick={() => onEdit(lead)} title="แก้ไข">
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => onDelete(lead)}
                                title="ลบ"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
});

export default LeadRow;