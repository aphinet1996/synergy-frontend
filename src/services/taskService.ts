// import type { TaskListResponse, TaskDetailResponse, CreateTaskRequest, UpdateTaskRequest, Task, User, TaskClinic, TaskAssignee, Comment } from '@/types/task';

// const API_BASE = import.meta.env.VITE_API_BASE_URL || '/synergy/api';

// const getAccessToken = (): string | null => {
//   try {
//     const authStorage = localStorage.getItem('auth-storage');
//     if (authStorage) {
//       const parsed = JSON.parse(authStorage);
//       return parsed.state?.tokens?.accessToken || null;
//     }
//     return null;
//   } catch {
//     return null;
//   }
// };

// const formatDateToAPI = (date: Date | string): string => {
//   const d = typeof date === 'string' ? new Date(date) : date;
//   return d.toLocaleDateString('en-US', {
//     month: '2-digit',
//     day: '2-digit',
//     year: 'numeric',
//   });
// };

// interface ApiResponse<T> {
//   success: boolean;
//   data?: T;
//   error?: string;
// }

// export const getTasks = async (page: number = 1, limit: number = 10): Promise<ApiResponse<{ tasks: Task[]; pagination: TaskListResponse['pagination'] }>> => {
//   const token = getAccessToken();
//   console.log('Fetching tasks with token:', token ? 'exists' : 'missing');

//   const response = await fetch(`${API_BASE}/task/?page=${page}&limit=${limit}`, {
//     method: 'GET',
//     headers: {
//       'Content-Type': 'application/json',
//       ...(token && { Authorization: `Bearer ${token}` }),
//     },
//   });

//   if (!response.ok) {
//     console.error('Failed to fetch tasks:', response.status, response.statusText);
//     return { success: false, error: `Failed to fetch tasks: ${response.statusText}` };
//   }

//   const data: TaskListResponse = await response.json();
//   console.log('Raw tasks response:', data);

//   if (data.status !== 'success') {
//     return { success: false, error: 'Failed to fetch tasks' };
//   }

//   // ✅ Map tasks ตาม response ใหม่
//   const tasks: Task[] = data.data.tasks.map((task: any) => ({
//     id: task.id,
//     name: task.name,
//     description: task.description,
//     priority: task.priority,
//     status: task.status,
//     tag: task.tag || [],
//     attachments: task.attachments || [],
//     startDate: task.startDate ? new Date(task.startDate) : new Date(),
//     dueDate: new Date(task.dueDate),
//     // ✅ ใช้ clinic object ตรงๆ จาก response
//     clinic: {
//       id: task.clinic?.id || '',
//       name: {
//         en: task.clinic?.name?.en || '',
//         th: task.clinic?.name?.th || '',
//       }
//     },
//     // ✅ ใช้ assignee array ตรงๆ จาก response
//     assignee: (task.assignee || []).map((a: any) => ({
//       id: a.id || '',
//       firstname: a.firstname || '',
//       lastname: a.lastname || '',
//       nickname: a.nickname || '',
//     })),
//     process: task.process || [{
//       id: '1',
//       name: 'ขั้นตอนเริ่มต้น',
//       assignee: [],
//       comments: [],
//       attachments: [],
//       status: 'pending'
//     }],
//     workload: task.workload || {
//       video: [],
//       website: [],
//       image: [],
//       shooting: []
//     },
//     createdBy: task.createdBy || '',
//     createdAt: task.createdAt ? new Date(task.createdAt) : undefined,
//     updatedAt: task.updatedAt ? new Date(task.updatedAt) : undefined,
//     updatedBy: task.updatedBy,
//     commentAmount: task.commentAmount || 0,
//     attachmentsAmount: task.attachmentsAmount || 0,
//   }));

//   console.log('Mapped tasks:', tasks.map(t => ({ 
//     name: t.name, 
//     clinicId: t.clinic.id,
//     clinicName: t.clinic.name.th 
//   })));
  
//   return { success: true, data: { tasks, pagination: data.pagination } };
// };

// export const getTaskById = async (id: string): Promise<ApiResponse<{ task: Task }>> => {
//   const token = getAccessToken();
//   const response = await fetch(`${API_BASE}/task/${id}`, {
//     method: 'GET',
//     headers: {
//       'Content-Type': 'application/json',
//       ...(token && { Authorization: `Bearer ${token}` }),
//     },
//   });

//   if (!response.ok) {
//     return { success: false, error: `Failed to fetch task: ${response.statusText}` };
//   }

//   const data: TaskDetailResponse = await response.json();
//   console.log('getTaskById raw response:', data);
  
//   if (data.status !== 'success') {
//     return { success: false, error: 'Failed to fetch task' };
//   }

//   const taskData = data.data.task as any;
  
//   // ✅ Map clinic จาก clinicId (response ใช้ clinicId ไม่ใช่ clinic)
//   const clinic = taskData.clinicId || taskData.clinic;
  
//   const task: Task = {
//     id: taskData.id,
//     name: taskData.name,
//     description: taskData.description,
//     priority: taskData.priority,
//     status: taskData.status,
//     tag: taskData.tag || [],
//     attachments: taskData.attachments || [],
//     startDate: new Date(taskData.startDate),
//     dueDate: new Date(taskData.dueDate),
//     // ✅ Map clinic ถูกต้อง
//     clinic: {
//       id: clinic?.id || '',
//       name: {
//         en: clinic?.name?.en || '',
//         th: clinic?.name?.th || '',
//       }
//     },
//     // ✅ Map process พร้อม assignee
//     process: (taskData.process || []).map((p: any) => ({
//       id: p.id,
//       name: p.name,
//       status: p.status || 'pending',
//       // ✅ Keep assignee as-is (already has firstname, lastname, username)
//       assignee: p.assignee || [],
//       comments: (p.comments || []).map((c: any) => ({
//         ...c,
//         date: c.date ? new Date(c.date) : new Date(),
//       })),
//       attachments: p.attachments || [],
//     })),
//     workload: taskData.workload || {
//       video: [],
//       website: [],
//       image: [],
//       shooting: []
//     },
//     createdBy: taskData.createdBy || '',
//     updatedBy: taskData.updatedBy || '',
//     createdAt: taskData.createdAt ? new Date(taskData.createdAt) : undefined,
//     updatedAt: taskData.updatedAt ? new Date(taskData.updatedAt) : undefined,
//   };

//   console.log('getTaskById mapped task:', task);
//   return { success: true, data: { task } };
// };

// export const createTask = async (payload: CreateTaskRequest): Promise<ApiResponse<void>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   // ✅ ส่ง status เป็น 'pending'
//   const body: CreateTaskRequest = {
//     ...payload,
//     status: 'pending',
//     startDate: formatDateToAPI(payload.startDate),
//     dueDate: formatDateToAPI(payload.dueDate),
//     process: payload.process.map(p => ({
//       ...p,
//       status: 'pending'
//     })),
//   };

//   console.log('Creating task with body:', body);

//   const response = await fetch(`${API_BASE}/task/`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify(body),
//   });

//   if (!response.ok) {
//     const errorData = await response.json().catch(() => ({}));
//     console.error('Create task error:', errorData);
//     return { success: false, error: errorData.message || `Failed to create task: ${response.statusText}` };
//   }

//   const data = await response.json();
//   if (data.status !== 'success') {
//     return { success: false, error: data.message || 'Failed to create task' };
//   }

//   return { success: true };
// };

// export const updateTask = async (id: string, payload: UpdateTaskRequest): Promise<ApiResponse<void>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   const body: UpdateTaskRequest = {
//     ...payload,
//     ...(payload.startDate && { startDate: formatDateToAPI(payload.startDate) }),
//     ...(payload.dueDate && { dueDate: formatDateToAPI(payload.dueDate) }),
//   };

//   const response = await fetch(`${API_BASE}/task/${id}`, {
//     method: 'PUT',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify(body),
//   });

//   if (!response.ok) {
//     return { success: false, error: `Failed to update task: ${response.statusText}` };
//   }

//   const data = await response.json();
//   if (data.status !== 'success') {
//     return { success: false, error: data.message || 'Failed to update task' };
//   }

//   return { success: true };
// };

// export const deleteTask = async (id: string): Promise<ApiResponse<void>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   const response = await fetch(`${API_BASE}/task/${id}`, {
//     method: 'DELETE',
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });

//   if (!response.ok && response.status !== 204) {
//     return { success: false, error: `Failed to delete task: ${response.statusText}` };
//   }

//   return { success: true };
// };

// // ✅ Add comment to process
// export const addCommentToProcess = async (
//   taskId: string,
//   processId: string,
//   text: string,
//   userId: string
// ): Promise<ApiResponse<{ comment: Comment }>> => {
//   const token = getAccessToken();
//   if (!token) {
//     return { success: false, error: 'No access token available' };
//   }

//   const response = await fetch(`${API_BASE}/task/${taskId}/process/${processId}/comment`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify({
//       text,
//       user: userId,
//     }),
//   });

//   if (!response.ok) {
//     const errorData = await response.json().catch(() => ({}));
//     return { success: false, error: errorData.message || `Failed to add comment: ${response.statusText}` };
//   }

//   const data = await response.json();
//   return { success: true, data: { comment: data.data?.comment || data.comment } };
// };

// export const taskService = {
//   getTasks,
//   getTaskById,
//   createTask,
//   updateTask,
//   deleteTask,
//   addCommentToProcess,
// };

// // Fetch all users
// export const getUsers = async (): Promise<ApiResponse<{ users: User[] }>> => {
//   try {
//     const token = getAccessToken();
//     const response = await fetch(`${API_BASE}/user/`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         ...(token && { Authorization: `Bearer ${token}` }),
//       },
//     });

//     if (!response.ok) {
//       console.warn('User endpoint not available or error:', response.statusText);
//       return { success: true, data: { users: [] } };
//     }

//     const data = await response.json();
//     let users: User[] = [];

//     const mapUser = (user: any): User => ({
//       id: user.id || user._id,
//       username: user.username,
//       firstname: user.firstname,
//       lastname: user.lastname,
//       nickname: user.nickname,
//       name: user.name || `${user.firstname || ''} ${user.lastname || ''}`.trim(),
//       role: user.role,
//       position: user.position,
//       avatar: user.avatar,
//     });

//     if (data.data?.users && Array.isArray(data.data.users)) {
//       users = data.data.users.map(mapUser);
//     } else if (data.users && Array.isArray(data.users)) {
//       users = data.users.map(mapUser);
//     } else if (Array.isArray(data)) {
//       users = data.map(mapUser);
//     }

//     return { success: true, data: { users } };
//   } catch (error) {
//     console.warn('Error fetching users:', error);
//     return { success: true, data: { users: [] } };
//   }
// };

// // ✅ Fetch all clinics - เก็บ ObjectId สำหรับสร้าง task
// export const getClinics = async (): Promise<ApiResponse<{ clinics: any[] }>> => {
//   try {
//     const token = getAccessToken();
//     const response = await fetch(`${API_BASE}/clinic/`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//         ...(token && { Authorization: `Bearer ${token}` }),
//       },
//     });

//     if (!response.ok) {
//       console.warn('Clinic endpoint not available or error:', response.statusText);
//       return { success: true, data: { clinics: [] } };
//     }

//     const data = await response.json();
//     let clinics: any[] = [];

//     const mapClinic = (clinic: any) => ({
//       id: clinic.id || clinic._id,  // ✅ ObjectId
//       name: {
//         en: clinic.name?.en || '',
//         th: clinic.name?.th || '',
//       },
//       clinicLevel: clinic.clinicLevel,
//     });

//     if (data.data?.clinics && Array.isArray(data.data.clinics)) {
//       clinics = data.data.clinics.map(mapClinic);
//     } else if (data.clinics && Array.isArray(data.clinics)) {
//       clinics = data.clinics.map(mapClinic);
//     } else if (Array.isArray(data)) {
//       clinics = data.map(mapClinic);
//     }

//     console.log('Mapped clinics:', clinics);
//     return { success: true, data: { clinics } };
//   } catch (error) {
//     console.warn('Error fetching clinics:', error);
//     return { success: true, data: { clinics: [] } };
//   }
// };

import type { TaskListResponse, TaskDetailResponse, CreateTaskRequest, UpdateTaskRequest, Task, User, Comment, TaskStatus } from '@/types/task';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/synergy/api';

const getAccessToken = (): string | null => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed.state?.tokens?.accessToken || null;
    }
    return null;
  } catch {
    return null;
  }
};

const formatDateToAPI = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const getTasks = async (page: number = 1, limit: number = 10): Promise<ApiResponse<{ tasks: Task[]; pagination: TaskListResponse['pagination'] }>> => {
  const token = getAccessToken();
  console.log('Fetching tasks with token:', token ? 'exists' : 'missing');

  const response = await fetch(`${API_BASE}/task/?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    console.error('Failed to fetch tasks:', response.status, response.statusText);
    return { success: false, error: `Failed to fetch tasks: ${response.statusText}` };
  }

  const data: TaskListResponse = await response.json();
  console.log('Raw tasks response:', data);

  if (data.status !== 'success') {
    return { success: false, error: 'Failed to fetch tasks' };
  }

  // ✅ Map tasks ตาม response ใหม่
  const tasks: Task[] = data.data.tasks.map((task: any) => ({
    id: task.id,
    name: task.name,
    description: task.description,
    priority: task.priority,
    status: task.status,
    tag: task.tag || [],
    attachments: task.attachments || [],
    startDate: task.startDate ? new Date(task.startDate) : new Date(),
    dueDate: new Date(task.dueDate),
    // ✅ ใช้ clinic object ตรงๆ จาก response
    clinic: {
      id: task.clinic?.id || '',
      name: {
        en: task.clinic?.name?.en || '',
        th: task.clinic?.name?.th || '',
      }
    },
    // ✅ ใช้ assignee array ตรงๆ จาก response
    assignee: (task.assignee || []).map((a: any) => ({
      id: a.id || '',
      firstname: a.firstname || '',
      lastname: a.lastname || '',
      nickname: a.nickname || '',
    })),
    // ✅ Map process พร้อม assignee objects
    process: (task.process || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      status: p.status || 'pending',
      assignee: p.assignee || [],
      comments: (p.comments || []).map((c: any) => ({
        ...c,
        date: c.date ? new Date(c.date) : new Date(),
      })),
      attachments: p.attachments || [],
    })),
    workload: task.workload || {
      video: [],
      website: [],
      image: [],
      shooting: []
    },
    createdBy: task.createdBy || '',
    createdAt: task.createdAt ? new Date(task.createdAt) : undefined,
    updatedAt: task.updatedAt ? new Date(task.updatedAt) : undefined,
    updatedBy: task.updatedBy,
    commentAmount: task.commentAmount || 0,
    attachmentsAmount: task.attachmentsAmount || 0,
  }));

  console.log('Mapped tasks:', tasks.map(t => ({ 
    name: t.name, 
    clinicId: t.clinic.id,
    clinicName: t.clinic.name.th 
  })));
  
  return { success: true, data: { tasks, pagination: data.pagination } };
};

export const getTaskById = async (id: string): Promise<ApiResponse<{ task: Task }>> => {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE}/task/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    return { success: false, error: `Failed to fetch task: ${response.statusText}` };
  }

  const data: TaskDetailResponse = await response.json();
  console.log('getTaskById raw response:', data);
  
  if (data.status !== 'success') {
    return { success: false, error: 'Failed to fetch task' };
  }

  const taskData = data.data.task as any;
  
  // ✅ Map clinic จาก clinicId (response ใช้ clinicId ไม่ใช่ clinic)
  const clinic = taskData.clinicId || taskData.clinic;
  
  const task: Task = {
    id: taskData.id,
    name: taskData.name,
    description: taskData.description,
    priority: taskData.priority,
    status: taskData.status,
    tag: taskData.tag || [],
    attachments: taskData.attachments || [],
    startDate: new Date(taskData.startDate),
    dueDate: new Date(taskData.dueDate),
    // ✅ Map clinic ถูกต้อง
    clinic: {
      id: clinic?.id || '',
      name: {
        en: clinic?.name?.en || '',
        th: clinic?.name?.th || '',
      }
    },
    // ✅ Map process พร้อม assignee
    process: (taskData.process || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      status: p.status || 'pending',
      // ✅ Keep assignee as-is (already has firstname, lastname, username)
      assignee: p.assignee || [],
      comments: (p.comments || []).map((c: any) => ({
        ...c,
        date: c.date ? new Date(c.date) : new Date(),
      })),
      attachments: p.attachments || [],
    })),
    workload: taskData.workload || {
      video: [],
      website: [],
      image: [],
      shooting: []
    },
    createdBy: taskData.createdBy || '',
    updatedBy: taskData.updatedBy || '',
    createdAt: taskData.createdAt ? new Date(taskData.createdAt) : undefined,
    updatedAt: taskData.updatedAt ? new Date(taskData.updatedAt) : undefined,
  };

  console.log('getTaskById mapped task:', task);
  return { success: true, data: { task } };
};

export const createTask = async (payload: CreateTaskRequest): Promise<ApiResponse<void>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  // ✅ ส่ง status เป็น 'pending'
  const body: CreateTaskRequest = {
    ...payload,
    status: 'pending',
    startDate: formatDateToAPI(payload.startDate),
    dueDate: formatDateToAPI(payload.dueDate),
    process: payload.process.map(p => ({
      ...p,
      status: 'pending'
    })),
  };

  console.log('Creating task with body:', body);

  const response = await fetch(`${API_BASE}/task/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Create task error:', errorData);
    return { success: false, error: errorData.message || `Failed to create task: ${response.statusText}` };
  }

  const data = await response.json();
  if (data.status !== 'success') {
    return { success: false, error: data.message || 'Failed to create task' };
  }

  return { success: true };
};

export const updateTask = async (id: string, payload: UpdateTaskRequest): Promise<ApiResponse<void>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  const body: UpdateTaskRequest = {
    ...payload,
    ...(payload.startDate && { startDate: formatDateToAPI(payload.startDate) }),
    ...(payload.dueDate && { dueDate: formatDateToAPI(payload.dueDate) }),
  };

  const response = await fetch(`${API_BASE}/task/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return { success: false, error: `Failed to update task: ${response.statusText}` };
  }

  const data = await response.json();
  if (data.status !== 'success') {
    return { success: false, error: data.message || 'Failed to update task' };
  }

  return { success: true };
};

export const deleteTask = async (id: string): Promise<ApiResponse<void>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  const response = await fetch(`${API_BASE}/task/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    return { success: false, error: `Failed to delete task: ${response.statusText}` };
  }

  return { success: true };
};

// ✅ NEW: Update process status - สำหรับ Employee อัปเดตสถานะ process ของตัวเอง
export const updateProcessStatus = async (
  taskId: string,
  processId: string,
  status: TaskStatus
): Promise<ApiResponse<{ task?: Task }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  const response = await fetch(`${API_BASE}/task/${taskId}/process/${processId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { success: false, error: errorData.message || `Failed to update process status: ${response.statusText}` };
  }

  const data = await response.json();

  if (data.status !== 'success') {
    return { success: false, error: data.message || 'Failed to update process status' };
  }

  return { success: true, data: data.data };
};

// ✅ Add comment to process
export const addCommentToProcess = async (
  taskId: string,
  processId: string,
  text: string,
  userId: string
): Promise<ApiResponse<{ comment: Comment }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  const response = await fetch(`${API_BASE}/task/${taskId}/process/${processId}/comment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      text,
      user: userId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return { success: false, error: errorData.message || `Failed to add comment: ${response.statusText}` };
  }

  const data = await response.json();
  return { success: true, data: { comment: data.data?.comment || data.comment } };
};

export const taskService = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateProcessStatus,  // ✅ เพิ่มบรรทัดนี้
  addCommentToProcess,
};

// Fetch all users
export const getUsers = async (): Promise<ApiResponse<{ users: User[] }>> => {
  try {
    const token = getAccessToken();
    const response = await fetch(`${API_BASE}/user/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      console.warn('User endpoint not available or error:', response.statusText);
      return { success: true, data: { users: [] } };
    }

    const data = await response.json();
    let users: User[] = [];

    const mapUser = (user: any): User => ({
      id: user.id || user._id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      nickname: user.nickname,
      name: user.name || `${user.firstname || ''} ${user.lastname || ''}`.trim(),
      role: user.role,
      position: user.position,
      avatar: user.avatar,
    });

    if (data.data?.users && Array.isArray(data.data.users)) {
      users = data.data.users.map(mapUser);
    } else if (data.users && Array.isArray(data.users)) {
      users = data.users.map(mapUser);
    } else if (Array.isArray(data)) {
      users = data.map(mapUser);
    }

    return { success: true, data: { users } };
  } catch (error) {
    console.warn('Error fetching users:', error);
    return { success: true, data: { users: [] } };
  }
};

// ✅ Fetch all clinics - เก็บ ObjectId สำหรับสร้าง task
export const getClinics = async (): Promise<ApiResponse<{ clinics: any[] }>> => {
  try {
    const token = getAccessToken();
    const response = await fetch(`${API_BASE}/clinic/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      console.warn('Clinic endpoint not available or error:', response.statusText);
      return { success: true, data: { clinics: [] } };
    }

    const data = await response.json();
    let clinics: any[] = [];

    const mapClinic = (clinic: any) => ({
      id: clinic.id || clinic._id,  // ✅ ObjectId
      name: {
        en: clinic.name?.en || '',
        th: clinic.name?.th || '',
      },
      clinicLevel: clinic.clinicLevel,
    });

    if (data.data?.clinics && Array.isArray(data.data.clinics)) {
      clinics = data.data.clinics.map(mapClinic);
    } else if (data.clinics && Array.isArray(data.clinics)) {
      clinics = data.clinics.map(mapClinic);
    } else if (Array.isArray(data)) {
      clinics = data.map(mapClinic);
    }

    console.log('Mapped clinics:', clinics);
    return { success: true, data: { clinics } };
  } catch (error) {
    console.warn('Error fetching clinics:', error);
    return { success: true, data: { clinics: [] } };
  }
};