import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2, Users, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

// ✅ แก้ interface ให้รับ null ได้
export interface Board {
  id: string;
  name: string;
  procedureId: string;
  createdBy: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
  collaborators: Array<{
    id: string;
    name: string;
    avatar?: string | null;
  }>;
  thumbnail?: string | null;
  data?: string | null;
}

interface BoardListProps {
  boards: Board[];
  onSelectBoard: (board: Board) => void;
  onEditBoard: (board: Board) => void;
  onDeleteBoard: (boardId: string) => void;
}

export function BoardList({ boards, onSelectBoard, onEditBoard, onDeleteBoard }: BoardListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {boards.map((board, index) => (
        <Card
          key={board.id || `board-${index}`}
          className="group cursor-pointer hover:shadow-lg transition-all duration-200"
          onClick={() => board.id && onSelectBoard(board)}
        >
          <CardContent className="p-0">
            {/* Thumbnail */}
            {/* <div className="h-48 bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center relative overflow-hidden">
              {board.thumbnail ? (
                <img
                  src={board.thumbnail}
                  alt={board.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FileImage className="h-16 w-16 text-purple-300" />
              )}
              
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div> */}

            {/* Info */}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">
                  {board.name || 'Untitled Board'}
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditBoard(board);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      แก้ไขชื่อ
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBoard(board.id);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      ลบ
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Creator */}
              {/* <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={board.createdBy?.avatar || undefined} />
                  <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                    {(board.createdBy?.name || 'U').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600">
                  สร้างโดย <span className="font-medium">{board.createdBy?.name || 'Unknown'}</span>
                </span>
              </div> */}

              {/* Collaborators */}
              {board.collaborators && board.collaborators.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div className="flex -space-x-2">
                    {board.collaborators.slice(0, 3).map((collab) => (
                      <Avatar key={collab.id} className="h-6 w-6 border-2 border-white">
                        <AvatarImage src={collab.avatar || undefined} />
                        <AvatarFallback className="text-xs bg-gray-100">
                          {(collab.name || 'U').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {board.collaborators.length > 3 && (
                      <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          +{board.collaborators.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {board.updatedAt && !isNaN(board.updatedAt.getTime())
                    ? formatDistanceToNow(board.updatedAt, { addSuffix: true, locale: th })
                    : '-'}
                </div>
                {/* <Badge variant="outline" className="text-xs">
                  {board.createdAt && !isNaN(board.createdAt.getTime())
                    ? formatDistanceToNow(board.createdAt, { locale: th })
                    : '-'}
                </Badge> */}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}