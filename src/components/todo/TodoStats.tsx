// src/components/todo/TodoStats.tsx

import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Circle, ListTodo } from 'lucide-react';
import { useTodoStore } from '@/stores/todoStore';

interface TodoStatsProps {
  compact?: boolean;
}

export function TodoStats({ compact = false }: TodoStatsProps) {
  const { stats, statsLoading, fetchStats } = useTodoStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (statsLoading) {
    return (
      <div className={`grid ${compact ? 'grid-cols-3 gap-2' : 'grid-cols-3 gap-4'}`}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className={compact ? 'h-16' : 'h-24'} />
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const completionRate = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <ListTodo className="h-4 w-4 text-blue-500" />
          <span className="font-medium">{stats.total}</span>
          <span className="text-gray-500">ทั้งหมด</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="font-medium">{stats.completed}</span>
          <span className="text-gray-500">เสร็จแล้ว</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Circle className="h-4 w-4 text-orange-500" />
          <span className="font-medium">{stats.pending}</span>
          <span className="text-gray-500">รอดำเนินการ</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Total */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ListTodo className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500">งานทั้งหมด</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-sm text-gray-500">เสร็จแล้ว</p>
            </div>
          </div>
          {stats.total > 0 && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{completionRate}%</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Circle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-gray-500">รอดำเนินการ</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TodoStats;