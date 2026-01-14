import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useTaskStore } from '@/stores/taskStore';
import { useUserStore } from '@/stores/userStore';
import type { Task, TaskStatus, User, Process } from '@/types/task';
import {
  Building2,
  Users,
  ClipboardList,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Calendar,
  Briefcase,
  ListTodo,
  UserCheck,
  Settings,
  BarChart3,
  Activity,
  Play,
  Eye,
  Plus,
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';
import { th } from 'date-fns/locale';

// ============================================
// Helper Functions
// ============================================

// หา process ที่ user ถูก assign
function findUserProcess(task: Task, userId: string, userName: string): Process | null {
  if (!task.process || task.process.length === 0) return null;

  for (const process of task.process) {
    if (!process.assignee || process.assignee.length === 0) continue;

    for (const assignee of process.assignee) {
      if (typeof assignee === 'string') {
        if (assignee === userId) return process;
        if (assignee.includes(' ') && assignee.toLowerCase() === userName.toLowerCase()) {
          return process;
        }
      }
      if (typeof assignee === 'object' && assignee !== null) {
        if ('id' in assignee && assignee.id === userId) return process;
        if ('firstname' in assignee && 'lastname' in assignee) {
          const fullName = `${(assignee as any).firstname} ${(assignee as any).lastname}`.trim();
          if (fullName.toLowerCase() === userName.toLowerCase()) return process;
        }
      }
    }
  }
  return null;
}

// Check if user is assigned to task
function isUserAssignedToTask(task: Task, userId: string, userName: string): boolean {
  if (task.assignee && task.assignee.length > 0) {
    const found = task.assignee.some(a => {
      if (a.id === userId) return true;
      const fullName = `${a.firstname} ${a.lastname}`.trim();
      return fullName.toLowerCase() === userName.toLowerCase();
    });
    if (found) return true;
  }
  return findUserProcess(task, userId, userName) !== null;
}

// Get display status for employee
function getDisplayStatus(task: Task, userId: string, userName: string): TaskStatus {
  const userProcess = findUserProcess(task, userId, userName);
  if (userProcess && userProcess.status) {
    return userProcess.status as TaskStatus;
  }
  return task.status;
}

// Get priority color
function getPriorityColor(priority: string) {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };
  return colors[priority] || colors.medium;
}

// Get status color
function getStatusColor(status: TaskStatus) {
  const colors: Record<TaskStatus, string> = {
    pending: 'bg-gray-100 text-gray-700',
    process: 'bg-blue-100 text-blue-700',
    review: 'bg-yellow-100 text-yellow-700',
    done: 'bg-green-100 text-green-700',
    delete: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

// Get status label
function getStatusLabel(status: TaskStatus) {
  const labels: Record<TaskStatus, string> = {
    pending: 'รอดำเนินการ',
    process: 'กำลังดำเนินการ',
    review: 'รอตรวจสอบ',
    done: 'เสร็จสิ้น',
    delete: 'ลบแล้ว',
  };
  return labels[status] || status;
}

// Get status icon
// function getStatusIcon(status: TaskStatus): React.ReactNode {
//   const icons: Record<TaskStatus, React.ReactNode> = {
//     pending: <Clock className="h-4 w-4" />,
//     process: <Play className="h-4 w-4" />,
//     review: <Eye className="h-4 w-4" />,
//     done: <CheckCircle2 className="h-4 w-4" />,
//     delete: <AlertCircle className="h-4 w-4" />,
//   };
//   return icons[status] || <Clock className="h-4 w-4" />;
// }

// Format due date
function formatDueDate(date: Date) {
  const d = new Date(date);
  if (isToday(d)) return 'วันนี้';
  if (isTomorrow(d)) return 'พรุ่งนี้';
  if (isPast(d)) {
    const days = differenceInDays(new Date(), d);
    return `เลยกำหนด ${days} วัน`;
  }
  return format(d, 'dd MMM', { locale: th });
}

// ============================================
// Stat Card Component
// ============================================
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; label: string };
}

function StatCard({ title, value, subtitle, icon, color, trend }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${color}`}>
              {icon}
            </div>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-gray-500">{title}</p>
            </div>
          </div>
          {trend && (
            <div className={`text-xs px-2 py-1 rounded-full ${trend.value >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </div>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-2">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Task Item Component
// ============================================
interface TaskItemProps {
  task: Task;
  displayStatus?: TaskStatus;
  showClinic?: boolean;
}

function TaskItem({ task, displayStatus, showClinic = true }: TaskItemProps) {
  const status = displayStatus || task.status;
  const isOverdue = isPast(new Date(task.dueDate)) && status !== 'done';

  return (
    <Link to="/task" className="block">
      <div className={`p-3 rounded-lg border hover:bg-gray-50 transition-colors ${isOverdue ? 'border-red-200 bg-red-50/50' : 'border-gray-200'}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-medium text-sm line-clamp-1 flex-1">{task.name}</h4>
          <Badge className={`${getPriorityColor(task.priority)} text-xs shrink-0`}>
            {task.priority === 'urgent' ? 'ด่วนมาก' : task.priority === 'high' ? 'ด่วน' : task.priority === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            {showClinic && task.clinic?.name && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {task.clinic.name.th || task.clinic.name.en}
              </span>
            )}
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
              <Calendar className="h-3 w-3" />
              {formatDueDate(task.dueDate)}
            </span>
          </div>
          <Badge variant="outline" className={`${getStatusColor(status)} text-xs`}>
            {getStatusLabel(status)}
          </Badge>
        </div>
      </div>
    </Link>
  );
}

// ============================================
// Employee Dashboard
// ============================================
function EmployeeDashboard({ 
  tasks, 
  currentUser, 
  userName,
  loading 
}: { 
  tasks: Task[]; 
  currentUser: User;
  userName: string;
  loading: boolean;
}) {
  // Filter tasks assigned to employee
  const myTasks = useMemo(() => {
    return tasks.filter(task => 
      isUserAssignedToTask(task, currentUser.id, userName) ||
      task.createdBy === currentUser.id ||
      task.createdBy === userName
    );
  }, [tasks, currentUser.id, userName]);

  // Group by display status (process status for employee)
  const tasksByStatus = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      pending: [],
      process: [],
      review: [],
      done: [],
      delete: [],
    };

    myTasks.forEach(task => {
      const status = getDisplayStatus(task, currentUser.id, userName);
      if (groups[status]) {
        groups[status].push(task);
      }
    });

    return groups;
  }, [myTasks, currentUser.id, userName]);

  // Urgent tasks (due today or overdue)
  const urgentTasks = useMemo(() => {
    return myTasks.filter(task => {
      const status = getDisplayStatus(task, currentUser.id, userName);
      if (status === 'done') return false;
      const dueDate = new Date(task.dueDate);
      return isToday(dueDate) || isPast(dueDate);
    }).slice(0, 5);
  }, [myTasks, currentUser.id, userName]);

  // Calculate progress
  const totalTasks = myTasks.length;
  const doneTasks = tasksByStatus.done.length;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            สวัสดี, {currentUser.firstname || currentUser.nickname || 'คุณ'}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            วันนี้คุณมีงาน {tasksByStatus.pending.length + tasksByStatus.process.length + tasksByStatus.review.length} รายการที่ต้องทำ
          </p>
        </div>
        <Button asChild>
          <Link to="/task">
            <ClipboardList className="h-4 w-4 mr-2" />
            ดูงานทั้งหมด
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="รอดำเนินการ"
          value={tasksByStatus.pending.length}
          icon={<Clock className="h-5 w-5 text-gray-600" />}
          color="bg-gray-100"
        />
        <StatCard
          title="กำลังทำ"
          value={tasksByStatus.process.length}
          icon={<Play className="h-5 w-5 text-blue-600" />}
          color="bg-blue-100"
        />
        <StatCard
          title="รอตรวจสอบ"
          value={tasksByStatus.review.length}
          icon={<Eye className="h-5 w-5 text-yellow-600" />}
          color="bg-yellow-100"
        />
        <StatCard
          title="เสร็จแล้ว"
          value={tasksByStatus.done.length}
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          color="bg-green-100"
        />
      </div>

      {/* Progress Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">ความคืบหน้าของฉัน</span>
            <span className="text-sm font-bold text-purple-600">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-gray-500 mt-2">
            เสร็จสิ้น {doneTasks} จาก {totalTasks} งาน
          </p>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              งานเร่งด่วน
            </CardTitle>
            <CardDescription>งานที่ต้องทำวันนี้หรือเลยกำหนด</CardDescription>
          </CardHeader>
          <CardContent>
            {urgentTasks.length > 0 ? (
              <div className="space-y-3">
                {urgentTasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    displayStatus={getDisplayStatus(task, currentUser.id, userName)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>ไม่มีงานเร่งด่วน</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* In Progress Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-500" />
              กำลังดำเนินการ
            </CardTitle>
            <CardDescription>งานที่กำลังทำอยู่</CardDescription>
          </CardHeader>
          <CardContent>
            {tasksByStatus.process.length > 0 ? (
              <div className="space-y-3">
                {tasksByStatus.process.slice(0, 5).map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task}
                    displayStatus="process"
                  />
                ))}
                {tasksByStatus.process.length > 5 && (
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/task">
                      ดูทั้งหมด ({tasksByStatus.process.length})
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <ListTodo className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>ไม่มีงานที่กำลังทำ</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// Manager Dashboard
// ============================================
function ManagerDashboard({ 
  tasks, 
  currentUser,
  loading 
}: { 
  tasks: Task[];
  users: User[];
  clinics: any[];
  currentUser: User;
  loading: boolean;
}) {
  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      pending: [],
      process: [],
      review: [],
      done: [],
      delete: [],
    };

    tasks.forEach(task => {
      if (groups[task.status]) {
        groups[task.status].push(task);
      }
    });

    return groups;
  }, [tasks]);

  // Calculate stats
  const totalTasks = tasks.length;
  const doneTasks = tasksByStatus.done.length;
  const inProgressTasks = tasksByStatus.process.length + tasksByStatus.review.length;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Tasks needing review
  const reviewTasks = tasksByStatus.review.slice(0, 5);

  // Overdue tasks
  const overdueTasks = useMemo(() => {
    return tasks.filter(task => {
      if (task.status === 'done') return false;
      return isPast(new Date(task.dueDate));
    }).slice(0, 5);
  }, [tasks]);

  // Tasks by clinic
  const tasksByClinic = useMemo(() => {
    const groups: Record<string, { name: string; count: number; done: number }> = {};
    
    tasks.forEach(task => {
      const clinicId = task.clinic?.id || 'unknown';
      const clinicName = task.clinic?.name?.th || task.clinic?.name?.en || 'ไม่ระบุ';
      
      if (!groups[clinicId]) {
        groups[clinicId] = { name: clinicName, count: 0, done: 0 };
      }
      groups[clinicId].count++;
      if (task.status === 'done') {
        groups[clinicId].done++;
      }
    });

    return Object.entries(groups)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [tasks]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            สวัสดี, {currentUser.firstname || currentUser.nickname || 'Manager'}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            ภาพรวมงานของทีม
          </p>
        </div>
        <div className="flex gap-2">
          {/* <Button variant="outline" asChild>
            <Link to="/task">
              <ClipboardList className="h-4 w-4 mr-2" />
              จัดการงาน
            </Link>
          </Button> */}
          <Button className='bg-purple-600 hover:bg-purple-700' asChild>
            <Link to="/task">
              <ClipboardList className="h-4 w-4 mr-2" />
              จัดการงาน
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="งานทั้งหมด"
          value={totalTasks}
          icon={<ClipboardList className="h-5 w-5 text-purple-600" />}
          color="bg-purple-100"
          subtitle={`${inProgressTasks} กำลังดำเนินการ`}
        />
        <StatCard
          title="รอตรวจสอบ"
          value={tasksByStatus.review.length}
          icon={<Eye className="h-5 w-5 text-yellow-600" />}
          color="bg-yellow-100"
          subtitle="ต้องการการอนุมัติ"
        />
        <StatCard
          title="เลยกำหนด"
          value={overdueTasks.length}
          icon={<AlertCircle className="h-5 w-5 text-red-600" />}
          color="bg-red-100"
          subtitle="ต้องติดตาม"
        />
        <StatCard
          title="ความสำเร็จ"
          value={`${progressPercent}%`}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          color="bg-green-100"
          subtitle={`${doneTasks} งานเสร็จสิ้น`}
        />
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">ภาพรวมความคืบหน้า</span>
            <span className="text-sm text-gray-500">{doneTasks}/{totalTasks} งาน</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(['pending', 'process', 'review', 'done'] as TaskStatus[]).map(status => {
              const count = tasksByStatus[status].length;
              const percent = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
              return (
                <div key={status} className="text-center">
                  <div className={`h-2 rounded-full ${getStatusColor(status).replace('text-', 'bg-').split(' ')[0]}`} 
                       style={{ opacity: 0.3 + (percent / 100) * 0.7 }} />
                  <p className="text-xs mt-1 text-gray-600">{getStatusLabel(status)}</p>
                  <p className="text-sm font-semibold">{count}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks by Clinic */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-500" />
              งานตามคลินิก
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasksByClinic.map(clinic => {
                const percent = clinic.count > 0 ? Math.round((clinic.done / clinic.count) * 100) : 0;
                return (
                  <div key={clinic.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">{clinic.name}</span>
                      <span className="text-gray-500">{clinic.done}/{clinic.count}</span>
                    </div>
                    <Progress value={percent} className="h-1.5" />
                  </div>
                );
              })}
              {tasksByClinic.length === 0 && (
                <p className="text-center text-gray-400 py-4">ไม่มีข้อมูล</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Review Tasks */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-yellow-500" />
              รอตรวจสอบ
            </CardTitle>
            <CardDescription>งานที่รอการอนุมัติ</CardDescription>
          </CardHeader>
          <CardContent>
            {reviewTasks.length > 0 ? (
              <div className="space-y-3">
                {reviewTasks.map(task => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>ไม่มีงานรอตรวจสอบ</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Tasks */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              เลยกำหนด
            </CardTitle>
            <CardDescription>งานที่ต้องติดตาม</CardDescription>
          </CardHeader>
          <CardContent>
            {overdueTasks.length > 0 ? (
              <div className="space-y-3">
                {overdueTasks.map(task => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>ไม่มีงานเลยกำหนด</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// Admin Dashboard
// ============================================
function AdminDashboard({ 
  tasks, 
  users,
  clinics,
  currentUser,
  loading 
}: { 
  tasks: Task[];
  users: User[];
  clinics: any[];
  currentUser: User;
  loading: boolean;
}) {
  // Calculate stats
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const totalUsers = users.length;
  const totalClinics = clinics.length;

  // Tasks by status
  const tasksByStatus = useMemo(() => {
    const groups: Record<TaskStatus, number> = {
      pending: 0,
      process: 0,
      review: 0,
      done: 0,
      delete: 0,
    };

    tasks.forEach(task => {
      if (groups[task.status] !== undefined) {
        groups[task.status]++;
      }
    });

    return groups;
  }, [tasks]);

  // Users by role
  const usersByRole = useMemo(() => {
    const groups = { admin: 0, manager: 0, employee: 0 };
    users.forEach(user => {
      if (user.role && groups[user.role as keyof typeof groups] !== undefined) {
        groups[user.role as keyof typeof groups]++;
      }
    });
    return groups;
  }, [users]);

  // Recent tasks
  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5);
  }, [tasks]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            สวัสดี, {currentUser.firstname || 'Admin'}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            ภาพรวมระบบ Synergy
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin">
              <Settings className="h-4 w-4 mr-2" />
              Admin Panel
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="คลินิกทั้งหมด"
          value={totalClinics}
          icon={<Building2 className="h-5 w-5 text-purple-600" />}
          color="bg-purple-100"
        />
        <StatCard
          title="ผู้ใช้ทั้งหมด"
          value={totalUsers}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          color="bg-blue-100"
          subtitle={`${usersByRole.admin} Admin, ${usersByRole.manager} Manager`}
        />
        <StatCard
          title="งานทั้งหมด"
          value={totalTasks}
          icon={<ClipboardList className="h-5 w-5 text-green-600" />}
          color="bg-green-100"
          subtitle={`${doneTasks} เสร็จสิ้น`}
        />
        <StatCard
          title="อัตราความสำเร็จ"
          value={`${totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%`}
          icon={<TrendingUp className="h-5 w-5 text-orange-600" />}
          color="bg-orange-100"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Distribution */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              สถานะงาน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(['pending', 'process', 'review', 'done'] as TaskStatus[]).map(status => {
                const count = tasksByStatus[status];
                const percent = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(status).split(' ')[0].replace('bg-', 'bg-')}`} />
                        <span>{getStatusLabel(status)}</span>
                      </div>
                      <span className="font-medium">{count} ({percent}%)</span>
                    </div>
                    <Progress value={percent} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* User Distribution */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              ผู้ใช้งาน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="font-medium">Admin</span>
                </div>
                <span className="text-xl font-bold">{usersByRole.admin}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-medium">Manager</span>
                </div>
                <span className="text-xl font-bold">{usersByRole.manager}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="font-medium">Employee</span>
                </div>
                <span className="text-xl font-bold">{usersByRole.employee}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              งานล่าสุด
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTasks.length > 0 ? (
              <div className="space-y-3">
                {recentTasks.map(task => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>ไม่มีงาน</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">การดำเนินการด่วน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link to="/clinic">
                <Building2 className="h-6 w-6 mb-2 text-purple-600" />
                <span>จัดการคลินิก</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link to="/admin/users">
                <Users className="h-6 w-6 mb-2 text-blue-600" />
                <span>จัดการผู้ใช้</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link to="/task">
                <ClipboardList className="h-6 w-6 mb-2 text-green-600" />
                <span>จัดการงาน</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link to="/admin/settings">
                <Settings className="h-6 w-6 mb-2 text-gray-600" />
                <span>ตั้งค่าระบบ</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Dashboard Skeleton
// ============================================
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-16" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================
export default function Home() {
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  
  // ✅ ใช้ currentUser จาก taskStore ที่มี fetchCurrentUser อยู่แล้ว
  const { 
    tasks, 
    users, 
    clinics, 
    currentUser: taskStoreUser,
    loading, 
    fetchAll 
  } = useTaskStore();
  
  // Fallback: ใช้ user จาก userStore ถ้า taskStore ยังไม่มี
  const { user: userStoreUser } = useUserStore();

  useEffect(() => {
    const loadData = async () => {
      await fetchAll();
      setIsInitialLoad(false);
    };
    loadData();
  }, []);

  // ✅ ใช้ currentUser จาก taskStore ก่อน, fallback ไป userStore
  const currentUser = (taskStoreUser || userStoreUser) as User | null;
  
  const userName = currentUser 
    ? `${currentUser.firstname || ''} ${currentUser.lastname || ''}`.trim() || currentUser.name || ''
    : '';

  // Determine role
  const role = currentUser?.role || 'employee';

  // ✅ แสดง skeleton ระหว่าง initial loading
  if (isInitialLoad) {
    return <DashboardSkeleton />;
  }
  
  // ✅ ถ้าโหลดเสร็จแล้วแต่ไม่มี user แสดงข้อความ
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">ไม่สามารถโหลดข้อมูลผู้ใช้ได้</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            ลองใหม่
          </Button>
        </div>
      </div>
    );
  }

  // Render dashboard based on role
  switch (role) {
    case 'admin':
      return (
        <AdminDashboard
          tasks={tasks}
          users={users}
          clinics={clinics}
          currentUser={currentUser}
          loading={loading}
        />
      );
    case 'manager':
      return (
        <ManagerDashboard
          tasks={tasks}
          users={users}
          clinics={clinics}
          currentUser={currentUser}
          loading={loading}
        />
      );
    default:
      return (
        <EmployeeDashboard
          tasks={tasks}
          currentUser={currentUser}
          userName={userName}
          loading={loading}
        />
      );
  }
}