import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Shield,
  Users,
  Building2,
  ClipboardList,
  Settings,
  Eye,
  Pencil,
  Trash2,
  Plus,
  Save,
  RefreshCw,
  CheckCircle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  permissions: string[];
  usersCount: number;
  isSystem: boolean;
}

const modules = [
  { id: 'users', name: 'ผู้ใช้', icon: <Users className="h-4 w-4" /> },
  { id: 'clinics', name: 'คลินิก', icon: <Building2 className="h-4 w-4" /> },
  { id: 'tasks', name: 'งาน', icon: <ClipboardList className="h-4 w-4" /> },
  { id: 'settings', name: 'ตั้งค่า', icon: <Settings className="h-4 w-4" /> },
];

const allPermissions: Permission[] = [
  // Users
  { id: 'users.view', name: 'ดูผู้ใช้', description: 'ดูรายการผู้ใช้ทั้งหมด', module: 'users' },
  { id: 'users.create', name: 'สร้างผู้ใช้', description: 'สร้างผู้ใช้ใหม่', module: 'users' },
  { id: 'users.edit', name: 'แก้ไขผู้ใช้', description: 'แก้ไขข้อมูลผู้ใช้', module: 'users' },
  { id: 'users.delete', name: 'ลบผู้ใช้', description: 'ลบผู้ใช้', module: 'users' },
  // Clinics
  { id: 'clinics.view', name: 'ดูคลินิก', description: 'ดูรายการคลินิกทั้งหมด', module: 'clinics' },
  { id: 'clinics.create', name: 'สร้างคลินิก', description: 'สร้างคลินิกใหม่', module: 'clinics' },
  { id: 'clinics.edit', name: 'แก้ไขคลินิก', description: 'แก้ไขข้อมูลคลินิก', module: 'clinics' },
  { id: 'clinics.delete', name: 'ลบคลินิก', description: 'ลบคลินิก', module: 'clinics' },
  // Tasks
  { id: 'tasks.view', name: 'ดูงาน', description: 'ดูรายการงานทั้งหมด', module: 'tasks' },
  { id: 'tasks.create', name: 'สร้างงาน', description: 'สร้างงานใหม่', module: 'tasks' },
  { id: 'tasks.edit', name: 'แก้ไขงาน', description: 'แก้ไขข้อมูลงาน', module: 'tasks' },
  { id: 'tasks.delete', name: 'ลบงาน', description: 'ลบงาน', module: 'tasks' },
  { id: 'tasks.assign', name: 'มอบหมายงาน', description: 'มอบหมายงานให้ผู้อื่น', module: 'tasks' },
  { id: 'tasks.team', name: 'ดูงานทีม', description: 'ดูงานของสมาชิกในทีม', module: 'tasks' },
  // Settings
  { id: 'settings.view', name: 'ดูตั้งค่า', description: 'ดูการตั้งค่าระบบ', module: 'settings' },
  { id: 'settings.edit', name: 'แก้ไขตั้งค่า', description: 'แก้ไขการตั้งค่าระบบ', module: 'settings' },
];

const initialRoles: Role[] = [
  {
    id: 'admin',
    name: 'admin',
    displayName: 'Admin',
    description: 'ผู้ดูแลระบบ มีสิทธิ์เต็มทุกอย่าง',
    color: 'bg-red-100 text-red-700',
    permissions: allPermissions.map((p) => p.id),
    usersCount: 2,
    isSystem: true,
  },
  {
    id: 'manager',
    name: 'manager',
    displayName: 'Manager',
    description: 'ผู้จัดการ สามารถจัดการงานและดูข้อมูลทีม',
    color: 'bg-purple-100 text-purple-700',
    permissions: [
      'users.view',
      'clinics.view',
      'clinics.create',
      'clinics.edit',
      'tasks.view',
      'tasks.create',
      'tasks.edit',
      'tasks.delete',
      'tasks.assign',
      'tasks.team',
    ],
    usersCount: 5,
    isSystem: true,
  },
  {
    id: 'employee',
    name: 'employee',
    displayName: 'Employee',
    description: 'พนักงาน ใช้งานทั่วไป',
    color: 'bg-blue-100 text-blue-700',
    permissions: ['clinics.view', 'tasks.view', 'tasks.create', 'tasks.edit'],
    usersCount: 41,
    isSystem: true,
  },
];

export default function RolesManagement() {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);

  const handlePermissionToggle = (permissionId: string) => {
    if (!selectedRole) return;

    const newPermissions = selectedRole.permissions.includes(permissionId)
      ? selectedRole.permissions.filter((p) => p !== permissionId)
      : [...selectedRole.permissions, permissionId];

    setSelectedRole({ ...selectedRole, permissions: newPermissions });
  };

  const handleSave = async () => {
    if (!selectedRole) return;

    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setRoles(roles.map((r) => (r.id === selectedRole.id ? selectedRole : r)));
    setSaving(false);
    toast.success('บันทึกสิทธิ์เรียบร้อย');
  };

  const getModulePermissions = (moduleId: string) => {
    return allPermissions.filter((p) => p.module === moduleId);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Roles List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              บทบาททั้งหมด
            </CardTitle>
            <CardDescription>เลือกบทบาทเพื่อจัดการสิทธิ์</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {roles.map((role) => (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedRole?.id === role.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={role.color}>
                        {role.displayName}
                      </Badge>
                      {role.isSystem && (
                        <Badge variant="outline" className="text-xs">
                          System
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {role.usersCount} คน
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {role.permissions.length} สิทธิ์
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Permissions Editor */}
      <div className="lg:col-span-2">
        {selectedRole ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="outline" className={selectedRole.color}>
                      {selectedRole.displayName}
                    </Badge>
                    จัดการสิทธิ์
                  </CardTitle>
                  <CardDescription>{selectedRole.description}</CardDescription>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  บันทึก
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={modules.map((m) => m.id)}>
                {modules.map((module) => {
                  const modulePermissions = getModulePermissions(module.id);
                  const enabledCount = modulePermissions.filter((p) =>
                    selectedRole.permissions.includes(p.id)
                  ).length;

                  return (
                    <AccordionItem key={module.id} value={module.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">{module.icon}</div>
                          <div className="text-left">
                            <p className="font-medium">{module.name}</p>
                            <p className="text-sm text-gray-500">
                              {enabledCount}/{modulePermissions.length} สิทธิ์
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          {modulePermissions.map((permission) => {
                            const isEnabled = selectedRole.permissions.includes(permission.id);

                            return (
                              <div
                                key={permission.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  {isEnabled ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <X className="h-4 w-4 text-gray-300" />
                                  )}
                                  <div>
                                    <p className="font-medium text-sm">{permission.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {permission.description}
                                    </p>
                                  </div>
                                </div>
                                <Switch
                                  checked={isEnabled}
                                  onCheckedChange={() => handlePermissionToggle(permission.id)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">เลือกบทบาทเพื่อจัดการสิทธิ์</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}