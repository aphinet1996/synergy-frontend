import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Task, TaskPriority } from '@/types/task';
import {
  Calendar,
  MessageSquare,
  Paperclip,
  Building2,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  className?: string;
}

export function TaskCard({ task, onClick, className }: TaskCardProps) {
  const getPriorityColor = (priority: TaskPriority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    };
    return colors[priority];
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    const labels = {
      low: 'ต่ำ',
      medium: 'ปานกลาง',
      high: 'สูง',
      urgent: 'ด่วนมาก',
    };
    return labels[priority];
  };

  // Get assignee names - รองรับทั้ง format เก่าและใหม่
  const getAssigneeNames = (): string[] => {
    // ✅ ใช้ assignee array จาก response ใหม่
    if (task.assignee && task.assignee.length > 0) {
      return task.assignee.map(a =>
        `${a.firstname} ${a.lastname}`.trim() || a.nickname || 'ไม่ระบุ'
      );
    }

    // Backward compatibility: ถ้ามี assigneeNames จาก backend เดิม
    if ((task as any).assigneeNames && (task as any).assigneeNames.length > 0) {
      return (task as any).assigneeNames;
    }

    // ถ้าไม่มีให้ดึงจาก process
    const names: string[] = [];
    task.process?.forEach(p => {
      p.assignee?.forEach(a => {
        if (typeof a === 'string') {
          // ถ้าเป็นชื่อเต็ม (มี space) ใช้เลย
          if (a.includes(' ')) {
            names.push(a);
          }
        } else if (a && typeof a === 'object' && 'firstname' in a) {
          names.push(`${(a as any).firstname} ${(a as any).lastname}`.trim());
        } else if (a && typeof a === 'object' && 'name' in a) {
          names.push((a as any).name);
        }
      });
    });

    return [...new Set(names)]; // Remove duplicates
  };

  const assigneeNames = getAssigneeNames();

  // Get clinic name - รองรับ format ใหม่
  const getClinicName = () => {
    // ✅ ใช้ clinic object จาก response ใหม่
    if (task.clinic?.name) {
      if (typeof task.clinic.name === 'object') {
        return task.clinic.name.th || task.clinic.name.en;
      }
      return task.clinic.name;
    }
    // Backward compatibility
    if ((task as any).clinicName) {
      return (task as any).clinicName;
    }
    if ((task as any).clinicId?.name) {
      if (typeof (task as any).clinicId.name === 'object') {
        return (task as any).clinicId.name.th || (task as any).clinicId.name.en;
      }
      return (task as any).clinicId.name;
    }
    return 'ไม่ระบุคลินิก';
  };

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer hover:shadow-md transition-all hover:border-purple-300",
        className
      )}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm line-clamp-2 flex-1">
            {task.name}
          </h3>
          <Badge
            variant="secondary"
            className={cn("shrink-0", getPriorityColor(task.priority))}
          >
            {getPriorityLabel(task.priority)}
          </Badge>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Clinic */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Building2 className="h-3 w-3" />
          <span>{getClinicName()}</span>
        </div>

        {/* Assignees */}
        {assigneeNames.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {assigneeNames.slice(0, 3).map((name, idx) => (
                <Avatar key={idx} className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-[10px] bg-purple-100 text-purple-700">
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {assigneeNames.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-[10px]">+{assigneeNames.length - 3}</span>
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {assigneeNames.slice(0, 2).join(', ')}
              {assigneeNames.length > 2 && ` +${assigneeNames.length - 2}`}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-3">
            {/* Due Date */}
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(task.dueDate), 'dd MMM', { locale: th })}</span>
            </div>

            {/* Comments */}
            {task.commentAmount !== undefined && task.commentAmount > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{task.commentAmount}</span>
              </div>
            )}

            {/* Attachments */}
            {task.attachmentsAmount !== undefined && task.attachmentsAmount > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                <span>{task.attachmentsAmount}</span>
              </div>
            )}
          </div>

          {/* Created by */}
          {task.createdBy && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[100px]">
                {task.createdBy}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}