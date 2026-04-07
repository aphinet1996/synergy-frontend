import { TodoStats } from '@/components/todo/TodoStats';
import { TodoList } from '@/components/todo/TodoList';

export default function Todo() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">งานประจำวัน</h1>
        <p className="text-gray-500 mt-2">บันทึกและติดตามงานที่ทำในแต่ละวัน</p>
      </div>

      {/* Today's Stats */}
      <TodoStats />

      {/* User's Todo List */}
      <TodoList />
    </div>
  );
}