// import { create } from 'zustand';
// import { devtools } from 'zustand/middleware';
// import type { Task, User, TaskStatus, Clinic, Position, CreateTaskRequest, UpdateTaskRequest } from '@/types/task';
// import { taskService, getUsers, getClinics } from '@/services/taskService';
// import { userService } from '@/services/userService';

// interface TaskState {
//   tasks: Task[];
//   users: User[];
//   clinics: Clinic[];
//   positions: Position[];
//   currentUser: User | null;
//   pagination: {
//     page: number;
//     limit: number;
//     total: number;
//     totalPages: number;
//   } | null;
//   loading: boolean;
//   error: string | null;

//   fetchTasks: (page?: number, limit?: number) => Promise<void>;
//   getTaskById: (id: string) => Promise<Task | null>;
//   fetchUsers: () => Promise<void>;
//   fetchClinics: () => Promise<void>;
//   fetchPositions: () => Promise<void>;
//   fetchCurrentUser: () => Promise<void>;
//   fetchAll: () => Promise<void>;

//   createTask: (data: CreateTaskRequest) => Promise<{ success: boolean; error?: string }>;
//   updateTask: (id: string, data: UpdateTaskRequest) => Promise<{ success: boolean; error?: string }>;
//   deleteTask: (id: string) => Promise<{ success: boolean; error?: string }>;
//   updateTaskStatus: (id: string, status: TaskStatus) => Promise<{ success: boolean; error?: string }>;

//   reset: () => void;
//   clearError: () => void;
//   setPage: (page: number) => void;
// }

// export const useTaskStore = create<TaskState>()(
//   devtools(
//     (set, get) => ({
//       tasks: [],
//       users: [],
//       clinics: [],
//       positions: [],
//       currentUser: null,
//       pagination: null,
//       loading: false,
//       error: null,

//       fetchTasks: async (page = 1, limit = 10) => {
//         set({ loading: true, error: null });
//         const response = await taskService.getTasks(page, limit);

//         if (response.success && response.data) {
//           console.log('taskStore: Tasks fetched successfully:', response.data.tasks);
//           set({
//             tasks: response.data.tasks,
//             pagination: response.data.pagination,
//             loading: false
//           });
//         } else {
//           console.error('taskStore: Failed to fetch tasks:', response.error);
//           set({ error: response.error || 'Failed to fetch tasks', loading: false });
//         }
//       },

//       getTaskById: async (id: string) => {
//         const response = await taskService.getTaskById(id);
//         if (response.success && response.data) {
//           set((state) => ({
//             tasks: state.tasks.map((t) => t.id === id ? response.data!.task : t),
//           }));
//           return response.data.task;
//         } else {
//           set({ error: response.error || 'Failed to fetch task' });
//           return null;
//         }
//       },

//       fetchUsers: async () => {
//         try {
//           const response = await getUsers();
//           if (response.success && response.data) {
//             set({ users: response.data.users });
//           } else {
//             // ไม่ set error เพื่อไม่ให้ block การทำงาน
//             console.warn('Could not fetch users:', response.error);
//             set({ users: [] });
//           }
//         } catch (error) {
//           console.warn('Error fetching users:', error);
//           set({ users: [] });
//         }
//       },

//       fetchClinics: async () => {
//         try {
//           const response = await getClinics();
//           if (response.success && response.data) {
//             set({ clinics: response.data.clinics });
//           } else {
//             console.warn('Could not fetch clinics:', response.error);
//             set({ clinics: [] });
//           }
//         } catch (error) {
//           console.warn('Error fetching clinics:', error);
//           set({ clinics: [] });
//         }
//       },

//       fetchPositions: async () => {
//         try {
//           // สร้าง positions จากข้อมูล users เนื่องจากไม่มี position endpoint
//           const usersResponse = await getUsers();
//           if (usersResponse.success && usersResponse.data) {
//             const allUsers = usersResponse.data.users;

//             // ถ้าไม่มี users ให้ใช้ empty array
//             if (!allUsers || allUsers.length === 0) {
//               set({ positions: [], users: [] });
//               return;
//             }

//             // สร้าง unique positions จาก users
//             const positionMap = new Map<string, any>();

//             allUsers.forEach((user: User) => {
//               if (user.position) {
//                 if (!positionMap.has(user.position)) {
//                   positionMap.set(user.position, {
//                     id: user.position.toLowerCase().replace(/\s+/g, '-'),
//                     name: user.position,
//                     members: []
//                   });
//                 }
//                 // เพิ่ม user เข้าไปใน members ของ position
//                 positionMap.get(user.position).members.push(user);
//               }
//             });

//             // แปลง Map เป็น Array และ sort ตามชื่อ
//             const positionsWithMembers = Array.from(positionMap.values()).sort((a, b) =>
//               a.name.localeCompare(b.name, 'th')
//             );

//             set({ positions: positionsWithMembers, users: allUsers });
//           } else {
//             // ถ้า fetch users ไม่สำเร็จ ให้ใช้ empty arrays
//             console.warn('Could not fetch positions/users');
//             set({ positions: [], users: [] });
//           }
//         } catch (error) {
//           console.warn('Error fetching positions:', error);
//           set({ positions: [], users: [] });
//         }
//       },

//       fetchCurrentUser: async () => {
//         try {
//           const response = await userService.getMe();
//           if (response.success && response.data) {
//             const user = {
//               ...response.data.user,
//               name: `${response.data.user.firstname} ${response.data.user.lastname}`,
//             };
//             set({ currentUser: user as any });
//           } else {
//             console.warn('Could not fetch current user:', response.error);
//             // Don't set error to avoid blocking
//           }
//         } catch (error) {
//           console.warn('Error fetching current user:', error);
//           // Don't set error to avoid blocking
//         }
//       },

//       fetchAll: async () => {
//         set({ loading: true, error: null });

//         // Run all fetches in parallel but don't let one failure stop others
//         const results = await Promise.allSettled([
//           get().fetchTasks(),
//           get().fetchUsers(),
//           get().fetchClinics(),
//           get().fetchPositions(),
//           get().fetchCurrentUser(),
//         ]);

//         // Log any failures for debugging
//         results.forEach((result, index) => {
//           if (result.status === 'rejected') {
//             const operations = ['tasks', 'users', 'clinics', 'positions', 'currentUser'];
//             console.warn(`Failed to fetch ${operations[index]}:`, result.reason);
//           }
//         });

//         set({ loading: false });
//       },

//       createTask: async (data: CreateTaskRequest) => {
//         set({ loading: true, error: null });
//         const response = await taskService.createTask(data);

//         if (response.success) {
//           await get().fetchTasks(1, get().pagination?.limit || 10);
//           set({ loading: false });
//           return { success: true };
//         } else {
//           set({ error: response.error || 'Failed to create task', loading: false });
//           return { success: false, error: response.error };
//         }
//       },

//       updateTask: async (id: string, data: UpdateTaskRequest) => {
//         set({ loading: true, error: null });
//         const response = await taskService.updateTask(id, data);

//         if (response.success) {
//           await get().fetchTasks(get().pagination?.page || 1, get().pagination?.limit || 10);
//           set({ loading: false });
//           return { success: true };
//         } else {
//           set({ error: response.error || 'Failed to update task', loading: false });
//           return { success: false, error: response.error };
//         }
//       },

//       deleteTask: async (id: string) => {
//         set({ loading: true, error: null });
//         const response = await taskService.deleteTask(id);

//         if (response.success) {
//           await get().fetchTasks(get().pagination?.page || 1, get().pagination?.limit || 10);
//           set({ loading: false });
//           return { success: true };
//         } else {
//           set({ error: response.error || 'Failed to delete task', loading: false });
//           return { success: false, error: response.error };
//         }
//       },

//       updateTaskStatus: async (id: string, status: TaskStatus) => {
//         return get().updateTask(id, { status });
//       },

//       setPage: (page) => {
//         set({ pagination: { ...get().pagination!, page } });
//         get().fetchTasks(page, get().pagination?.limit || 10);
//       },

//       reset: () => set({ tasks: [], pagination: null, loading: false, error: null }),
//       clearError: () => set({ error: null }),
//     }),
//     { name: 'TaskStore' }
//   )
// );

// export const selectTasks = (state: TaskState) => state.tasks;
// export const selectUsers = (state: TaskState) => state.users;
// export const selectClinics = (state: TaskState) => state.clinics;
// export const selectPositions = (state: TaskState) => state.positions;
// export const selectCurrentUser = (state: TaskState) => state.currentUser;
// export const selectLoading = (state: TaskState) => state.loading;
// export const selectError = (state: TaskState) => state.error;

// export const selectTasksByStatus = (status: TaskStatus) => (state: TaskState) =>
//   state.tasks.filter((task) => task.status === status);

// export const selectTasksByAssignee = (assigneeId: string) => (state: TaskState) =>
//   state.tasks.filter((task) => task.assigneeId === assigneeId);

// export const selectTasksByClinic = (clinicId: string) => (state: TaskState) =>
//   state.tasks.filter((task) => task.clinicId.id === clinicId);

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Task, User, TaskStatus, Clinic, Position, CreateTaskRequest, UpdateTaskRequest } from '@/types/task';
import { taskService, getUsers, getClinics } from '@/services/taskService';
import { userService } from '@/services/userService';

interface TaskState {
  tasks: Task[];
  users: User[];
  clinics: Clinic[];
  positions: Position[];
  currentUser: User | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  loading: boolean;
  error: string | null;

  fetchTasks: (page?: number, limit?: number) => Promise<void>;
  getTaskById: (id: string) => Promise<Task | null>;
  fetchUsers: () => Promise<void>;
  fetchClinics: () => Promise<void>;
  fetchPositions: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  fetchAll: () => Promise<void>;

  createTask: (data: CreateTaskRequest) => Promise<{ success: boolean; error?: string }>;
  updateTask: (id: string, data: UpdateTaskRequest) => Promise<{ success: boolean; error?: string }>;
  deleteTask: (id: string) => Promise<{ success: boolean; error?: string }>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<{ success: boolean; error?: string }>;
  // ✅ เพิ่ม updateProcessStatus
  updateProcessStatus: (taskId: string, processId: string, status: TaskStatus) => Promise<{ success: boolean; error?: string }>;

  reset: () => void;
  clearError: () => void;
  setPage: (page: number) => void;
}

export const useTaskStore = create<TaskState>()(
  devtools(
    (set, get) => ({
      tasks: [],
      users: [],
      clinics: [],
      positions: [],
      currentUser: null,
      pagination: null,
      loading: false,
      error: null,

      fetchTasks: async (page = 1, limit = 10) => {
        set({ loading: true, error: null });
        const response = await taskService.getTasks(page, limit);

        if (response.success && response.data) {
          console.log('taskStore: Tasks fetched successfully:', response.data.tasks);
          set({
            tasks: response.data.tasks,
            pagination: response.data.pagination,
            loading: false
          });
        } else {
          console.error('taskStore: Failed to fetch tasks:', response.error);
          set({ error: response.error || 'Failed to fetch tasks', loading: false });
        }
      },

      getTaskById: async (id: string) => {
        const response = await taskService.getTaskById(id);
        if (response.success && response.data) {
          set((state) => ({
            tasks: state.tasks.map((t) => t.id === id ? response.data!.task : t),
          }));
          return response.data.task;
        } else {
          set({ error: response.error || 'Failed to fetch task' });
          return null;
        }
      },

      fetchUsers: async () => {
        try {
          const response = await getUsers();
          if (response.success && response.data) {
            set({ users: response.data.users });
          } else {
            // ไม่ set error เพื่อไม่ให้ block การทำงาน
            console.warn('Could not fetch users:', response.error);
            set({ users: [] });
          }
        } catch (error) {
          console.warn('Error fetching users:', error);
          set({ users: [] });
        }
      },

      fetchClinics: async () => {
        try {
          const response = await getClinics();
          if (response.success && response.data) {
            set({ clinics: response.data.clinics });
          } else {
            console.warn('Could not fetch clinics:', response.error);
            set({ clinics: [] });
          }
        } catch (error) {
          console.warn('Error fetching clinics:', error);
          set({ clinics: [] });
        }
      },

      fetchPositions: async () => {
        try {
          // สร้าง positions จากข้อมูล users เนื่องจากไม่มี position endpoint
          const usersResponse = await getUsers();
          if (usersResponse.success && usersResponse.data) {
            const allUsers = usersResponse.data.users;

            // ถ้าไม่มี users ให้ใช้ empty array
            if (!allUsers || allUsers.length === 0) {
              set({ positions: [], users: [] });
              return;
            }

            // สร้าง unique positions จาก users
            const positionMap = new Map<string, any>();

            allUsers.forEach((user: User) => {
              if (user.position) {
                if (!positionMap.has(user.position)) {
                  positionMap.set(user.position, {
                    id: user.position.toLowerCase().replace(/\s+/g, '-'),
                    name: user.position,
                    members: []
                  });
                }
                // เพิ่ม user เข้าไปใน members ของ position
                positionMap.get(user.position).members.push(user);
              }
            });

            // แปลง Map เป็น Array และ sort ตามชื่อ
            const positionsWithMembers = Array.from(positionMap.values()).sort((a, b) =>
              a.name.localeCompare(b.name, 'th')
            );

            set({ positions: positionsWithMembers, users: allUsers });
          } else {
            // ถ้า fetch users ไม่สำเร็จ ให้ใช้ empty arrays
            console.warn('Could not fetch positions/users');
            set({ positions: [], users: [] });
          }
        } catch (error) {
          console.warn('Error fetching positions:', error);
          set({ positions: [], users: [] });
        }
      },

      fetchCurrentUser: async () => {
        try {
          const response = await userService.getMe();
          if (response.success && response.data) {
            const user = {
              ...response.data.user,
              name: `${response.data.user.firstname} ${response.data.user.lastname}`,
            };
            set({ currentUser: user as any });
          } else {
            console.warn('Could not fetch current user:', response.error);
            // Don't set error to avoid blocking
          }
        } catch (error) {
          console.warn('Error fetching current user:', error);
          // Don't set error to avoid blocking
        }
      },

      fetchAll: async () => {
        set({ loading: true, error: null });

        // Run all fetches in parallel but don't let one failure stop others
        const results = await Promise.allSettled([
          get().fetchTasks(),
          get().fetchUsers(),
          get().fetchClinics(),
          get().fetchPositions(),
          get().fetchCurrentUser(),
        ]);

        // Log any failures for debugging
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const operations = ['tasks', 'users', 'clinics', 'positions', 'currentUser'];
            console.warn(`Failed to fetch ${operations[index]}:`, result.reason);
          }
        });

        set({ loading: false });
      },

      createTask: async (data: CreateTaskRequest) => {
        set({ loading: true, error: null });
        const response = await taskService.createTask(data);

        if (response.success) {
          await get().fetchTasks(1, get().pagination?.limit || 10);
          set({ loading: false });
          return { success: true };
        } else {
          set({ error: response.error || 'Failed to create task', loading: false });
          return { success: false, error: response.error };
        }
      },

      updateTask: async (id: string, data: UpdateTaskRequest) => {
        set({ loading: true, error: null });
        const response = await taskService.updateTask(id, data);

        if (response.success) {
          await get().fetchTasks(get().pagination?.page || 1, get().pagination?.limit || 10);
          set({ loading: false });
          return { success: true };
        } else {
          set({ error: response.error || 'Failed to update task', loading: false });
          return { success: false, error: response.error };
        }
      },

      deleteTask: async (id: string) => {
        set({ loading: true, error: null });
        const response = await taskService.deleteTask(id);

        if (response.success) {
          await get().fetchTasks(get().pagination?.page || 1, get().pagination?.limit || 10);
          set({ loading: false });
          return { success: true };
        } else {
          set({ error: response.error || 'Failed to delete task', loading: false });
          return { success: false, error: response.error };
        }
      },

      updateTaskStatus: async (id: string, status: TaskStatus) => {
        return get().updateTask(id, { status });
      },

      // ✅ NEW: Update process status - สำหรับ Employee อัปเดตสถานะ process ของตัวเอง
      updateProcessStatus: async (taskId: string, processId: string, status: TaskStatus) => {
        set({ loading: true, error: null });

        const response = await taskService.updateProcessStatus(taskId, processId, status);

        if (response.success) {
          // Optimistic update - อัปเดต process status ใน local state ทันที
          set((state) => ({
            tasks: state.tasks.map((task) => {
              if (task.id === taskId) {
                return {
                  ...task,
                  process: task.process.map((p) => {
                    if (p.id === processId) {
                      return { ...p, status };
                    }
                    return p;
                  }),
                };
              }
              return task;
            }),
            loading: false,
          }));

          return { success: true };
        } else {
          set({ error: response.error || 'Failed to update process status', loading: false });
          return { success: false, error: response.error };
        }
      },

      setPage: (page) => {
        set({ pagination: { ...get().pagination!, page } });
        get().fetchTasks(page, get().pagination?.limit || 10);
      },

      reset: () => set({ tasks: [], pagination: null, loading: false, error: null }),
      clearError: () => set({ error: null }),
    }),
    { name: 'TaskStore' }
  )
);

export const selectTasks = (state: TaskState) => state.tasks;
export const selectUsers = (state: TaskState) => state.users;
export const selectClinics = (state: TaskState) => state.clinics;
export const selectPositions = (state: TaskState) => state.positions;
export const selectCurrentUser = (state: TaskState) => state.currentUser;
export const selectLoading = (state: TaskState) => state.loading;
export const selectError = (state: TaskState) => state.error;

export const selectTasksByStatus = (status: TaskStatus) => (state: TaskState) =>
  state.tasks.filter((task) => task.status === status);

export const selectTasksByAssignee = (assigneeId: string) => (state: TaskState) =>
  state.tasks.filter((task) => task.assignee?.some(a => a.id === assigneeId));

export const selectTasksByClinic = (clinicId: string) => (state: TaskState) =>
  state.tasks.filter((task) => task.clinic?.id === clinicId);