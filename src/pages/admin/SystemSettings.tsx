import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Bell,
  Shield,
  Database,
  Save,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  timezone: string;
  language: string;
  maintenanceMode: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  lineNotifications: boolean;
  taskReminders: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordMinLength: number;
  requireSpecialChar: boolean;
  maxLoginAttempts: number;
}

export default function SystemSettings() {
  const [saving, setSaving] = useState(false);

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    siteName: 'Curedent',
    siteDescription: 'ระบบจัดการคลินิกทันตกรรม',
    contactEmail: 'admin@curedent.com',
    timezone: 'Asia/Bangkok',
    language: 'th',
    maintenanceMode: false,
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    lineNotifications: false,
    taskReminders: true,
    dailyDigest: false,
    weeklyReport: true,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordMinLength: 8,
    requireSpecialChar: true,
    maxLoginAttempts: 5,
  });

  const handleSaveGeneral = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    toast.success('บันทึกการตั้งค่าทั่วไปเรียบร้อย');
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    toast.success('บันทึกการตั้งค่าการแจ้งเตือนเรียบร้อย');
  };

  const handleSaveSecurity = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    toast.success('บันทึกการตั้งค่าความปลอดภัยเรียบร้อย');
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">ทั่วไป</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">การแจ้งเตือน</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">ความปลอดภัย</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">ระบบ</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>การตั้งค่าทั่วไป</CardTitle>
              <CardDescription>ตั้งค่าพื้นฐานของระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">ชื่อระบบ</Label>
                  <Input
                    id="siteName"
                    value={generalSettings.siteName}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, siteName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">อีเมลติดต่อ</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={generalSettings.timezone}
                    onValueChange={(value) =>
                      setGeneralSettings({ ...generalSettings, timezone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Bangkok">Asia/Bangkok (GMT+7)</SelectItem>
                      <SelectItem value="Asia/Singapore">Asia/Singapore (GMT+8)</SelectItem>
                      <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">ภาษาเริ่มต้น</Label>
                  <Select
                    value={generalSettings.language}
                    onValueChange={(value) =>
                      setGeneralSettings({ ...generalSettings, language: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="th">ไทย</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">คำอธิบายระบบ</Label>
                <Textarea
                  id="siteDescription"
                  value={generalSettings.siteDescription}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label>โหมดบำรุงรักษา</Label>
                    {generalSettings.maintenanceMode && (
                      <Badge variant="destructive">เปิดใช้งาน</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    เมื่อเปิดใช้งาน ผู้ใช้ทั่วไปจะไม่สามารถเข้าถึงระบบได้
                  </p>
                </div>
                <Switch
                  checked={generalSettings.maintenanceMode}
                  onCheckedChange={(checked) =>
                    setGeneralSettings({ ...generalSettings, maintenanceMode: checked })
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  บันทึก
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>การตั้งค่าการแจ้งเตือน</CardTitle>
              <CardDescription>จัดการการแจ้งเตือนของระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>แจ้งเตือนทางอีเมล</Label>
                    <p className="text-sm text-gray-500">ส่งการแจ้งเตือนผ่านอีเมล</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        emailNotifications: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>แจ้งเตือนผ่าน LINE</Label>
                    <p className="text-sm text-gray-500">ส่งการแจ้งเตือนผ่าน LINE Notify</p>
                  </div>
                  <Switch
                    checked={notificationSettings.lineNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        lineNotifications: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>แจ้งเตือนงาน</Label>
                    <p className="text-sm text-gray-500">แจ้งเตือนเมื่อมีงานใกล้ถึงกำหนด</p>
                  </div>
                  <Switch
                    checked={notificationSettings.taskReminders}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        taskReminders: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>สรุปรายวัน</Label>
                    <p className="text-sm text-gray-500">ส่งสรุปงานทุกวัน</p>
                  </div>
                  <Switch
                    checked={notificationSettings.dailyDigest}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        dailyDigest: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>รายงานประจำสัปดาห์</Label>
                    <p className="text-sm text-gray-500">ส่งรายงานสรุปทุกสัปดาห์</p>
                  </div>
                  <Switch
                    checked={notificationSettings.weeklyReport}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        weeklyReport: checked,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  บันทึก
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>การตั้งค่าความปลอดภัย</CardTitle>
              <CardDescription>ตั้งค่าความปลอดภัยของระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">
                    บังคับให้ผู้ใช้ทุกคนใช้การยืนยันตัวตนแบบ 2 ขั้นตอน
                  </p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorAuth}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({ ...securitySettings, twoFactorAuth: checked })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (นาที)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        sessionTimeout: parseInt(e.target.value) || 30,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">จำนวนครั้งที่ล็อกอินผิดได้</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        maxLoginAttempts: parseInt(e.target.value) || 5,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">ความยาวรหัสผ่านขั้นต่ำ</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        passwordMinLength: parseInt(e.target.value) || 8,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>บังคับใช้อักขระพิเศษในรหัสผ่าน</Label>
                  <p className="text-sm text-gray-500">
                    รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว
                  </p>
                </div>
                <Switch
                  checked={securitySettings.requireSpecialChar}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({ ...securitySettings, requireSpecialChar: checked })
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSecurity} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  บันทึก
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Info */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลระบบ</CardTitle>
              <CardDescription>ข้อมูลและสถานะของระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">เวอร์ชัน</p>
                  <p className="text-lg font-medium">1.0.0</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Environment</p>
                  <p className="text-lg font-medium">Production</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Database</p>
                  <p className="text-lg font-medium">MongoDB</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Node.js Version</p>
                  <p className="text-lg font-medium">v20.x</p>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <p className="font-medium text-yellow-800">Danger Zone</p>
                </div>
                <p className="text-sm text-yellow-700 mb-4">
                  การดำเนินการเหล่านี้มีผลกระทบต่อระบบ โปรดใช้ความระมัดระวัง
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    ล้าง Cache
                  </Button>
                  <Button variant="outline" size="sm">
                    Restart Server
                  </Button>
                  <Button variant="destructive" size="sm">
                    Reset Database
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}