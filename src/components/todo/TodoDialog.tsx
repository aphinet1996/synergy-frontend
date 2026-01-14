// src/components/todo/TodoDialog.tsx

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useTodoStore } from '@/stores/todoStore';
import { useClinicStore } from '@/stores/clinicStore';
import type { Todo, TodoPriority } from '@/types/todo';

const todoSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่องาน'),
  description: z.string().optional(),
  clinicId: z.string().min(1, 'กรุณาเลือกคลินิก'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

type TodoFormData = z.infer<typeof todoSchema>;

interface TodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTodo?: Todo | null;
  onSuccess?: () => void;
}

const priorityOptions: { value: TodoPriority; label: string }[] = [
  { value: 'low', label: 'ต่ำ' },
  { value: 'medium', label: 'ปานกลาง' },
  { value: 'high', label: 'สูง' },
  { value: 'urgent', label: 'เร่งด่วน' },
];

export function TodoDialog({ open, onOpenChange, editTodo, onSuccess }: TodoDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createTodo, updateTodo } = useTodoStore();
  const { clinics, fetchClinics } = useClinicStore();

  const isEdit = !!editTodo;

  const form = useForm<TodoFormData>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      name: '',
      description: '',
      clinicId: '',
      priority: 'medium',
    },
  });

  // Fetch clinics when dialog opens
  useEffect(() => {
    if (open && clinics.length === 0) {
      fetchClinics({ limit: 100 });
    }
  }, [open, clinics.length, fetchClinics]);

  // Reset form when dialog opens/closes or editTodo changes
  useEffect(() => {
    if (open) {
      if (editTodo) {
        form.reset({
          name: editTodo.name,
          description: editTodo.description || '',
          clinicId: editTodo.clinic.id,
          priority: editTodo.priority,
        });
      } else {
        form.reset({
          name: '',
          description: '',
          clinicId: '',
          priority: 'medium',
        });
      }
    }
  }, [open, editTodo, form]);

  const onSubmit = async (data: TodoFormData) => {
    setIsSubmitting(true);

    try {
      let success: boolean;

      if (isEdit && editTodo) {
        success = await updateTodo(editTodo.id, data);
      } else {
        success = await createTodo(data);
      }

      if (success) {
        onOpenChange(false);
        onSuccess?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'แก้ไขงาน' : 'เพิ่มงานใหม่'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่องาน *</FormLabel>
                  <FormControl>
                    <Input placeholder="กรอกชื่องาน..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รายละเอียด</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Clinic */}
            <FormField
              control={form.control}
              name="clinicId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>คลินิก *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกคลินิก" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clinics.map((clinic) => (
                        <SelectItem key={clinic.id} value={clinic.id}>
                          {clinic.name.th || clinic.name.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ความสำคัญ</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกความสำคัญ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                ยกเลิก
              </Button>
              <Button type="submit" className='bg-purple-600 hover:bg-purple-700' disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEdit ? 'บันทึก' : 'เพิ่มงาน'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default TodoDialog;