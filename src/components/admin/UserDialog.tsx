// src/components/admin/UserDialog.tsx

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
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import type { UserSummary, UserRole } from '@/types/user';

const userSchema = z.object({
  username: z.string().min(3, 'Username ต้องมีอย่างน้อย 3 ตัวอักษร'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร').optional().or(z.literal('')),
  firstname: z.string().min(1, 'กรุณากรอกชื่อ'),
  lastname: z.string().min(1, 'กรุณากรอกนามสกุล'),
  nickname: z.string().optional(),
  tel: z.string().optional(),
  position: z.string().optional(),
  role: z.enum(['admin', 'manager', 'employee', 'developer']),
  isActive: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editUser?: UserSummary | null;
  onSuccess?: () => void;
}

const roleOptions: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'สิทธิ์เต็มในการจัดการระบบ' },
  { value: 'manager', label: 'Manager', description: 'จัดการงานและดูข้อมูลทีม' },
  { value: 'employee', label: 'Employee', description: 'ใช้งานทั่วไป' },
  { value: 'developer', label: 'Developer', description: 'สำหรับนักพัฒนา' },
];

export function UserDialog({ open, onOpenChange, editUser, onSuccess }: UserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isEdit = !!editUser;

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      password: '',
      firstname: '',
      lastname: '',
      nickname: '',
      tel: '',
      position: '',
      role: 'employee',
      isActive: true,
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (editUser) {
        // Parse name to firstname/lastname if needed
        const nameParts = editUser.name.split(' ');
        form.reset({
          username: '',
          password: '',
          firstname: nameParts[0] || '',
          lastname: nameParts.slice(1).join(' ') || '',
          nickname: '',
          tel: '',
          position: editUser.position || '',
          role: editUser.role,
          isActive: editUser.isActive ?? true,
        });
      } else {
        form.reset({
          username: '',
          password: '',
          firstname: '',
          lastname: '',
          nickname: '',
          tel: '',
          position: '',
          role: 'employee',
          isActive: true,
        });
      }
    }
  }, [open, editUser, form]);

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);

    try {
      // Call API to create/update user
      // if (isEdit) {
      //   await userService.updateUser(editUser.id, data);
      // } else {
      //   await userService.createUser(data);
      // }

      console.log('User data:', data);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">ข้อมูลพื้นฐาน</TabsTrigger>
                <TabsTrigger value="settings">ตั้งค่า</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                {/* Username & Password */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username *</FormLabel>
                        <FormControl>
                          <Input placeholder="username" {...field} disabled={isEdit} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isEdit ? 'รหัสผ่านใหม่' : 'รหัสผ่าน *'}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder={isEdit ? 'เว้นว่างหากไม่ต้องการเปลี่ยน' : '••••••'}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ชื่อ *</FormLabel>
                        <FormControl>
                          <Input placeholder="ชื่อ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>นามสกุล *</FormLabel>
                        <FormControl>
                          <Input placeholder="นามสกุล" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Nickname & Tel */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nickname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ชื่อเล่น</FormLabel>
                        <FormControl>
                          <Input placeholder="ชื่อเล่น" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>เบอร์โทร</FormLabel>
                        <FormControl>
                          <Input placeholder="0XX-XXX-XXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Position */}
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ตำแหน่ง</FormLabel>
                      <FormControl>
                        <Input placeholder="ตำแหน่งงาน" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                {/* Role */}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>บทบาท</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกบทบาท" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div>
                                <span className="font-medium">{option.label}</span>
                                <p className="text-xs text-gray-500">{option.description}</p>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Active Status */}
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">เปิดใช้งาน</FormLabel>
                        <FormDescription>
                          ผู้ใช้สามารถเข้าสู่ระบบได้เมื่อเปิดใช้งาน
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Role Permissions Info */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">สิทธิ์ตามบทบาท</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      <span className="font-medium text-red-600">Admin:</span> จัดการผู้ใช้,
                      คลินิก, ตั้งค่าระบบ
                    </li>
                    <li>
                      <span className="font-medium text-purple-600">Manager:</span> ดูงานทีม,
                      สร้างคลินิก, จัดการงาน
                    </li>
                    <li>
                      <span className="font-medium text-blue-600">Employee:</span> ใช้งานทั่วไป,
                      สร้าง/จัดการงานตัวเอง
                    </li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEdit ? 'บันทึก' : 'เพิ่มผู้ใช้'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default UserDialog;