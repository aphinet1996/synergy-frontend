export type TaskStatus = 'pending' | 'process' | 'review' | 'done' | 'delete';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ViewMode = 'status' | 'assignee' | 'clinic';

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  avatar?: string;
  username?: string;
  firstname?: string;
  lastname?: string;
  nickname?: string;
  position?: string;
}

export interface Comment {
  id: string;
  text: string;
  user: Pick<User, 'id' | 'firstname' | 'lastname'>;
  date: Date;
}

export interface ProcessAssignee {
  id: string;
  username?: string;
  firstname?: string;
  lastname?: string;
}

export interface Process {
  id: string;
  name: string;
  assignee: string[] | User[] | ProcessAssignee[];
  comments: Comment[];
  attachments: any[];
  status: string;  // เปลี่ยนเป็น string เพื่อรองรับค่าจาก backend
}

export interface WorkloadSection {
  section: string;
  amount: number;
}

export interface Workload {
  video: WorkloadSection[];
  website: WorkloadSection[];
  image: WorkloadSection[];
  shooting: WorkloadSection[];
}

// ✅ Clinic DTO ตรงกับ backend response
export interface TaskClinic {
  id: string;
  name: {
    en: string;
    th: string;
  };
}

// ✅ Assignee DTO ตรงกับ backend response
export interface TaskAssignee {
  id: string;
  firstname: string;
  lastname: string;
  nickname: string;
}

// ✅ Clinic สำหรับ dropdown (จาก GET /clinic/)
export interface Clinic {
  id: string;  // ObjectId
  name: {
    en: string;
    th: string;
  };
  clinicLevel?: string;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  attachments: any[];
  priority: TaskPriority;
  status: TaskStatus;
  tag: string[];
  startDate: Date;
  dueDate: Date;
  clinic: TaskClinic;
  process: Process[];
  workload?: Workload;
  createdBy: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  assignee?: TaskAssignee[];
  commentAmount?: number;
  attachmentsAmount?: number;
}

export interface Position {
  id: string;
  name: string;
  members: User[];
}

export interface CreateTaskForm {
  name: string;
  description: string;
  priority: TaskPriority;
  startDate: Date;
  dueDate: Date;
  clinicId: string;  // ObjectId
  process: Array<{
    name: string;
    assignee: string[];
    attachments: any[];
    status: TaskStatus;
  }>;
  workload: Workload;
  createdBy: string;
}

export interface CreateTaskRequest {
  name: string;
  description: string;
  attachments: any[];
  priority: TaskPriority;
  status: TaskStatus;
  tag: string[];
  startDate: string; // "MM/DD/YYYY"
  dueDate: string; // "MM/DD/YYYY"
  clinicId: string; // ✅ ObjectId
  process: Array<{
    name: string;
    assignee: string[];  // User ObjectIds
    attachments: any[];
    status: TaskStatus;
  }>;
  workload: Workload;
  createdBy: string;
}

export interface UpdateTaskRequest {
  name?: string;
  description?: string;
  attachments?: any[];
  priority?: TaskPriority;
  status?: TaskStatus;
  tag?: string[];
  startDate?: string;
  dueDate?: string;
  clinicId?: string;
  process?: Array<{
    id?: string;
    name: string;
    assignee: string[];
    attachments: any[];
    status: TaskStatus;
  }>;
  workload?: Workload;
  updatedBy?: string;
}

// Response types
export interface TaskListResponse {
  status: 'success';
  results: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: {
    tasks: Task[];
  };
}

export interface TaskDetailResponse {
  status: 'success';
  data: {
    task: Task;
  };
}