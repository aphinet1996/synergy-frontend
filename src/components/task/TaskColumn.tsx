import { Droppable } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/types/task';
import { TaskCard } from './TaskCard';
import { Draggable } from '@hello-pangea/dnd';

interface TaskColumnProps {
  columnId: string;
  title: string;
  tasks: Task[];
  users: Array<{ id: string; name: string; avatar?: string }>;
  onTaskClick: (task: Task) => void;
}

export function TaskColumn({ columnId, title, tasks, users, onTaskClick }: TaskColumnProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-700',
      process: 'bg-blue-100 text-blue-700',
      review: 'bg-yellow-100 text-yellow-700',
      done: 'bg-green-100 text-green-700',
      // Backward compatibility
      todo: 'bg-gray-100 text-gray-700',
      'in-progress': 'bg-blue-100 text-blue-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Column Header - Fixed */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b flex-shrink-0">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <Badge className={`${getStatusColor(columnId)} border-0`}>
          {tasks.length}
        </Badge>
      </div>

      {/* Scrollable Task List */}
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto overflow-x-hidden space-y-3 p-2 rounded-lg transition-colors
              scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400
              ${snapshot.isDraggingOver ? 'bg-purple-50 border-2 border-dashed border-purple-300' : 'bg-transparent'}`}
            style={{ minHeight: '200px' }}
          >
            {tasks.map((task, index) => {
              return (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={snapshot.isDragging ? 'opacity-50 rotate-2' : ''}
                    >
                      <TaskCard task={task} onClick={() => onTaskClick(task)} />
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}

            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="text-center py-8 text-gray-400 text-sm">
                ไม่มีงานในสถานะนี้
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}