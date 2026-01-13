import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Building2,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowRight,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalClinics: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  userGrowth: number;
  taskGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'user_created' | 'clinic_created' | 'task_completed' | 'login';
  message: string;
  user: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching dashboard data
    // Replace with actual API calls
    const fetchDashboardData = async () => {
      setLoading(true);
      
      // Simulated data - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setStats({
        totalUsers: 48,
        activeUsers: 42,
        totalClinics: 12,
        totalTasks: 156,
        completedTasks: 134,
        pendingTasks: 22,
        userGrowth: 12.5,
        taskGrowth: 8.3,
      });

      setActivities([
        {
          id: '1',
          type: 'user_created',
          message: 'สร้างบัญชีผู้ใช้ใหม่',
          user: 'สมชาย ใจดี',
          timestamp: '5 นาทีที่แล้ว',
        },
        {
          id: '2',
          type: 'clinic_created',
          message: 'เพิ่มคลินิกใหม่: คลินิกสุขภาพดี',
          user: 'Admin',
          timestamp: '1 ชั่วโมงที่แล้ว',
        },
        {
          id: '3',
          type: 'task_completed',
          message: 'เสร็จสิ้นงาน: อัปเดตเอกสาร',
          user: 'สมหญิง รักดี',
          timestamp: '2 ชั่วโมงที่แล้ว',
        },
        {
          id: '4',
          type: 'login',
          message: 'เข้าสู่ระบบ',
          user: 'วิชัย มั่นคง',
          timestamp: '3 ชั่วโมงที่แล้ว',
        },
      ]);

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_created':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'clinic_created':
        return <Building2 className="h-4 w-4 text-purple-500" />;
      case 'task_completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'login':
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ผู้ใช้ทั้งหมด</p>
                <p className="text-3xl font-bold mt-1">{stats?.totalUsers}</p>
                <div className="flex items-center mt-2 text-sm">
                  {stats && stats.userGrowth > 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-500">+{stats.userGrowth}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-red-500">{stats?.userGrowth}%</span>
                    </>
                  )}
                  <span className="text-gray-400 ml-1">จากเดือนที่แล้ว</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ผู้ใช้ที่ใช้งานอยู่</p>
                <p className="text-3xl font-bold mt-1">{stats?.activeUsers}</p>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-gray-400">
                    {stats && Math.round((stats.activeUsers / stats.totalUsers) * 100)}% ของทั้งหมด
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Clinics */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">คลินิกทั้งหมด</p>
                <p className="text-3xl font-bold mt-1">{stats?.totalClinics}</p>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-gray-400">คลินิกในระบบ</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">งานทั้งหมด</p>
                <p className="text-3xl font-bold mt-1">{stats?.totalTasks}</p>
                <div className="flex items-center mt-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">{stats?.completedTasks} เสร็จ</span>
                  <span className="text-gray-400 mx-1">•</span>
                  <Clock className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-orange-500">{stats?.pendingTasks} รอดำเนินการ</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <ClipboardList className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>การดำเนินการด่วน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/users/new">
              <Button variant="outline" className="w-full justify-start">
                <UserPlus className="h-4 w-4 mr-3" />
                เพิ่มผู้ใช้ใหม่
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link to="/admin/clinics/new">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="h-4 w-4 mr-3" />
                เพิ่มคลินิกใหม่
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link to="/admin/roles">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-3" />
                จัดการสิทธิ์ผู้ใช้
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link to="/admin/settings">
              <Button variant="outline" className="w-full justify-start">
                <Activity className="h-4 w-4 mr-3" />
                ตั้งค่าระบบ
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>กิจกรรมล่าสุด</CardTitle>
            <Link to="/admin/logs">
              <Button variant="ghost" size="sm">
                ดูทั้งหมด
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-full">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-gray-500">
                      {activity.user} • {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>สถานะระบบ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <div>
                <p className="font-medium">API Server</p>
                <p className="text-sm text-green-600">ทำงานปกติ</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <div>
                <p className="font-medium">Database</p>
                <p className="text-sm text-green-600">ทำงานปกติ</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <div>
                <p className="font-medium">Storage</p>
                <p className="text-sm text-green-600">ใช้งาน 45%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}