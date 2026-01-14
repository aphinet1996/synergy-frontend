import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BoardModal } from './BoardModal';
import { BoardList, type Board as BoardListItem } from './BoardList';
import {
    Plus,
    Presentation,
    RefreshCw,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import {
    boardService,
    type Procedure,
    type Board,
    type BoardWithElements,
} from '@/services/boardService';

interface BoardTabProps {
    clinicId: string;
}

// Convert API Board to BoardList format
const convertToBoardListItem = (board: Board): BoardListItem => {
    const createdBy = board.createdBy || {} as any;

    const parseDate = (dateStr: string | undefined | null): Date => {
        if (!dateStr) return new Date();
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? new Date() : parsed;
    };

    const boardId = (board as any).id || board._id || '';

    let procId = '';
    if (typeof board.procedureId === 'string') {
        procId = board.procedureId;
    } else if (board.procedureId) {
        procId = (board.procedureId as any).id || board.procedureId._id || '';
    }

    return {
        id: boardId,
        name: board.name || '',
        procedureId: procId,
        createdBy: {
            id: (createdBy as any).id || createdBy._id || '',
            name: `${createdBy.firstname || ''} ${createdBy.lastname || ''}`.trim() || createdBy.nickname || 'Unknown',
            avatar: null,
        },
        createdAt: parseDate(board.createdAt),
        updatedAt: parseDate(board.updatedAt),
        collaborators: (board.members || []).map(m => ({
            id: (m as any).id || m._id || '',
            name: `${m.firstname || ''} ${m.lastname || ''}`.trim() || m.nickname || 'Unknown',
            avatar: null,
        })),
        thumbnail: null,
        data: null,
    };
};

export function BoardTab({ clinicId }: BoardTabProps) {
    // State
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [boardsByProcedure, setBoardsByProcedure] = useState<Record<string, Board[]>>({});
    const [boardsLoading, setBoardsLoading] = useState(false);
    const [boardsError, setBoardsError] = useState<string | null>(null);
    
    const [selectedBoard, setSelectedBoard] = useState<BoardWithElements | null>(null);
    const [selectedBoardLoading, setSelectedBoardLoading] = useState(false);
    
    const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [selectedProcedureId, setSelectedProcedureId] = useState<string>('');
    const [createBoardLoading, setCreateBoardLoading] = useState(false);

    // Fetch procedures and boards
    const fetchProceduresAndBoards = useCallback(async () => {
        if (!clinicId) return;

        setBoardsLoading(true);
        setBoardsError(null);

        try {
            const procResponse = await boardService.getClinicProcedures(clinicId);
            if (procResponse.success && procResponse.data) {
                setProcedures(procResponse.data);
            }

            const boardsResponse = await boardService.getBoardsByClinic(clinicId);
            if (boardsResponse.success && boardsResponse.data) {
                const boardsMap: Record<string, Board[]> = {};
                boardsResponse.data.forEach((group) => {
                    const procId = (group.procedure as any)?.id || group.procedure?._id;
                    if (procId) {
                        boardsMap[procId] = group.boards;
                    }
                });
                setBoardsByProcedure(boardsMap);
            }
        } catch (error) {
            setBoardsError('Failed to fetch boards');
        } finally {
            setBoardsLoading(false);
        }
    }, [clinicId]);

    // Initial fetch
    useEffect(() => {
        fetchProceduresAndBoards();
    }, [fetchProceduresAndBoards]);

    // Get boards for a procedure
    const getBoardsForProcedure = (procedureId: string): BoardListItem[] => {
        const boards = boardsByProcedure[procedureId] || [];
        return boards.map(convertToBoardListItem);
    };

    // Handlers
    const handleOpenCreateBoard = (procedureId: string) => {
        setSelectedProcedureId(procedureId);
        setIsCreateBoardOpen(true);
    };

    const handleCreateBoard = async () => {
        if (!newBoardName.trim() || !selectedProcedureId || !clinicId) return;

        setCreateBoardLoading(true);
        const response = await boardService.createBoard(clinicId, {
            procedureId: selectedProcedureId,
            name: newBoardName,
        });

        if (response.success) {
            setNewBoardName('');
            setSelectedProcedureId('');
            setIsCreateBoardOpen(false);
            await fetchProceduresAndBoards();
        } else {
            setBoardsError(response.error || 'Failed to create board');
        }
        setCreateBoardLoading(false);
    };

    const handleSelectBoard = async (board: BoardListItem) => {
        if (!clinicId) return;

        setSelectedBoardLoading(true);
        const response = await boardService.getBoard(clinicId, board.id);

        if (response.success && response.data) {
            setSelectedBoard(response.data);
        } else {
            setBoardsError(response.error || 'Failed to load board');
        }
        setSelectedBoardLoading(false);
    };

    const handleCloseBoard = () => {
        setSelectedBoard(null);
    };

    const handleSaveBoard = async (
        elements: any[],
        appState?: Record<string, any>,
        files?: Record<string, any>
    ): Promise<void> => {
        if (!clinicId || !selectedBoard) {
            throw new Error('No clinic ID or board selected');
        }

        const boardId = (selectedBoard as any).id || selectedBoard._id;
        if (!boardId) {
            throw new Error('Board ID not found');
        }

        // console.log('Saving board:', boardId, 'elements:', elements.length);

        const response = await boardService.saveBoardElements(clinicId, boardId, {
            elements,
            appState,
            files,
        });

        if (!response.success) {
            console.error('Failed to save board:', response.error);
            throw new Error(response.error || 'Failed to save board');
        }

        // console.log('Board saved successfully');
    };

    const handleEditBoard = async (board: BoardListItem) => {
        const newName = prompt('ชื่อ Board ใหม่:', board.name);
        if (!newName || !newName.trim() || !clinicId) return;

        const response = await boardService.updateBoard(clinicId, board.id, { name: newName });
        if (response.success) {
            await fetchProceduresAndBoards();
        } else {
            setBoardsError(response.error || 'Failed to update board');
        }
    };

    const handleDeleteBoard = async (boardId: string) => {
        if (!confirm('คุณต้องการลบ Board นี้ใช่หรือไม่?') || !clinicId) return;

        const response = await boardService.deleteBoard(clinicId, boardId);
        if (response.success) {
            const currentBoardId = (selectedBoard as any)?.id || selectedBoard?._id;
            if (currentBoardId === boardId) {
                setSelectedBoard(null);
            }
            await fetchProceduresAndBoards();
        } else {
            setBoardsError(response.error || 'Failed to delete board');
        }
    };

    return (
        <>
            {/* Board Modal */}
            {selectedBoard && (
                <BoardModal
                    isOpen={!!selectedBoard}
                    onClose={handleCloseBoard}
                    boardId={(selectedBoard as any).id || selectedBoard._id || ''}
                    boardName={selectedBoard.name}
                    initialData={JSON.stringify({
                        elements: selectedBoard.elements || [],
                        appState: selectedBoard.appState,
                    })}
                    onSave={async (data) => {
                        try {
                            const parsed = JSON.parse(data);
                            await handleSaveBoard(parsed.elements, parsed.appState, parsed.files);
                        } catch (e) {
                            console.error('Failed to parse board data:', e);
                            throw e;
                        }
                    }}
                />
            )}

            {/* Board List View */}
            {selectedBoardLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    <span className="ml-2 text-gray-600">กำลังโหลด Board...</span>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Brainstorm Boards
                            </h2>
                            <p className="text-gray-600 mt-1">
                                จัดกลุ่ม boards ตามหัตถการของคลินิก
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchProceduresAndBoards}
                            disabled={boardsLoading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${boardsLoading ? 'animate-spin' : ''}`} />
                            รีเฟรช
                        </Button>
                    </div>

                    {/* Error Alert */}
                    {boardsError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{boardsError}</AlertDescription>
                        </Alert>
                    )}

                    {/* Content */}
                    {boardsLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-20 w-full" />
                            ))}
                        </div>
                    ) : procedures.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                            <Presentation className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">ยังไม่มีหัตถการสำหรับคลินิกนี้</p>
                        </div>
                    ) : (
                        <Accordion type="multiple" className="space-y-4">
                            {procedures.map((procedure) => {
                                const procedureBoards = getBoardsForProcedure(procedure.id);

                                return (
                                    <AccordionItem
                                        key={procedure.id}
                                        value={procedure.id}
                                        className="border rounded-lg bg-white shadow-sm"
                                    >
                                        <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                                            <div className="flex items-center justify-between w-full pr-4">
                                                <div className="flex items-center gap-3">
                                                    <Presentation className="h-6 w-6 text-purple-600" />
                                                    <div className="text-left">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {procedure.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            {procedureBoards.length} board{procedureBoards.length !== 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenCreateBoard(procedure.id);
                                                    }}
                                                    className="bg-purple-600 hover:bg-purple-700 gap-2"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    สร้าง Board
                                                </Button>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-6 pb-6">
                                            {procedureBoards.length === 0 ? (
                                                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                                                    <Presentation className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                                    <p className="text-gray-500 mb-4">
                                                        ยังไม่มี Board สำหรับหัตถการนี้
                                                    </p>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleOpenCreateBoard(procedure.id)}
                                                        className="gap-2"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        สร้าง Board แรก
                                                    </Button>
                                                </div>
                                            ) : (
                                                <BoardList
                                                    boards={procedureBoards}
                                                    onSelectBoard={handleSelectBoard}
                                                    onEditBoard={handleEditBoard}
                                                    onDeleteBoard={handleDeleteBoard}
                                                />
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    )}
                </div>
            )}

            {/* Create Board Dialog */}
            <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>สร้าง Board ใหม่</DialogTitle>
                        <DialogDescription>
                            สร้าง Board สำหรับ brainstorm ไอเดีย -{' '}
                            {procedures.find(p => p.id === selectedProcedureId)?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="boardName">ชื่อ Board</Label>
                            <Input
                                id="boardName"
                                placeholder="เช่น Campaign Ideas Q4"
                                value={newBoardName}
                                onChange={(e) => setNewBoardName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !createBoardLoading) {
                                        handleCreateBoard();
                                    }
                                }}
                                disabled={createBoardLoading}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsCreateBoardOpen(false);
                                setNewBoardName('');
                                setSelectedProcedureId('');
                            }}
                            disabled={createBoardLoading}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCreateBoard}
                            className="bg-purple-600 hover:bg-purple-700"
                            disabled={!newBoardName.trim() || createBoardLoading}
                        >
                            {createBoardLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    กำลังสร้าง...
                                </>
                            ) : (
                                'สร้าง Board'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}