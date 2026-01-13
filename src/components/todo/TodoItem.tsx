// src/components/todo/TodoItem.tsx

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Todo, TodoPriority } from '@/types/todo';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}

const priorityConfig: Record<TodoPriority, { label: string; color: string; bgColor: string }> = {
  urgent: { label: 'เร่งด่วน', color: 'text-red-700', bgColor: 'bg-red-100' },
  high: { label: 'สูง', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  medium: { label: 'ปานกลาง', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  low: { label: 'ต่ำ', color: 'text-green-700', bgColor: 'bg-green-100' },
};

export function TodoItem({ todo, onToggle, onEdit, onDelete, disabled }: TodoItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isCompleted = todo.status === 'done';
  const priority = priorityConfig[todo.priority];

  const handleToggle = () => {
    if (!disabled) {
      onToggle(todo.id);
    }
  };

  const handleDelete = () => {
    onDelete(todo.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm',
          isCompleted ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-gray-300'
        )}
      >
        {/* Checkbox */}
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleToggle}
          disabled={disabled}
          className="h-5 w-5"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'font-medium truncate',
                isCompleted && 'line-through text-gray-400'
              )}
            >
              {todo.name}
            </span>
            <Badge variant="outline" className={cn('text-xs', priority.color, priority.bgColor)}>
              {priority.label}
            </Badge>
          </div>

          {todo.description && (
            <p
              className={cn(
                'text-sm mt-0.5 truncate',
                isCompleted ? 'text-gray-400' : 'text-gray-500'
              )}
            >
              {todo.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">
              {todo.clinic.name.th || todo.clinic.name.en}
            </span>
            <span className="text-xs text-gray-300">•</span>
            <span className="text-xs text-gray-400">
              {new Date(todo.createdAt).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(todo)}>
              <Pencil className="h-4 w-4 mr-2" />
              แก้ไข
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              ลบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบงาน "{todo.name}" หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
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
    </>
  );
}

export default TodoItem;