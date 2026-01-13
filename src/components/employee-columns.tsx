import { type ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';

export interface Employee {
  id: string;
  name: string;
  position: string;
  contractType: string;
  clinicCount: number;
}

export const employeeColumns: ColumnDef<Employee>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="เลือกทั้งหมด"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="เลือกแถว"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'ชื่อ-นามสกุล',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'position',
    header: 'ตำแหน่ง',
  },
  {
    accessorKey: 'contractType',
    header: 'ประเภทสัญญา',
    cell: ({ row }) => {
      const contractType = row.getValue('contractType') as string;
      const colorMap: Record<string, string> = {
        'Full-time': 'bg-green-100 text-green-800',
        'Part-time': 'bg-blue-100 text-blue-800',
        Freelance: 'bg-purple-100 text-purple-800',
      };

      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            colorMap[contractType] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {contractType}
        </span>
      );
    },
  },
  {
    accessorKey: 'clinicCount',
    header: () => <div className="text-right">จำนวนคลินิกที่ดูแล</div>,
    cell: ({ row }) => {
      const count = row.getValue('clinicCount') as number;
      return <div className="text-right">{count}</div>;
    },
  },
];