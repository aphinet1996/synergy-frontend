import { useState, useEffect, useRef } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type RowSelectionState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { type Employee, employeeColumns } from './employee-columns';

interface EmployeeTableProps {
  selectedEmployees: string[];
  onSelectionChange: (selected: string[]) => void;
}

// Mock data
const mockEmployees: Employee[] = [
  { id: '1', name: 'สมชาย ใจดี', position: 'Account Manager', contractType: 'Full-time', clinicCount: 5 },
  { id: '2', name: 'สมหญิง รักสงบ', position: 'Marketing Specialist', contractType: 'Full-time', clinicCount: 3 },
  { id: '3', name: 'วิชัย มั่นคง', position: 'Designer', contractType: 'Part-time', clinicCount: 2 },
  { id: '4', name: 'อรทัย สุขสันต์', position: 'Content Creator', contractType: 'Freelance', clinicCount: 4 },
  { id: '5', name: 'ประยุทธ ทองดี', position: 'Video Editor', contractType: 'Full-time', clinicCount: 6 },
  { id: '6', name: 'สุดารัตน์ แสงทอง', position: 'Social Media Manager', contractType: 'Full-time', clinicCount: 7 },
  { id: '7', name: 'ณัฐพล วงศ์ใหญ่', position: 'Web Developer', contractType: 'Full-time', clinicCount: 4 },
  { id: '8', name: 'พิมพ์ใจ สว่างวงษ์', position: 'Graphic Designer', contractType: 'Part-time', clinicCount: 3 },
];

export function EmployeeTable({ selectedEmployees, onSelectionChange }: EmployeeTableProps) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const previousSelectionRef = useRef<string>('');

  // Initialize row selection from selectedEmployees
  useEffect(() => {
    const selection: RowSelectionState = {};
    selectedEmployees.forEach((id) => {
      const index = mockEmployees.findIndex((emp) => emp.id === id);
      if (index !== -1) {
        selection[index] = true;
      }
    });
    setRowSelection(selection);
  }, []); // เรียกแค่ครั้งเดียวตอน mount

  const table = useReactTable({
    data: mockEmployees,
    columns: employeeColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      rowSelection,
      globalFilter,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId);
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    },
  });

  // Update parent component when selection changes
  useEffect(() => {
    const selectedRows = table.getSelectedRowModel().rows;
    const selectedIds = selectedRows.map((row) => row.original.id);
    const currentSelection = selectedIds.sort().join(',');

    // เช็คว่าค่าเปลี่ยนจริงๆ ก่อนเรียก callback
    if (currentSelection !== previousSelectionRef.current) {
      previousSelectionRef.current = currentSelection;
      onSelectionChange(selectedIds);
    }
  }, [rowSelection]); // ลบ table และ onSelectionChange ออก

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="ค้นหาพนักงาน..."
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={employeeColumns.length}
                  className="h-24 text-center"
                >
                  ไม่พบพนักงาน
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Selected Count */}
      {table.getSelectedRowModel().rows.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            เลือกแล้ว {table.getSelectedRowModel().rows.length} จาก{' '}
            {table.getFilteredRowModel().rows.length} คน
          </div>
        </div>
      )}
    </div>
  );
}