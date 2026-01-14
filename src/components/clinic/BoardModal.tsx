import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExcalidrawBoard } from './ExcalidrawBoard';

interface BoardModalProps {
    isOpen: boolean;
    onClose: () => void;
    boardId: string;
    boardName: string;
    initialData?: string;
    onSave: (data: string) => Promise<void>;
}

export function BoardModal({
    isOpen,
    onClose,
    boardId,
    boardName,
    initialData,
    onSave,
}: BoardModalProps) {
    // const excalidrawRef = useRef<{ saveBeforeClose: () => Promise<void> } | null>(null);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Handle close with save
    const handleClose = useCallback(async () => {
        // ExcalidrawBoard จะ save อัตโนมัติเมื่อ unmount
        onClose();
    }, [onClose]);

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={handleBackdropClick}
        >
            {/* Backdrop with dim effect */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal Content */}
            <div className="relative w-[95vw] h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <h2 className="text-lg font-semibold text-gray-800">
                            {boardName}
                        </h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        className="h-9 w-9 rounded-full hover:bg-gray-200"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Excalidraw Board */}
                <div className="flex-1 overflow-hidden">
                    <ExcalidrawBoard
                        boardId={boardId}
                        initialData={initialData}
                        onSave={onSave}
                    />
                </div>
            </div>
        </div>
    );
}