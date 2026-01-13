// export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'pending';
// export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
// export type ViewMode = 'status' | 'assignee' | 'clinic';

// export interface User {
//   id: string;
//   name: string;
//   role: 'admin' | 'manager' | 'employee';
//   avatar?: string;
//   username?: string;
//   firstname?: string;
//   lastname?: string;
//   position?: string;
// }

// export interface Comment {
//   id: string;
//   text: string;
//   user: Pick<User, 'id' | 'firstname' | 'lastname'>;
//   date: Date;
// }

// export interface Process {
//   id: string;
//   name: string;
//   assignee: string[] | User[];
//   comments: Comment[];
//   attachments: any[];
//   status: 'pending' | 'completed';
// }

// export interface WorkloadSection {
//   section: string;
//   amount: number;
// }

// export interface Workload {
//   video: WorkloadSection[];
//   website: WorkloadSection[];
//   image: WorkloadSection[];
//   shooting: WorkloadSection[];
// }

// export interface Clinic {
//   id: string;
//   name: {
//     en: string;
//     th: string;
//   };
//   clinicLevel?: string;
// }

// export interface Task {
//   id: string;
//   name: string;
//   description?: string;
//   attachments: any[];
//   priority: TaskPriority;
//   status: TaskStatus;
//   tag: string[];
//   startDate: Date;
//   dueDate: Date;
//   clinicId: Clinic;
//   process: Process[];
//   workload?: Workload;
//   createdBy: string;
//   updatedBy: string;
//   createdAt?: Date;
//   updatedAt?: Date;
//   assigneeId?: string;
//   assigneeNames?: string[]; // เพิ่มสำหรับเก็บชื่อ assignees จาก backend
//   clinicName?: string;
//   commentAmount?: number;
//   attachmentsAmount?: number;
// }

// export interface Position {
//   id: string;
//   name: string;
//   members: User[];
// }

// export interface CreateTaskForm {
//   name: string;
//   description: string;
//   priority: TaskPriority;
//   startDate: Date;
//   dueDate: Date;
//   clinicId: string;
//   process: Array<{
//     name: string;
//     assignee: string[];
//     attachments: any[];
//     status: 'pending' | 'completed';
//   }>;
//   workload: Workload;
//   createdBy: string;
// }

// export interface CreateTaskRequest {
//   name: string;
//   description: string;
//   attachments: any[];
//   priority: TaskPriority;
//   status: TaskStatus;
//   tag: string[];
//   startDate: string; // "MM/DD/YYYY"
//   dueDate: string; // "MM/DD/YYYY"
//   clinicId: string;
//   process: Array<{
//     name: string;
//     assignee: string[];
//     attachments: any[];
//     status: 'pending' | 'completed';
//   }>;
//   workload: Workload;
//   createdBy: string;
// }

// export interface UpdateTaskRequest {
//   name?: string;
//   description?: string;
//   attachments?: any[];
//   priority?: TaskPriority;
//   status?: TaskStatus;
//   tag?: string[];
//   startDate?: string;
//   dueDate?: string;
//   clinicId?: string;
//   process?: Array<{
//     id?: string;
//     name: string;
//     assignee: string[];
//     attachments: any[];
//     status: 'pending' | 'completed';
//   }>;
//   workload?: Workload;
//   updatedBy?: string;
// }

// // Response types
// export interface TaskListResponse {
//   status: 'success';
//   results: number;
//   pagination: {
//     page: number;
//     limit: number;
//     total: number;
//     totalPages: number;
//   };
//   data: {
//     tasks: Task[];
//   };
// }

// export interface TaskDetailResponse {
//   status: 'success';
//   data: {
//     task: Task;
//   };
// }

// ✅ อัพเดทให้ตรงกับ backend response ใหม่

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
  id: string;  // ObjectId
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
  clinic: TaskClinic;           // ✅ เปลี่ยนจาก clinicId เป็น clinic
  process: Process[];
  workload?: Workload;
  createdBy: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  assignee?: TaskAssignee[];    // ✅ เพิ่ม assignee array
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