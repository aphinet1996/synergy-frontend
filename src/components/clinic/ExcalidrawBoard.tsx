import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types/user';

const Excalidraw = lazy(() =>
    import('@excalidraw/excalidraw').then((module) => ({
        default: module.Excalidraw,
    }))
);

interface Collaborator {
    odId: string;
    odname: string;
    color: string;
}

interface ExcalidrawBoardProps {
    boardId: string;
    initialData?: string;
    onSave?: (data: string) => Promise<void> | void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// Helper: compare elements
const elementsEqual = (a: any[], b: any[]): boolean => {
    if (a.length !== b.length) return false;
    const aIds = a.map(el => `${el.id}-${el.version}`).sort().join(',');
    const bIds = b.map(el => `${el.id}-${el.version}`).sort().join(',');
    return aIds === bIds;
};

// Helper: merge elements from remote with local (keep newer versions)
const mergeElements = (localElements: any[], remoteElements: any[]): any[] => {
    const elementMap = new Map<string, any>();
    
    // Add all local elements
    for (const el of localElements) {
        elementMap.set(el.id, el);
    }
    
    // Merge remote elements (keep newer version)
    for (const el of remoteElements) {
        const existing = elementMap.get(el.id);
        if (!existing || el.version > existing.version) {
            elementMap.set(el.id, el);
        }
    }
    
    return Array.from(elementMap.values());
};

export function ExcalidrawBoard({ boardId, initialData, onSave }: ExcalidrawBoardProps) {
    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    
    // Auth
    const user = useAuthStore((state) => state.user) as User | null;
    const token = useAuthStore((state) => state.tokens?.accessToken);
    
    // Helper: get user info
    const userId = user?.id || '';
    const userName = user?.firstname || user?.nickname || 'Unknown';
    
    // Refs
    const socketRef = useRef<Socket | null>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSavedElementsRef = useRef<any[]>([]);
    const isSavingRef = useRef(false);
    const lastSaveTimeRef = useRef<number>(0);
    const isRemoteUpdateRef = useRef(false);
    const excalidrawAPIRef = useRef<any>(null);

    // Keep ref in sync with state
    useEffect(() => {
        excalidrawAPIRef.current = excalidrawAPI;
    }, [excalidrawAPI]);

    // Constants
    const DEBOUNCE_MS = 3000;  // Auto-save after 3 seconds of no changes
    const THROTTLE_MS = 5000; // Min 5 seconds between saves
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

    // Parse initial data
    const parsedInitialData = initialData
        ? (() => {
            try {
                const parsed = JSON.parse(initialData);
                lastSavedElementsRef.current = parsed.elements || [];
                return parsed;
            } catch {
                return undefined;
            }
        })()
        : undefined;

    // Track initial element count to prevent saving empty data
    const initialElementCountRef = useRef<number>(parsedInitialData?.elements?.length || 0);

    // ==================== SOCKET CONNECTION ====================
    useEffect(() => {
        // ตรวจสอบว่ามี boardId และ token ก่อน connect
        if (!boardId || !token) {
            console.log('Missing boardId or token, skipping socket connection');
            return;
        }

        // สร้าง flag สำหรับ cleanup (React Strict Mode จะ unmount/remount)
        let isActive = true;

        // Connect to socket with /board namespace
        const socket = io(`${SOCKET_URL}/board`, {
            auth: { token },
            query: { boardId },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            if (!isActive) return;
            console.log('Socket connected:', socket.id);
            setIsConnected(true);
            
            // Join board room with initial elements for cache sync
            const initialElements = parsedInitialData?.elements || [];
            socket.emit('board:join', { 
                boardId, 
                odId: userId,
                odname: userName,
                elements: initialElements, // Send initial elements to server for cache
            });
        });

        socket.on('disconnect', (reason) => {
            if (!isActive) return;
            console.log('Socket disconnected:', reason);
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.log('Socket connection error:', error.message);
        });

        // Receive collaborators list
        socket.on('board:collaborators', (users: Collaborator[]) => {
            if (!isActive) return;
            setCollaborators(users.filter(u => u.odId !== userId));
        });

        // Receive element updates from other users
        socket.on('board:elements-update', (data: { elements: any[], odId: string }) => {
            if (!isActive) return;
            if (data.odId === userId) return; // Ignore own updates
            
            const api = excalidrawAPIRef.current;
            if (api) {
                isRemoteUpdateRef.current = true;
                
                // Merge remote elements with local elements
                const localElements = api.getSceneElements() || [];
                const mergedElements = mergeElements(localElements, data.elements);
                
                api.updateScene({
                    elements: mergedElements,
                });
                lastSavedElementsRef.current = mergedElements;
                
                // Reset flag after update
                setTimeout(() => {
                    isRemoteUpdateRef.current = false;
                }, 100);
            }
        });

        // User joined notification
        socket.on('board:user-joined', (userData: Collaborator) => {
            if (!isActive) return;
            if (userData.odId !== userId) {
                setCollaborators(prev => {
                    if (prev.some(c => c.odId === userData.odId)) return prev;
                    return [...prev, userData];
                });
            }
        });

        // User left notification
        socket.on('board:user-left', (userData: { odId: string }) => {
            if (!isActive) return;
            setCollaborators(prev => prev.filter(c => c.odId !== userData.odId));
        });

        return () => {
            isActive = false;
            if (socket.connected) {
                socket.emit('board:leave', { boardId });
            }
            socket.disconnect();
            socketRef.current = null;
        };
    }, [boardId, token, userId, userName]);

    // ==================== SAVE FUNCTION ====================
    const saveBoard = useCallback(async (elements: any[], broadcast = true, isClosing = false) => {
        if (!excalidrawAPI || !onSave) return;
        
        // Filter out deleted elements
        const activeElements = elements.filter(el => !el.isDeleted);
        
        // CRITICAL: Prevent saving empty data when we had elements before
        // This prevents React Strict Mode remount from wiping data
        if (activeElements.length === 0 && initialElementCountRef.current > 0) {
            console.log('Skipping save: would overwrite existing data with empty');
            return;
        }

        // Prevent concurrent saves
        if (isSavingRef.current) {
            console.log('Save already in progress, skipping...');
            return;
        }

        // Throttle check (skip if closing)
        const now = Date.now();
        if (!isClosing && now - lastSaveTimeRef.current < THROTTLE_MS) {
            console.log('Throttled, skipping save');
            return;
        }

        // Skip if elements unchanged
        if (elementsEqual(activeElements, lastSavedElementsRef.current)) {
            console.log('No changes to save');
            return;
        }

        try {
            isSavingRef.current = true;
            setSaveStatus('saving');

            const appState = excalidrawAPI.getAppState();
            const files = excalidrawAPI.getFiles?.() || {};

            const data = JSON.stringify({
                elements: activeElements,
                appState: { viewBackgroundColor: appState.viewBackgroundColor },
                files,
            });

            console.log(`Saving board: ${boardId}, elements: ${activeElements.length}`);
            await onSave(data);

            // Broadcast to other users
            if (broadcast && socketRef.current?.connected) {
                socketRef.current.emit('board:elements-change', {
                    boardId,
                    elements: activeElements,
                    odId: userId,
                });
            }

            lastSavedElementsRef.current = [...activeElements];
            lastSaveTimeRef.current = Date.now();
            // Update initial count after successful save
            initialElementCountRef.current = activeElements.length;
            setSaveStatus('saved');

            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            console.error('Error saving board:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } finally {
            isSavingRef.current = false;
        }
    }, [excalidrawAPI, onSave, boardId, userId]);

    // ==================== HANDLE CHANGES ====================
    const handleChange = useCallback((elements: readonly any[]) => {
        // Skip if this is a remote update
        if (isRemoteUpdateRef.current) return;
        if (!excalidrawAPI) return;

        const currentElements = [...elements];
        
        // Skip if no real changes
        if (elementsEqual(currentElements, lastSavedElementsRef.current)) return;

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Broadcast immediately for realtime (but don't save yet)
        if (socketRef.current?.connected) {
            socketRef.current.emit('board:elements-change', {
                boardId,
                elements: currentElements,
                odId: userId,
            });
        }

        // Debounced save to database
        saveTimeoutRef.current = setTimeout(() => {
            saveBoard(currentElements, false); // Don't broadcast again
        }, DEBOUNCE_MS);
    }, [saveBoard, boardId, userId, excalidrawAPI]);

    // ==================== CLEANUP ====================
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            
            // Final save on unmount
            const api = excalidrawAPIRef.current;
            if (api && !isSavingRef.current && onSave) {
                const elements = api.getSceneElements();
                const activeElements = elements.filter((el: any) => !el.isDeleted);
                
                // CRITICAL: Don't save empty data if we had elements before
                if (activeElements.length === 0 && initialElementCountRef.current > 0) {
                    console.log('Cleanup: Skipping save - would overwrite with empty data');
                    return;
                }
                
                // Only save if there are changes
                if (!elementsEqual(activeElements, lastSavedElementsRef.current) && activeElements.length > 0) {
                    console.log(`Cleanup: Saving ${activeElements.length} elements`);
                    const appState = api.getAppState();
                    const files = api.getFiles?.() || {};
                    const data = JSON.stringify({
                        elements: activeElements,
                        appState: { viewBackgroundColor: appState.viewBackgroundColor },
                        files,
                    });
                    onSave(data);
                }
            }
        };
    }, [onSave]);

    // ==================== RENDER ====================
    const renderStatus = () => {
        if (!isConnected) {
            return (
                <div className="flex items-center gap-2 text-yellow-600">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-sm">กำลังเชื่อมต่อ...</span>
                </div>
            );
        }

        switch (saveStatus) {
            case 'saving':
                return (
                    <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">กำลังบันทึก...</span>
                    </div>
                );
            case 'saved':
                return (
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm">บันทึกแล้ว</span>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">บันทึกไม่สำเร็จ</span>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-2 text-green-600">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm">เชื่อมต่อแล้ว</span>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Status Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
                {/* Save Status */}
                <div className="flex items-center gap-2">
                    {renderStatus()}
                </div>

                {/* Collaborators */}
                {collaborators.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <div className="flex -space-x-2">
                            {collaborators.slice(0, 5).map((collab) => (
                                <Avatar 
                                    key={collab.odId} 
                                    className="h-7 w-7 border-2 border-white"
                                    title={collab.odname}
                                >
                                    <AvatarFallback 
                                        style={{ backgroundColor: collab.color }}
                                        className="text-white text-xs"
                                    >
                                        {collab.odname.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                            {collaborators.length > 5 && (
                                <Badge variant="secondary" className="ml-2">
                                    +{collaborators.length - 5}
                                </Badge>
                            )}
                        </div>
                        <span className="text-sm text-gray-500">
                            กำลังดูอยู่ {collaborators.length} คน
                        </span>
                    </div>
                )}
            </div>

            {/* Excalidraw Canvas */}
            <Suspense
                fallback={
                    <div className="flex-1 w-full flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">กำลังโหลด Whiteboard...</p>
                        </div>
                    </div>
                }
            >
                <div className="flex-1 w-full overflow-hidden bg-white">
                    <Excalidraw
                        excalidrawAPI={(api) => setExcalidrawAPI(api)}
                        initialData={{
                            elements: parsedInitialData?.elements || [],
                            appState: {
                                ...parsedInitialData?.appState,
                                viewBackgroundColor: '#ffffff',
                                currentItemStrokeColor: '#000000',
                                currentItemBackgroundColor: 'transparent',
                                currentItemFillStyle: 'solid',
                                currentItemStrokeWidth: 1,
                                currentItemRoughness: 1,
                                currentItemOpacity: 100,
                                gridSize: null,
                            },
                            scrollToContent: true,
                        }}
                        onChange={handleChange}
                        UIOptions={{
                            canvasActions: {
                                changeViewBackgroundColor: true,
                                clearCanvas: true,
                                export: { saveFileToDisk: true },
                                loadScene: false,
                                saveToActiveFile: false,
                                toggleTheme: true,
                            },
                            tools: { image: true },
                        }}
                    />
                </div>
            </Suspense>
        </div>
    );
}