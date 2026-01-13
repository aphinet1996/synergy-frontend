// src/components/dashboard/TodoWidget.tsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  Circle,
  ListTodo,
  Plus,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTodoStore } from '@/stores/todoStore';
import { TodoDialog } from '@/components/todo/TodoDialog';
import type { TodoPriority } from '@/types/todo';

const priorityColors: Record<TodoPriority, string> = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

interface TodoWidgetProps {
  maxItems?: number;
  showAddButton?: boolean;
}

export function TodoWidget({ maxItems = 5, showAddButton = true }: TodoWidgetProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    todos,
    stats,
    loading,
    statsLoading,
    fetchTodos,
    fetchStats,
    toggleTodo,
  } = useTodoStore();

  // Fetch todos and stats on mount
  useEffect(() => {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    fetchTodos({
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
      limit: maxItems,
    });
    fetchStats();
  }, [fetchTodos, fetchStats, maxItems]);

  const handleToggle = async (id: string) => {
    await toggleTodo(id);
  };

  const handleRefresh = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    fetchTodos({
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString(),
      limit: maxItems,
    });
    fetchStats();
  };

  // Calculate completion percentage
  const completionRate =
    stats && stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-purple-600" />
            งานวันนี้
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {showAddButton && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {!statsLoading && stats && stats.total > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500">ความคืบหน้า</span>
              <span className="font-medium">
                {stats.completed}/{stats.total} ({completionRate}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Loading State */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : todos.length === 0 ? (
          /* Empty State */
          <div className="text-center py-6">
            <Circle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm mb-3">ยังไม่มีงานวันนี้</p>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              เพิ่มงานใหม่
            </Button>
          </div>
        ) : (
          /* Todo List */
          <div className="space-y-2">
            {todos.slice(0, maxItems).map((todo) => (
              <div
                key={todo.id}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg transition-colors',
                  todo.status === 'done' ? 'bg-gray-50' : 'hover:bg-gray-50'
                )}
              >
                <Checkbox
                  checked={todo.status === 'done'}
                  onCheckedChange={() => handleToggle(todo.id)}
                  className="h-4 w-4"
                />
                <span
                  className={cn(
                    'flex-1 text-sm truncate',
                    todo.status === 'done' && 'line-through text-gray-400'
                  )}
                >
                  {todo.name}
                </span>
                <Badge
                  variant="outline"
                  className={cn('text-xs', priorityColors[todo.priority])}
                >
                  {todo.priority === 'urgent'
                    ? '!'
                    : todo.priority === 'high'
                    ? 'H'
                    : todo.priority === 'medium'
                    ? 'M'
                    : 'L'}
                </Badge>
              </div>
            ))}

            {/* View All Link */}
            {stats && stats.total > maxItems && (
              <Link
                to="/todo"
                className="flex items-center justify-center gap-1 text-sm text-purple-600 hover:text-purple-700 pt-2"
              >
                ดูทั้งหมด ({stats.total})
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}

        {/* Quick Stats */}
        {!statsLoading && stats && stats.total > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>{stats.completed} เสร็จ</span>
            </div>
            <div className="flex items-center gap-1 text-orange-600">
              <Circle className="h-4 w-4" />
              <span>{stats.pending} รอดำเนินการ</span>
            </div>
          </div>
        )}
      </CardContent>

      {/* Add Todo Dialog */}
      <TodoDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleRefresh}
      />
    </Card>
  );
}

export default TodoWidget;