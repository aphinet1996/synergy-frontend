import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, ListTodo, RefreshCw } from 'lucide-react';
import { TodoItem } from './TodoItem';
import { TodoDialog } from './TodoDialog';
import { useTodoStore } from '@/stores/todoStore';
import { useClinicStore } from '@/stores/clinicStore';
import type { Todo, TodoStatus, TodoPriority, TodoListParams } from '@/types/todo';
import { debounce } from 'lodash';

const ITEMS_PER_PAGE = 20;

export function TodoList() {
  const [filters, setFilters] = useState<TodoListParams>({
    page: 1,
    limit: ITEMS_PER_PAGE,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const {
    todos,
    pagination,
    loading,
    error,
    fetchTodos,
    toggleTodo,
    deleteTodo,
    clearError,
  } = useTodoStore();

  const { clinics, fetchClinics } = useClinicStore();

  // Fetch clinics for filter dropdown
  useEffect(() => {
    if (clinics.length === 0) {
      fetchClinics({ limit: 100 });
    }
  }, [clinics.length, fetchClinics]);

  // Fetch todos when filters change
  useEffect(() => {
    fetchTodos(filters);
  }, [filters, fetchTodos]);

  const handleFilterChange = (key: keyof TodoListParams, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: key !== 'page' ? 1 : prev.page, // Reset page when filter changes
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteTodo(id);
  };

  const handleToggle = async (id: string) => {
    await toggleTodo(id);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTodo(null);
  };

  const handleRefresh = () => {
    fetchTodos(filters);
  };

  // Loading skeleton
  const renderSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );

  // Empty state
  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 bg-gray-100 rounded-full mb-4">
        <ListTodo className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">ไม่มีงาน</h3>
      <p className="text-gray-500 mb-4">เริ่มต้นด้วยการเพิ่มงานใหม่ของคุณ</p>
      <Button onClick={() => setIsDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        เพิ่มงานใหม่
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Status Filter */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="pending">รอดำเนินการ</SelectItem>
            <SelectItem value="done">เสร็จแล้ว</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select
          value={filters.priority || 'all'}
          onValueChange={(value) => handleFilterChange('priority', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="ความสำคัญ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="urgent">เร่งด่วน</SelectItem>
            <SelectItem value="high">สูง</SelectItem>
            <SelectItem value="medium">ปานกลาง</SelectItem>
            <SelectItem value="low">ต่ำ</SelectItem>
          </SelectContent>
        </Select>

        {/* Clinic Filter */}
        <Select
          value={filters.clinicId || 'all'}
          onValueChange={(value) => handleFilterChange('clinicId', value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="คลินิก" />
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

        {/* Refresh Button */}
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>

        {/* Add Button */}
        <Button onClick={() => setIsDialogOpen(true)} className="ml-auto">
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มงานใหม่
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="link" className="ml-2 p-0 h-auto" onClick={clearError}>
              ปิด
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Results Info */}
      {!loading && pagination && (
        <div className="text-sm text-gray-500">
          แสดง {todos.length} จาก {pagination.total} รายการ
        </div>
      )}

      {/* Todo List */}
      {loading ? (
        renderSkeleton()
      ) : todos.length === 0 ? (
        renderEmpty()
      ) : (
        <div className="space-y-2">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => filters.page! > 1 && handlePageChange(filters.page! - 1)}
                className={filters.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((page) => {
                const current = filters.page || 1;
                return page === 1 || page === pagination.totalPages || Math.abs(page - current) <= 1;
              })
              .map((page, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && page - prev > 1;

                return (
                  <PaginationItem key={page}>
                    {showEllipsis && <span className="px-2">...</span>}
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={filters.page === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  filters.page! < pagination.totalPages && handlePageChange(filters.page! + 1)
                }
                className={
                  filters.page === pagination.totalPages
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Todo Dialog */}
      <TodoDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        editTodo={editingTodo}
        onSuccess={() => fetchTodos(filters)}
      />
    </div>
  );
}

export default TodoList;