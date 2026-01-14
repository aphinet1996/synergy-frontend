import { useEffect, useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import type { TaskStatus, Task } from '@/types/task';

/**
 * Hook for managing tasks with Zustand store
 */
export function useTasks() {
    const {
        tasks,
        loading,
        error,
        fetchTasks,
        createTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
    } = useTaskStore();

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return {
        tasks,
        loading,
        error,
        refetch: fetchTasks,
        createTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
    };
}

/**
 * Hook for managing users
 */
export function useUsers() {
    const { users, loading, error, fetchUsers } = useTaskStore();

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return {
        users,
        loading,
        error,
    };
}

/**
 * Hook for managing clinics
 */
export function useClinics() {
    const { clinics, loading, error, fetchClinics } = useTaskStore();

    useEffect(() => {
        fetchClinics();
    }, [fetchClinics]);

    return {
        clinics,
        loading,
        error,
    };
}

/**
 * Hook for managing positions
 */
export function usePositions() {
    const { positions, loading, error, fetchPositions } = useTaskStore();

    useEffect(() => {
        fetchPositions();
    }, [fetchPositions]);

    return {
        positions,
        loading,
        error,
    };
}

/**
 * Hook for current user
 */
export function useCurrentUser() {
    const { currentUser, fetchCurrentUser } = useTaskStore();

    useEffect(() => {
        if (!currentUser) {
            fetchCurrentUser();
        }
    }, [currentUser, fetchCurrentUser]);

    return currentUser;
}

/**
 * Combined hook for task page (loads all data at once)
 */
export function useTaskPage() {
    const store = useTaskStore();

    useEffect(() => {
        store.fetchAll();
    }, []);

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
        refetch: store.fetchAll,
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
        state.tasks.filter((task) =>
            task.assignee?.some((a) => a.id === assigneeId)
        )
    );
    return tasks;
}

/**
 * Hook for filtered tasks by clinic
 */
export function useTasksByClinic(clinicId: string) {
    const tasks = useTaskStore((state) =>
        state.tasks.filter((task) => task.clinic.id === clinicId)
    );
    return tasks;
}

/**
 * Hook for single task by ID
 */
export function useTaskById(id: string) {
    const { getTaskById, loading, error } = useTaskStore();
    const [task, setTask] = useState<Task | null>(null);

    useEffect(() => {
        if (id) {
            getTaskById(id).then(setTask);
        }
    }, [id, getTaskById]);

    return { task, loading, error, refetch: () => getTaskById(id).then(setTask) };
}