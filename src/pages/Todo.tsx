import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TodoStats } from '@/components/todo/TodoStats';
import { TodoList } from '@/components/todo/TodoList';
import { TeamTodoView } from '@/components/todo/TeamTodoView';
import { useUserStore } from '@/stores/userStore';
import { ListTodo, Users } from 'lucide-react';

export default function Todo() {
  const { user } = useUserStore();

  // Check if user can view team todos (admin or manager only)
  const canViewTeamTodos = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user?.role]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">งานประจำวัน</h1>
        <p className="text-gray-500 mt-2">บันทึกและติดตามงานที่ทำในแต่ละวัน</p>
      </div>

      {/* Today's Stats */}
      <TodoStats />

      {/* Tabs for My Todos / Team Todos */}
      {canViewTeamTodos ? (
        <Tabs defaultValue="my-todos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="my-todos" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              งานของฉัน
            </TabsTrigger>
            <TabsTrigger value="team-todos" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              งานทีม
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-todos">
            <TodoList />
          </TabsContent>

          <TabsContent value="team-todos">
            <TeamTodoView />
          </TabsContent>
        </Tabs>
      ) : (
        // Employee only sees their own todos
        <TodoList />
      )}
    </div>
  );
}