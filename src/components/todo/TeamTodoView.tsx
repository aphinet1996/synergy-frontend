// src/components/todo/TeamTodoView.tsx

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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, Users, CheckCircle2, Circle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTodoStore } from '@/stores/todoStore';
import { useClinicStore } from '@/stores/clinicStore';
import { userService } from '@/services/userService';
import type { TeamTodoParams, Todo, TodoPriority } from '@/types/todo';
import type { UserSummary } from '@/types/user';

const priorityConfig: Record<TodoPriority, { label: string; color: string }> = {
  urgent: { label: 'เร่งด่วน', color: 'bg-red-100 text-red-700' },
  high: { label: 'สูง', color: 'bg-orange-100 text-orange-700' },
  medium: { label: 'ปานกลาง', color: 'bg-yellow-100 text-yellow-700' },
  low: { label: 'ต่ำ', color: 'bg-green-100 text-green-700' },
};

export function TeamTodoView() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedClinicId, setSelectedClinicId] = useState<string>('all');
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const { teamTodos, teamPagination, teamLoading, fetchTeamTodos } = useTodoStore();
  const { clinics, fetchClinics } = useClinicStore();

  // Fetch users
  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      const response = await userService.getActiveUsers();
      if (response.success && response.data) {
        setUsers(response.data.users);
      }
      setLoadingUsers(false);
    };
    loadUsers();
  }, []);

  // Fetch clinics
  useEffect(() => {
    if (clinics.length === 0) {
      fetchClinics({ limit: 100 });
    }
  }, [clinics.length, fetchClinics]);

  // Fetch team todos
  useEffect(() => {
    const params: TeamTodoParams = {
      date: format(date, 'yyyy-MM-dd'),
      limit: 100,
    };

    if (selectedUserId !== 'all') {
      params.userId = selectedUserId;
    }
    if (selectedClinicId !== 'all') {
      params.clinicId = selectedClinicId;
    }

    fetchTeamTodos(params);
  }, [date, selectedUserId, selectedClinicId, fetchTeamTodos]);

  // Group todos by user
  const todosByUser = teamTodos.reduce((acc, todo) => {
    const userName = todo.createdBy || 'Unknown';
    if (!acc[userName]) {
      acc[userName] = [];
    }
    acc[userName].push(todo);
    return acc;
  }, {} as Record<string, Todo[]>);

  const handleRefresh = () => {
    const params: TeamTodoParams = {
      date: format(date, 'yyyy-MM-dd'),
      limit: 100,
    };
    if (selectedUserId !== 'all') params.userId = selectedUserId;
    if (selectedClinicId !== 'all') params.clinicId = selectedClinicId;
    fetchTeamTodos(params);
  };

  // Calculate stats
  const totalTodos = teamTodos.length;
  const completedTodos = teamTodos.filter((t) => t.status === 'done').length;
  const pendingTodos = totalTodos - completedTodos;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(date, 'PPP', { locale: th })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* User Filter */}
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="เลือกพนักงาน" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกคน</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clinic Filter */}
        <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="เลือกคลินิก" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกคลินิก</SelectItem>
            {clinics.map((clinic) => (
              <SelectItem key={clinic.id} value={clinic.id}>
                {clinic.name.th || clinic.name.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Refresh */}
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={teamLoading}>
          <RefreshCw className={`h-4 w-4 ${teamLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalTodos}</p>
              <p className="text-sm text-gray-500">งานทั้งหมด</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedTodos}</p>
              <p className="text-sm text-gray-500">เสร็จแล้ว</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Circle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingTodos}</p>
              <p className="text-sm text-gray-500">รอดำเนินการ</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Todos List */}
      {teamLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : Object.keys(todosByUser).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">ไม่มีงานในวันที่เลือก</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(todosByUser).map(([userName, userTodos]) => {
            const completed = userTodos.filter((t) => t.status === 'done').length;
            const total = userTodos.length;

            return (
              <Card key={userName}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{userName}</CardTitle>
                    <Badge variant="outline">
                      {completed}/{total} เสร็จ
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-green-500 h-1.5 rounded-full transition-all"
                      style={{ width: total > 0 ? `${(completed / total) * 100}%` : '0%' }}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {userTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className={cn(
                          'flex items-center gap-3 p-2 rounded-lg',
                          todo.status === 'done' ? 'bg-gray-50' : 'bg-white'
                        )}
                      >
                        {todo.status === 'done' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        )}
                        <span
                          className={cn(
                            'flex-1 text-sm',
                            todo.status === 'done' && 'line-through text-gray-400'
                          )}
                        >
                          {todo.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', priorityConfig[todo.priority].color)}
                        >
                          {priorityConfig[todo.priority].label}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {todo.clinic.name.th || todo.clinic.name.en}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TeamTodoView;