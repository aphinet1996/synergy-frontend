import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  RefreshCw,
  Building2,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useClinicStore } from '@/stores/clinicStore';
import { ClinicDialog } from '@/components/clinic/ClinicDialog';

export default function ClinicManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<any>(null);
  const [deleteClinicId, setDeleteClinicId] = useState<string | null>(null);

  const { clinics, loading, fetchClinics } = useClinicStore();

  useEffect(() => {
    fetchClinics({ limit: 100 });
  }, [fetchClinics]);

  // Filtered clinics
  const filteredClinics = useMemo(() => {
    if (!searchQuery) return clinics;
    const searchLower = searchQuery.toLowerCase();
    return clinics.filter(
      (clinic) =>
        clinic.name.th?.toLowerCase().includes(searchLower) ||
        clinic.name.en?.toLowerCase().includes(searchLower)
    );
  }, [clinics, searchQuery]);

  const handleEdit = (clinic: any) => {
    setEditingClinic(clinic);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteClinicId) {
      // Call delete API
      // await clinicService.deleteClinic(deleteClinicId);
      console.log('Delete clinic:', deleteClinicId);
      setDeleteClinicId(null);
      fetchClinics({ limit: 100 });
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingClinic(null);
  };

  const handleSuccess = () => {
    fetchClinics({ limit: 100 });
    handleDialogClose();
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clinics.length}</p>
                <p className="text-sm text-gray-500">คลินิกทั้งหมด</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {clinics.filter((c) => c.clinicLevel === 'premium').length}
                </p>
                <p className="text-sm text-gray-500">Premium</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {clinics.filter((c) => c.clinicLevel === 'standard').length}
                </p>
                <p className="text-sm text-gray-500">Standard</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Building2 className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {clinics.filter((c) => c.clinicLevel === 'basic').length}
                </p>
                <p className="text-sm text-gray-500">Basic</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="ค้นหาชื่อคลินิก..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Refresh */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchClinics({ limit: 100 })}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>

        {/* Add Clinic */}
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มคลินิก
        </Button>
      </div>

      {/* Results Info */}
      <div className="text-sm text-gray-500">
        แสดง {filteredClinics.length} จาก {clinics.length} คลินิก
      </div>

      {/* Clinics Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredClinics.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">ไม่พบคลินิก</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>คลินิก</TableHead>
                  <TableHead>ระดับ</TableHead>
                  <TableHead>สัญญา</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClinics.map((clinic) => (
                  <TableRow key={clinic.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-lg">
                          <AvatarImage src={clinic.clinicProfile} />
                          <AvatarFallback className="rounded-lg">
                            {(clinic.name.th || clinic.name.en)?.[0] || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {clinic.name.th || clinic.name.en}
                          </p>
                          {clinic.name.en && clinic.name.th && (
                            <p className="text-sm text-gray-500">{clinic.name.en}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          clinic.clinicLevel === 'premium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : clinic.clinicLevel === 'standard'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }
                      >
                        {clinic.clinicLevel || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>
                          {clinic.contractDateEnd
                            ? new Date(clinic.contractDateEnd).toLocaleDateString('th-TH')
                            : '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-100 text-green-700">
                        ใช้งานอยู่
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>จัดการ</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link to={`/clinic/${clinic.id}`}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              ดูรายละเอียด
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(clinic)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            แก้ไข
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteClinicId(clinic.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            ลบ
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Clinic Dialog */}
      <ClinicDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteClinicId} onOpenChange={() => setDeleteClinicId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบคลินิกนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
              และจะลบข้อมูลที่เกี่ยวข้องทั้งหมด
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}