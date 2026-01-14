// import { useEffect, useRef } from 'react';
// import { useTaskStore } from '@/stores/taskStore';
// import { useAuthStore } from '@/stores/authStore';
// import type { TaskStatus } from '@/types/task';

// export function useTaskPageImproved() {
//     const store = useTaskStore();
//     const tokens = useAuthStore((state) => state.tokens);
    
//     const hasFetchedRef = useRef(false);
//     const isFetchingRef = useRef(false);
//     const lastTokenRef = useRef<string | undefined>(undefined);

//     useEffect(() => {
//         const currentToken = tokens?.accessToken;
        
//         // ✅ Reset เมื่อ token เปลี่ยน (user ใหม่ login) หรือ logout
//         if (currentToken !== lastTokenRef.current) {
//             console.log('[useTaskPageImproved] Token changed, resetting fetch state');
//             hasFetchedRef.current = false;
//             isFetchingRef.current = false;
//             lastTokenRef.current = currentToken;
//         }

//         // ไม่มี token = ไม่ fetch (user logged out)
//         if (!currentToken) {
//             console.log('[useTaskPageImproved] No token, skipping fetch');
//             return;
//         }

//         // ถ้า fetch แล้ว หรือกำลัง fetch อยู่ = skip
//         if (hasFetchedRef.current || isFetchingRef.current) {
//             return;
//         }

//         // เริ่ม fetch
//         isFetchingRef.current = true;
//         console.log('[useTaskPageImproved] Starting fetchAll...');
        
//         const fetchData = async () => {
//             try {
//                 await store.fetchAll();
//                 hasFetchedRef.current = true;
//                 console.log('[useTaskPageImproved] fetchAll completed');
//             } catch (error) {
//                 console.error('[useTaskPageImproved] fetchAll error:', error);
//             } finally {
//                 isFetchingRef.current = false;
//             }
//         };

//         fetchData();
//     }, [tokens?.accessToken, store]);

//     return {
//         tasks: store.tasks,
//         users: store.users,
//         clinics: store.clinics,
//         positions: store.positions,
//         currentUser: store.currentUser,
//         loading: store.loading,
//         error: store.error,
//         pagination: store.pagination,
//         createTask: store.createTask,
//         updateTask: store.updateTask,
//         deleteTask: store.deleteTask,
//         updateTaskStatus: store.updateTaskStatus,
//         refetch: async () => {
//             console.log('[useTaskPageImproved] Manual refetch triggered');
//             hasFetchedRef.current = false;
//             await store.fetchAll();
//             hasFetchedRef.current = true;
//         },
//         setPage: store.setPage,
//     };
// }

// /**
//  * Hook for filtered tasks by status
//  */
// export function useTasksByStatus(status: TaskStatus) {
//     const tasks = useTaskStore((state) =>
//         state.tasks.filter((task) => task.status === status)
//     );
//     return tasks;
// }

// /**
//  * Hook for filtered tasks by assignee
//  */
// export function useTasksByAssignee(assigneeId: string) {
//     const tasks = useTaskStore((state) =>
//         state.tasks.filter((task) => task.assigneeId === assigneeId)
//     );
//     return tasks;
// }

// /**
//  * Hook for filtered tasks by clinic
//  */
// export function useTasksByClinic(clinicId: string) {
//     const tasks = useTaskStore((state) =>
//         state.tasks.filter((task) => task.clinicId.id === clinicId)
//     );
//     return tasks;
// }

import { useEffect, useRef } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { useAuthStore } from '@/stores/authStore';
import type { TaskStatus } from '@/types/task';

export function useTaskPageImproved() {
    const store = useTaskStore();
    const tokens = useAuthStore((state) => state.tokens);
    
    const hasFetchedRef = useRef(false);
    const isFetchingRef = useRef(false);
    const lastTokenRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        const currentToken = tokens?.accessToken;
        
        // ✅ Reset เมื่อ token เปลี่ยน (user ใหม่ login) หรือ logout
        if (currentToken !== lastTokenRef.current) {
            // console.log('[useTaskPageImproved] Token changed, resetting fetch state');
            hasFetchedRef.current = false;
            isFetchingRef.current = false;
            lastTokenRef.current = currentToken;
        }

        // ไม่มี token = ไม่ fetch (user logged out)
        if (!currentToken) {
            // console.log('[useTaskPageImproved] No token, skipping fetch');
            return;
        }

        // ถ้า fetch แล้ว หรือกำลัง fetch อยู่ = skip
        if (hasFetchedRef.current || isFetchingRef.current) {
            return;
        }

        // เริ่ม fetch
        isFetchingRef.current = true;
        // console.log('[useTaskPageImproved] Starting fetchAll...');
        
        const fetchData = async () => {
            try {
                await store.fetchAll();
                hasFetchedRef.current = true;
                // console.log('[useTaskPageImproved] fetchAll completed');
            } catch (error) {
                // console.error('[useTaskPageImproved] fetchAll error:', error);
            } finally {
                isFetchingRef.current = false;
            }
        };

        fetchData();
    }, [tokens?.accessToken, store]);

    return {
        tasks: store.tasks,
        users: store.users,
        clinics: store.clinics,
        positions: store.positions,
        currentUser: store.currentUser,
        loading: store.loading,
        error: store.error,
        pagination: store.pagination,
        createTask: store.createTask,
        updateTask: store.updateTask,
        deleteTask: store.deleteTask,
        updateTaskStatus: store.updateTaskStatus,
        updateProcessStatus: store.updateProcessStatus,  // ✅ เพิ่มบรรทัดนี้
        refetch: async () => {
            // console.log('[useTaskPageImproved] Manual refetch triggered');
            hasFetchedRef.current = false;
            await store.fetchAll();
            hasFetchedRef.current = true;
        },
        setPage: store.setPage,
    };
}

/**
 * Hook for filtered tasks by status
 */
export function useTasksByStatus(status: TaskStatus) {
    const tasks = useTaskStore((state) =>
        state.tasks.filter((task) => task.status === status)
    );
    return tasks;
}

/**
 * Hook for filtered tasks by assignee
 */
export function useTasksByAssignee(assigneeId: string) {
    const tasks = useTaskStore((state) =>
        state.tasks.filter((task) => task.assignee?.some(a => a.id === assigneeId))
    );
    return tasks;
}

/**
 * Hook for filtered tasks by clinic
 */
export function useTasksByClinic(clinicId: string) {
    const tasks = useTaskStore((state) =>
        state.tasks.filter((task) => task.clinic?.id === clinicId)
    );
    return tasks;
}