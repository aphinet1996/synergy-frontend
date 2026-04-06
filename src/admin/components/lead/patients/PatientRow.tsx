import { memo } from 'react';
import type { Patient } from '@/types/externalLeads';
import type { WalletAction } from '../../../utils/patientHelpers';
import { formatCurrency, formatDate } from '../../../utils/patientHelpers';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Eye,
    Pencil,
    Phone,
    ArrowUpCircle,
    ArrowDownCircle,
    RefreshCw,
    MoreHorizontal,
    Settings,
} from 'lucide-react';

interface PatientRowProps {
    patient: Patient;
    canManage: boolean;
    onDetail: (patient: Patient) => void;
    onEdit: (patient: Patient) => void;
    onWallet: (patient: Patient, action: WalletAction) => void;
}

const PatientRow = memo(function PatientRow({
    patient,
    canManage,
    onDetail,
    onEdit,
    onWallet,
}: PatientRowProps) {
    return (
        <TableRow className="hover:bg-gray-50">
            <TableCell>
                <div>
                    <p className="font-medium text-gray-900">{patient.fullname}</p>
                    {patient.nickname && (
                        <p className="text-sm text-gray-500">({patient.nickname})</p>
                    )}
                </div>
            </TableCell>
            <TableCell>
                {patient.tel ? (
                    <span className="flex items-center gap-1.5 text-gray-600">
                        <Phone className="h-3.5 w-3.5" />
                        {patient.tel}
                    </span>
                ) : (
                    <span className="text-gray-400">-</span>
                )}
            </TableCell>
            <TableCell>
                <span className="text-gray-600">{patient.branch || '-'}</span>
            </TableCell>
            <TableCell className="text-right">
                {patient.balance > 0 ? (
                    <Badge className="bg-green-100 text-green-700 font-medium">
                        {formatCurrency(patient.balance)}
                    </Badge>
                ) : (
                    <span className="text-gray-400">฿0</span>
                )}
            </TableCell>
            <TableCell className="text-center text-gray-500 text-sm">
                {formatDate(patient.createdAt)}
            </TableCell>
            <TableCell className="text-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setTimeout(() => onDetail(patient), 0)}>
                            <Eye className="h-4 w-4 mr-2" />
                            ดูรายละเอียด
                        </DropdownMenuItem>
                        {canManage && (
                            <>
                                <DropdownMenuItem onSelect={() => setTimeout(() => onEdit(patient), 0)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    แก้ไข
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => setTimeout(() => onWallet(patient, 'deposit'), 0)}>
                                    <ArrowUpCircle className="h-4 w-4 mr-2 text-green-600" />
                                    เพิ่มมัดจำ
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => setTimeout(() => onWallet(patient, 'use'), 0)}
                                    disabled={patient.balance <= 0}
                                >
                                    <ArrowDownCircle className="h-4 w-4 mr-2 text-red-600" />
                                    ใช้มัดจำ
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => setTimeout(() => onWallet(patient, 'refund'), 0)}
                                    disabled={patient.balance <= 0}
                                >
                                    <RefreshCw className="h-4 w-4 mr-2 text-yellow-600" />
                                    คืนเงิน
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setTimeout(() => onWallet(patient, 'adjust'), 0)}>
                                    <Settings className="h-4 w-4 mr-2 text-blue-600" />
                                    ปรับยอด
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
});

export default PatientRow;