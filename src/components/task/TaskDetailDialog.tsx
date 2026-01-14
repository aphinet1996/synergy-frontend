import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Calendar } from '@/components/ui/calendar';
import type { Task, TaskStatus, TaskPriority, User } from '@/types/task';
import {
  Calendar as CalendarIcon,
  Clock,
  Flag,
  Paperclip,
  MessageSquare,
  Plus,
  User2,
  Building2,
  FileText,
  GitBranch,
  Briefcase,
  Send,
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { getTaskById as fetchTaskById, addCommentToProcess } from '@/services/taskService';

interface TaskDetailProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
}

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  users,
  onUpdate,
  // onDelete,
}: TaskDetailProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('task');
  // const { updateTask } = useTaskStore();
  const { user: currentUser } = useUser();

  useEffect(() => {
    if (open && task?.id) {
      setIsEditingName(false);
      setActiveTab('task');
      setActiveProcessId(null);

      // Always fetch full task details when dialog opens
      fetchTaskDetails(task.id);
    }
  }, [open, task?.id]);

  const fetchTaskDetails = async (taskId: string) => {
    setLoading(true);
    try {
      const response = await fetchTaskById(taskId);
      if (response.success && response.data?.task) {
        const fullTask = response.data.task;
        // Preserve createdBy name format if it's already a name
        if (task && task.createdBy && task.createdBy.includes(' ')) {
          fullTask.createdBy = task.createdBy;
        }
        setEditedTask(fullTask);
      } else {
        // Fallback to task from props if fetch fails
        setEditedTask(task);
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
      setEditedTask(task);
    } finally {
      setLoading(false);
    }
  };

  if (!task || !editedTask) return null;

  // Permission logic
  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';
  const isEmployee = currentUser?.role === 'employee' || currentUser?.role === 'developer';

  const isCreator = (() => {
    if (!currentUser) return false;
    if (editedTask.createdBy === currentUser.id) return true;
    const currentUserFullName = `${currentUser.firstname} ${currentUser.lastname}`.trim();
    if (editedTask.createdBy === currentUserFullName) return true;
    return false;
  })();

  const canEdit = (() => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (isEmployee && isCreator) return true;
    if (isEmployee && !isCreator) return false;
    if (isManager && editedTask.status === 'review') return false;
    if (isManager) return true;
    return false;
  })();

  // Helper functions
  const getUserName = (userIdOrObj: string | User | Pick<User, 'id' | 'firstname' | 'lastname'> | { id: string; username?: string; firstname?: string; lastname?: string }) => {
    if (typeof userIdOrObj === 'string') {
      if (userIdOrObj.includes(' ')) {
        return userIdOrObj;
      }
      const user = users.find(u => u.id === userIdOrObj);
      if (user) {
        if (user.firstname && user.lastname) {
          return `${user.firstname} ${user.lastname}`;
        }
        return user.name || user.username || userIdOrObj;
      }
      return userIdOrObj;
    }

    if (typeof userIdOrObj === 'object' && userIdOrObj !== null && 'id' in userIdOrObj) {
      // Handle object with firstname/lastname
      if ('firstname' in userIdOrObj && 'lastname' in userIdOrObj) {
        if (userIdOrObj.firstname && userIdOrObj.lastname) {
          return `${userIdOrObj.firstname} ${userIdOrObj.lastname}`;
        }
      }
      // Handle object with username
      if ('username' in userIdOrObj && userIdOrObj.username) {
        return userIdOrObj.username;
      }
      if ('name' in userIdOrObj && (userIdOrObj as any).name) {
        return (userIdOrObj as any).name;
      }
      // Lookup from users array
      const user = users.find(u => u.id === userIdOrObj.id);
      if (user) {
        if (user.firstname && user.lastname) {
          return `${user.firstname} ${user.lastname}`;
        }
        return user.name || user.username || 'ไม่ระบุ';
      }
    }

    return 'ไม่ระบุ';
  };

  const getStatusColor = (status: TaskStatus) => {
    const colors: Record<string, string> = {
      'pending': 'bg-gray-100 text-gray-700',
      'process': 'bg-blue-100 text-blue-700',
      'review': 'bg-yellow-100 text-yellow-700',
      'done': 'bg-green-100 text-green-700',
      'delete': 'bg-red-100 text-red-700',
      'todo': 'bg-gray-100 text-gray-700',
      'in-progress': 'bg-blue-100 text-blue-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: TaskStatus) => {
    const labels: Record<string, string> = {
      'pending': 'รอดำเนินการ',
      'process': 'กำลังดำเนินการ',
      'review': 'รอตรวจสอบ',
      'done': 'เสร็จสิ้น',
      'delete': 'ลบแล้ว',
      'todo': 'รอดำเนินการ',
      'in-progress': 'กำลังดำเนินการ',
    };
    return labels[status] || status;
  };

  // const getPriorityLabel = (priority: TaskPriority) => {
  //   const labels = {
  //     low: 'ต่ำ',
  //     medium: 'ปานกลาง',
  //     high: 'สูง',
  //     urgent: 'ด่วนมาก',
  //   };
  //   return labels[priority];
  // };

  // Handlers
  const handleUpdateField = async (field: keyof Task, value: any) => {
    if (!editedTask || !canEdit) return;

    setEditedTask(prev => prev ? { ...prev, [field]: value } : null);
    onUpdate(editedTask.id, { [field]: value });
  };

  // const handleProcessToggle = async (processId: string, completed: boolean) => {
  //   if (!editedTask || !currentUser) return;

  //   const updatedProcesses = editedTask.process.map(p =>
  //     p.id === processId ? { ...p, status: completed ? 'done' : 'pending' } : p
  //   );

  //   await handleUpdateField('process', updatedProcesses);
  // };

  const handleAddComment = async (processId: string) => {
    if (!newComment.trim() || !currentUser || !editedTask) return;

    try {
      const response = await addCommentToProcess(
        editedTask.id,
        processId,
        newComment.trim(),
        currentUser.id
      );

      if (response.success) {
        // สร้าง comment object ใหม่สำหรับ update local state
        const newCommentObj = {
          id: response.data?.comment?.id || Date.now().toString(),
          text: newComment.trim(),
          user: {
            id: currentUser.id,
            firstname: currentUser.firstname || '',
            lastname: currentUser.lastname || '',
          },
          date: new Date(),
        };

        // Update local state
        const updatedProcesses = editedTask.process.map(p => {
          if (p.id === processId) {
            return {
              ...p,
              comments: [...(p.comments || []), newCommentObj],
            };
          }
          return p;
        });

        setEditedTask({
          ...editedTask,
          process: updatedProcesses,
        });

        setNewComment('');
        setActiveProcessId(null);
      } else {
        console.error('Failed to add comment:', response.error);
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      // TODO: Show error toast
    }
  };

  // Calculate progress
  const totalProcesses = editedTask.process?.length || 0;
  const completedProcesses = editedTask.process?.filter(p => p.status === 'done').length || 0;
  const progressPercentage = totalProcesses > 0 ? (completedProcesses / totalProcesses) * 100 : 0;

  // Get all unique assignees
  const getAllAssignees = (): string[] => {
    const assigneeSet = new Set<string>();

    if (editedTask.assignee && editedTask.assignee.length > 0) {
      editedTask.assignee.forEach((a: any) => {
        const name = `${a.firstname || ''} ${a.lastname || ''}`.trim() || a.nickname || a.id;
        if (name) assigneeSet.add(name);
      });
    }

    if ((editedTask as any).assigneeNames && (editedTask as any).assigneeNames.length > 0) {
      (editedTask as any).assigneeNames.forEach((name: string) => assigneeSet.add(name));
    }

    if (assigneeSet.size === 0) {
      editedTask.process?.forEach(p => {
        p.assignee?.forEach(a => {
          if (typeof a === 'string') {
            assigneeSet.add(a);
          } else if (a && typeof a === 'object' && 'id' in a) {
            const user = a as User;
            const name = user.firstname && user.lastname
              ? `${user.firstname} ${user.lastname}`
              : user.name || user.id;
            assigneeSet.add(name);
          }
        });
      });
    }

    return Array.from(assigneeSet);
  };

  const allAssignees = getAllAssignees();
  // const totalComments = editedTask.process?.reduce((acc, p) => acc + (p.comments?.length || 0), 0) || 0;

  // Workload sections
  const workloadSections = [
    { key: 'video', label: 'Video', icon: '🎬' },
    { key: 'website', label: 'Website', icon: '🌐' },
    { key: 'image', label: 'Image', icon: '🖼️' },
    { key: 'shooting', label: 'Shooting', icon: '📸' },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
          <SheetTitle className="sr-only">
            รายละเอียดงาน: {editedTask.name}
          </SheetTitle>
          <SheetDescription className="sr-only">
            ดูและแก้ไขรายละเอียดงาน สถานะ และขั้นตอนการทำงาน
          </SheetDescription>

          <div className="space-y-3">
            {/* Permission Notice */}
            {/* {!canEdit && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  {isEmployee && !isCreator ? (
                    <><strong>อ่านอย่างเดียว:</strong> คุณสามารถแก้ไขได้เฉพาะงานที่คุณสร้างเท่านั้น</>
                  ) : isManager && editedTask.status === 'review' ? (
                    <><strong>อ่านอย่างเดียว:</strong> ไม่สามารถแก้ไขงานที่อยู่ในสถานะรอตรวจสอบได้</>
                  ) : (
                    <>คุณไม่มีสิทธิ์แก้ไขงานนี้</>
                  )}
                </p>
              </div>
            )} */}

            {/* Title and Status */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {isEditingName && canEdit ? (
                  <Input
                    value={editedTask.name}
                    onChange={(e) => setEditedTask({ ...editedTask, name: e.target.value })}
                    onBlur={() => {
                      handleUpdateField('name', editedTask.name);
                      setIsEditingName(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateField('name', editedTask.name);
                        setIsEditingName(false);
                      }
                      if (e.key === 'Escape') {
                        setEditedTask({ ...editedTask, name: task.name });
                        setIsEditingName(false);
                      }
                    }}
                    className="text-xl font-semibold -ml-3"
                    autoFocus
                  />
                ) : (
                  <h2
                    className={cn(
                      "text-xl font-semibold rounded px-2 py-1 -ml-2 inline-block",
                      canEdit ? "cursor-text hover:bg-gray-50" : "cursor-default"
                    )}
                    onClick={() => canEdit && setIsEditingName(true)}
                  >
                    {editedTask.name}
                  </h2>
                )}
              </div>
              <Badge className={cn(getStatusColor(editedTask.status), 'shrink-0')}>
                {getStatusLabel(editedTask.status)}
              </Badge>
            </div>

            {/* Progress Bar */}
            {totalProcesses > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {completedProcesses}/{totalProcesses} เสร็จแล้ว
                  </span>
                  <span className="text-muted-foreground">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="px-6 h-12 w-full justify-start rounded-none border-b bg-transparent flex-shrink-0">
            <TabsTrigger value="task" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 gap-2">
              <FileText className="h-4 w-4" />
              Task
            </TabsTrigger>
            <TabsTrigger value="flow" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 gap-2">
              <GitBranch className="h-4 w-4" />
              Flow
              {totalProcesses > 0 && (
                <Badge variant="secondary" className="ml-1 h-5">
                  {totalProcesses}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Task */}
          <TabsContent value="task" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full">
              <div className="px-6 py-4 space-y-6">
                {/* Status, Priority, Due date, Clinic */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Status */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Status
                    </Label>
                    <Select
                      value={editedTask.status}
                      onValueChange={(value: TaskStatus) => handleUpdateField('status', value)}
                      disabled={loading || !canEdit}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">รอดำเนินการ</SelectItem>
                        <SelectItem value="process">กำลังดำเนินการ</SelectItem>
                        <SelectItem value="review">รอตรวจสอบ</SelectItem>
                        <SelectItem value="done">เสร็จสิ้น</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Flag className="h-3 w-3" />
                      Priority
                    </Label>
                    <Select
                      value={editedTask.priority}
                      onValueChange={(value: TaskPriority) => handleUpdateField('priority', value)}
                      disabled={loading || !canEdit}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">ต่ำ</SelectItem>
                        <SelectItem value="medium">ปานกลาง</SelectItem>
                        <SelectItem value="high">สูง</SelectItem>
                        <SelectItem value="urgent">ด่วนมาก</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Due Date */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      Due date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-9 w-full justify-start text-left font-normal"
                          disabled={!canEdit}
                        >
                          {editedTask.dueDate
                            ? format(new Date(editedTask.dueDate), 'dd MMM yyyy', { locale: th })
                            : 'ไม่ระบุ'}
                        </Button>
                      </PopoverTrigger>
                      {canEdit && (
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={editedTask.dueDate ? new Date(editedTask.dueDate) : undefined}
                            onSelect={(date) => date && handleUpdateField('dueDate', date)}
                            initialFocus
                          />
                        </PopoverContent>
                      )}
                    </Popover>
                  </div>

                  {/* Clinic */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Clinic
                    </Label>
                    <div className="h-9 px-3 py-2 border rounded-md bg-muted/50 flex items-center">
                      <span className="text-sm">
                        {editedTask.clinic?.name?.th || editedTask.clinic?.name?.en || (editedTask as any).clinicId?.name?.th || (editedTask as any).clinicId?.name?.en || 'ไม่ระบุ'}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Assignee */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <User2 className="h-3 w-3" />
                    Assignee ({allAssignees.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {allAssignees.length > 0 ? (
                      allAssignees.map((name, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                              {name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{name}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">ไม่มีผู้รับผิดชอบ</span>
                    )}
                    {canEdit && (
                      <Button variant="outline" size="sm" className="h-8 gap-1">
                        <Plus className="h-3 w-3" />
                        เพิ่ม
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea
                    value={editedTask.description || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                    onBlur={() => handleUpdateField('description', editedTask.description)}
                    placeholder="เพิ่มรายละเอียด..."
                    className="min-h-[100px] resize-none"
                    disabled={!canEdit}
                  />
                </div>

                <Separator />

                {/* Attachment */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Paperclip className="h-3 w-3" />
                    Attachment ({editedTask.attachments?.length || 0})
                  </Label>
                  {editedTask.attachments && editedTask.attachments.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {editedTask.attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 border rounded-md">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate flex-1">{typeof file === 'string' ? file : file.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-md">
                      <div className="text-center">
                        <Paperclip className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">ยังไม่มีไฟล์แนบ</p>
                        {canEdit && (
                          <Button variant="outline" size="sm" className="mt-2">
                            เพิ่มไฟล์
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Workload */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    Workload
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {workloadSections.map((section) => {
                      const workloadData = editedTask.workload?.[section.key as keyof typeof editedTask.workload] || [];
                      const total = workloadData.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

                      return (
                        <div key={section.key} className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span>{section.icon}</span>
                            <span className="text-sm font-medium">{section.label}</span>
                            <Badge variant="secondary" className="ml-auto">{total}</Badge>
                          </div>
                          {workloadData.length > 0 && (
                            <div className="space-y-1">
                              {workloadData.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                                  <span>{item.section}</span>
                                  <span>{item.amount}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab 2: Flow */}
          <TabsContent value="flow" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full">
              <div className="px-6 py-4">
                {editedTask.process && editedTask.process.length > 0 ? (
                  <Accordion type="single" collapsible className="space-y-2">
                    {editedTask.process.map((process, index) => {
                      const isCompleted = process.status === 'done';
                      const processAssignees = process.assignee?.map(a => getUserName(a)) || [];
                      const processComments = process.comments || [];
                      const processAttachments = process.attachments || [];

                      return (
                        <AccordionItem
                          key={process.id || index}
                          value={process.id || `process-${index}`}
                          className="border rounded-lg px-4"
                        >
                          <AccordionTrigger className="hover:no-underline py-3">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex-1 text-left">
                                <div className={cn(
                                  "font-medium",
                                  isCompleted && "line-through text-muted-foreground"
                                )}>
                                  {process.name || `ขั้นตอนที่ ${index + 1}`}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                  {processAssignees.length > 0 && (
                                    <span className="flex items-center gap-1">
                                      <User2 className="h-3 w-3" />
                                      {processAssignees.length}
                                    </span>
                                  )}
                                  {processAttachments.length > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Paperclip className="h-3 w-3" />
                                      {processAttachments.length}
                                    </span>
                                  )}
                                  {processComments.length > 0 && (
                                    <span className="flex items-center gap-1">
                                      <MessageSquare className="h-3 w-3" />
                                      {processComments.length}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Badge className={cn(getStatusColor(process.status as TaskStatus), 'mr-2')}>
                                {getStatusLabel(process.status as TaskStatus)}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            <div className="space-y-4 pt-2">
                              {/* Assignee */}
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Assignee</Label>
                                <div className="flex flex-wrap gap-2">
                                  {processAssignees.length > 0 ? (
                                    processAssignees.map((name, idx) => (
                                      <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-muted rounded-full text-sm">
                                        <Avatar className="h-5 w-5">
                                          <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                                            {name.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        {name}
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-sm text-muted-foreground">ไม่มีผู้รับผิดชอบ</span>
                                  )}
                                </div>
                              </div>

                              {/* Attachments */}
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Attachment</Label>
                                {processAttachments.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {processAttachments.map((file, idx) => (
                                      <div key={idx} className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm">
                                        <Paperclip className="h-3 w-3" />
                                        {typeof file === 'string' ? file : 'ไฟล์แนบ'}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">ไม่มีไฟล์แนบ</span>
                                )}
                              </div>

                              {/* Status */}
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Status</Label>
                                <Select
                                  value={process.status}
                                  onValueChange={(value) => {
                                    if (!canEdit) return;
                                    const updatedProcesses = editedTask.process.map((p, i) =>
                                      i === index ? { ...p, status: value } : p
                                    );
                                    handleUpdateField('process', updatedProcesses);
                                  }}
                                  disabled={!canEdit}
                                >
                                  <SelectTrigger className="h-9 w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">รอดำเนินการ</SelectItem>
                                    <SelectItem value="process">กำลังดำเนินการ</SelectItem>
                                    <SelectItem value="review">รอตรวจสอบ</SelectItem>
                                    <SelectItem value="done">เสร็จสิ้น</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <Separator />

                              {/* Comments */}
                              <div className="space-y-3">
                                <Label className="text-xs text-muted-foreground">
                                  Comments ({processComments.length})
                                </Label>

                                {/* Comment List */}
                                {processComments.length > 0 && (
                                  <div className="space-y-3 max-h-[200px] overflow-y-auto">
                                    {processComments.map((comment, idx) => {
                                      const commentUserName = getUserName(comment.user);
                                      return (
                                        <div key={idx} className="flex gap-2">
                                          <Avatar className="h-7 w-7 flex-shrink-0">
                                            <AvatarFallback className="text-xs">
                                              {commentUserName.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1 bg-muted rounded-lg px-3 py-2">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-sm font-medium">{commentUserName}</span>
                                              <span className="text-xs text-muted-foreground">
                                                {comment.date && format(new Date(comment.date), 'dd MMM HH:mm', { locale: th })}
                                              </span>
                                            </div>
                                            <p className="text-sm">{comment.text}</p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Comment Input */}
                                <div className="flex gap-2">
                                  <Avatar className="h-7 w-7 flex-shrink-0">
                                    <AvatarFallback className="text-xs">
                                      {currentUser?.firstname?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 flex gap-2">
                                    <Input
                                      placeholder="เขียนความคิดเห็น..."
                                      value={activeProcessId === process.id ? newComment : ''}
                                      onChange={(e) => {
                                        setActiveProcessId(process.id);
                                        setNewComment(e.target.value);
                                      }}
                                      onFocus={() => setActiveProcessId(process.id)}
                                      className="h-9"
                                    />
                                    <Button
                                      size="sm"
                                      className="h-9 px-3"
                                      onClick={() => handleAddComment(process.id)}
                                      disabled={!newComment.trim() || activeProcessId !== process.id}
                                    >
                                      <Send className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">ยังไม่มีขั้นตอน</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      เพิ่มขั้นตอนเพื่อติดตามความคืบหน้าของงาน
                    </p>
                    {canEdit && (
                      <Button variant="outline" className="gap-2">
                        <Plus className="h-4 w-4" />
                        เพิ่มขั้นตอน
                      </Button>
                    )}
                  </div>
                )}

                {/* Add new process button */}
                {editedTask.process && editedTask.process.length > 0 && canEdit && (
                  <Button
                    variant="ghost"
                    className="w-full mt-4 justify-start text-muted-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มขั้นตอน
                  </Button>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}