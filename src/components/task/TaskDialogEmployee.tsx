import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CreateTaskForm, TaskPriority } from '@/types/task';
import { Flag, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Clinic {
  id: string;
  name: string;
}

interface EmployeeTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  clinics: Clinic[];
  onSubmit: (data: CreateTaskForm) => void;
}

const INITIAL_FORM = {
  name: '',
  description: '',
  priority: 'medium' as TaskPriority,
  clinicId: '',
};

export function EmployeeTaskDialog({
  open,
  onOpenChange,
  currentUserId,
  clinics,
  onSubmit,
}: EmployeeTaskDialogProps) {
  const [formData, setFormData] = useState(INITIAL_FORM);

  const handleSubmit = () => {
    // Auto-assign to current user and set backend dates
    const fullFormData: CreateTaskForm = {
      name: formData.name,
      description: formData.description,
      priority: formData.priority,
      startDate: new Date(),
      dueDate: new Date(),
      clinicId: formData.clinicId || clinics[0]?.id || '',
      process: [{
        name: '',
        assignee: [currentUserId],
        attachments: [],
        status: 'pending',
      }],
      workload: {
        video: [
          { section: 'Short', amount: 0 },
          { section: 'Medium', amount: 0 },
          { section: 'Long', amount: 0 }
        ],
        website: [
          { section: 'Landing Page', amount: 0 },
          { section: 'Sale Page', amount: 0 }
        ],
        image: [
          { section: 'CI', amount: 0 },
          { section: 'Artwork', amount: 0 },
          { section: 'โฆษณาโปรโมชั่น', amount: 0 },
          { section: 'Motion Graphic', amount: 0 },
          { section: 'รูปใส่กรอบแต่งรูป', amount: 0 },
          { section: 'อื่นๆ', amount: 0 }
        ],
        shooting: [
          { section: 'ถ่ายทำ', amount: 0 }
        ]
      },
      createdBy: currentUserId,
    };

    onSubmit(fullFormData);
    handleClose();
  };

  const handleClose = () => {
    setFormData(INITIAL_FORM);
    onOpenChange(false);
  };

  const getPriorityColor = (priority: TaskPriority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700 border-gray-300',
      medium: 'bg-blue-100 text-blue-700 border-blue-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      urgent: 'bg-red-100 text-red-700 border-red-300',
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

  const canSubmit = formData.name.trim() !== '' && formData.clinicId !== '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">สร้างงานใหม่</DialogTitle>
          <DialogDescription>
            สร้างงานและมอบหมายให้ตัวเอง
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="name">
              หัวข้อเรื่อง <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="ระบุชื่องาน..."
              autoFocus
            />
          </div>

          {/* Clinic Selection */}
          <div className="space-y-2">
            <Label htmlFor="clinic">
              คลินิก <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.clinicId}
              onValueChange={(value) => setFormData({ ...formData, clinicId: value })}
            >
              <SelectTrigger id="clinic">
                <SelectValue placeholder="เลือกคลินิก">
                  {formData.clinicId && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{clinics.find(c => c.id === formData.clinicId)?.name}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {clinics.length > 0 ? (
                  clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{clinic.name}</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    ไม่มีคลินิก
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">รายละเอียด</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="อธิบายรายละเอียดงาน..."
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>ระดับความสำคัญ</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((priority) => (
                <Button
                  key={priority}
                  type="button"
                  variant={formData.priority === priority ? 'default' : 'outline'}
                  className={cn(
                    'justify-start',
                    formData.priority === priority && getPriorityColor(priority)
                  )}
                  onClick={() => setFormData({ ...formData, priority })}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  {getPriorityLabel(priority)}
                </Button>
              ))}
            </div>
          </div>

          {/* Info Note */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-blue-700">
                <strong>หมายเหตุ:</strong> งานนี้จะเป็นรายงานประจำวัน
                วันที่เริ่มและกำหนดส่งจะถูกกำหนดภายในวันนี้
              </p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            ยกเลิก
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-purple-600 hover:bg-purple-700"
          >
            สร้างงาน
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}