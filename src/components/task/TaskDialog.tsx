import { EmployeeTaskDialog } from './TaskDialogEmployee';
import { ManagerTaskDialog } from './TaskDialogManager';
import type { CreateTaskForm, Position } from '@/types/task';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinics: Array<{ id: string; name: string }>;
  positions: Position[];
  currentUser: {
    id: string;
    role: 'manager' | 'admin' | 'employee';
  };
  onSubmit: (data: CreateTaskForm) => void;
}

export function TaskDialog({
  open,
  onOpenChange,
  clinics,
  positions,
  currentUser,
  onSubmit,
}: CreateTaskDialogProps) {
  const isManager = currentUser.role === 'manager' || currentUser.role === 'admin';

  if (isManager) {
    return (
      <ManagerTaskDialog
        open={open}
        onOpenChange={onOpenChange}
        clinics={clinics}
        positions={positions}
        onSubmit={onSubmit}
      />
    );
  }

  return (
    <EmployeeTaskDialog
      open={open}
      onOpenChange={onOpenChange}
      currentUserId={currentUser.id}
      clinics={clinics}
      onSubmit={onSubmit}
    />
  );
}