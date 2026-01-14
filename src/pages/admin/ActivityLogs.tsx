import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarIcon,
  Search,
  RefreshCw,
  Download,
  UserPlus,
  LogIn,
  LogOut,
  Pencil,
  Trash2,
  Settings,
  Eye,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityLog {
  id: string;
  action: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'settings';
  resource: string;
  description: string;
  user: {
    id: string;
    name: string;
  };
  ip: string;
  userAgent: string;
  timestamp: string;
}

const actionConfig: Record<
  ActivityLog['action'],
  { label: string; icon: React.ReactNode; color: string }
> = {
  login: { label: 'เข้าสู่ระบบ', icon: <LogIn className="h-4 w-4" />, color: 'bg-green-100 text-green-700' },
  logout: { label: 'ออกจากระบบ', icon: <LogOut className="h-4 w-4" />, color: 'bg-gray-100 text-gray-700' },
  create: { label: 'สร้าง', icon: <UserPlus className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700' },
  update: { label: 'แก้ไข', icon: <Pencil className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-700' },
  delete: { label: 'ลบ', icon: <Trash2 className="h-4 w-4" />, color: 'bg-red-100 text-red-700' },
  view: { label: 'ดู', icon: <Eye className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700' },
  settings: { label: 'ตั้งค่า', icon: <Settings className="h-4 w-4" />, color: 'bg-orange-100 text-orange-700' },
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Simulate fetching logs
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulated data
      const mockLogs: ActivityLog[] = [
        {
          id: '1',
          action: 'login',
          resource: 'auth',
          description: 'เข้าสู่ระบบสำเร็จ',
          user: { id: '1', name: 'สมชาย ใจดี' },
          ip: '192.168.1.100',
          userAgent: 'Chrome/120.0.0.0',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          action: 'create',
          resource: 'clinic',
          description: 'สร้างคลินิกใหม่: คลินิกสุขภาพดี',
          user: { id: '2', name: 'Admin' },
          ip: '192.168.1.101',
          userAgent: 'Firefox/121.0',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          action: 'update',
          resource: 'user',
          description: 'อัปเดตข้อมูลผู้ใช้: สมหญิง รักดี',
          user: { id: '2', name: 'Admin' },
          ip: '192.168.1.101',
          userAgent: 'Firefox/121.0',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: '4',
          action: 'delete',
          resource: 'task',
          description: 'ลบงาน: งานทดสอบ',
          user: { id: '3', name: 'วิชัย มั่นคง' },
          ip: '192.168.1.102',
          userAgent: 'Safari/17.2',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
        },
        {
          id: '5',
          action: 'settings',
          resource: 'system',
          description: 'เปลี่ยนการตั้งค่าระบบ',
          user: { id: '2', name: 'Admin' },
          ip: '192.168.1.101',
          userAgent: 'Firefox/121.0',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '6',
          action: 'logout',
          resource: 'auth',
          description: 'ออกจากระบบ',
          user: { id: '1', name: 'สมชาย ใจดี' },
          ip: '192.168.1.100',
          userAgent: 'Chrome/120.0.0.0',
          timestamp: new Date(Date.now() - 90000000).toISOString(),
        },
      ];

      setLogs(mockLogs);
      setLoading(false);
    };

    fetchLogs();
  }, []);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      if (
        !log.description.toLowerCase().includes(searchLower) &&
        !log.user.name.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    // Action filter
    if (actionFilter !== 'all' && log.action !== actionFilter) {
      return false;
    }

    // Date filter
    if (dateFrom) {
      const logDate = new Date(log.timestamp);
      if (logDate < dateFrom) return false;
    }
    if (dateTo) {
      const logDate = new Date(log.timestamp);
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      if (logDate > endOfDay) return false;
    }

    return true;
  });

  const handleExport = () => {
    // Export to CSV
    const csvContent = [
      ['ID', 'Action', 'Resource', 'Description', 'User', 'IP', 'Timestamp'].join(','),
      ...filteredLogs.map((log) =>
        [
          log.id,
          log.action,
          log.resource,
          `"${log.description}"`,
          log.user.name,
          log.ip,
          log.timestamp,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `activity-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  // Stats
  const stats = {
    total: logs.length,
    today: logs.filter(
      (l) => new Date(l.timestamp).toDateString() === new Date().toDateString()
    ).length,
    logins: logs.filter((l) => l.action === 'login').length,
    changes: logs.filter((l) => ['create', 'update', 'delete'].includes(l.action)).length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-500">ทั้งหมด</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.today}</p>
                <p className="text-sm text-gray-500">วันนี้</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <LogIn className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.logins}</p>
                <p className="text-sm text-gray-500">การเข้าสู่ระบบ</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Pencil className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.changes}</p>
                <p className="text-sm text-gray-500">การเปลี่ยนแปลง</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="ค้นหา..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Action Filter */}
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="ประเภท" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="login">เข้าสู่ระบบ</SelectItem>
            <SelectItem value="logout">ออกจากระบบ</SelectItem>
            <SelectItem value="create">สร้าง</SelectItem>
            <SelectItem value="update">แก้ไข</SelectItem>
            <SelectItem value="delete">ลบ</SelectItem>
            <SelectItem value="settings">ตั้งค่า</SelectItem>
          </SelectContent>
        </Select>

        {/* Date From */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'ตั้งแต่'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'ถึง'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {(searchQuery || actionFilter !== 'all' || dateFrom || dateTo) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchQuery('');
              setActionFilter('all');
              setDateFrom(undefined);
              setDateTo(undefined);
            }}
          >
            ล้างตัวกรอง
          </Button>
        )}

        {/* Actions */}
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Results Info */}
      <div className="text-sm text-gray-500">แสดง {filteredLogs.length} รายการ</div>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">ไม่พบกิจกรรม</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เวลา</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead>ผู้ใช้</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const config = actionConfig[log.action];
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <div>
                          <p className="text-sm">
                            {format(new Date(log.timestamp), 'dd MMM yyyy', { locale: th })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(log.timestamp), 'HH:mm:ss')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('flex items-center gap-1 w-fit', config.color)}>
                          {config.icon}
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{log.description}</p>
                        <p className="text-xs text-gray-500">{log.resource}</p>
                      </TableCell>
                      <TableCell>{log.user.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {log.ip}
                        </code>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}