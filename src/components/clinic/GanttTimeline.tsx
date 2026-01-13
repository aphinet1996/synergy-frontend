import { useState, useRef, useEffect, useCallback } from 'react';
import { format, addWeeks, differenceInWeeks, getMonth, getYear } from 'date-fns';
import { th } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import type { TimelineItem } from '@/types/clinic';

// Props interface
interface GanttTimelineProps {
    clinicId: string;
    startDate: Date;
    endDate: Date;
    items: TimelineItem[];
    loading?: boolean;
    onUpdateItem: (itemId: string, updates: { weekStart?: number; weekEnd?: number; serviceName?: string }) => Promise<void>;
    onDeleteItem: (itemId: string) => Promise<void>;
    onRefresh: () => void;
}

// Map serviceType to display category
const categoryMap: Record<string, { label: string; color: string; bgColor: string }> = {
    'setup': { label: 'Setup', color: '#6366f1', bgColor: 'bg-blue-100' },
    'coperateIdentity': { label: 'Coperate Identity', color: '#8b5cf6', bgColor: 'bg-purple-100' },
    'website': { label: 'Website', color: '#10b981', bgColor: 'bg-green-100' },
    'socialMedia': { label: 'Social Media', color: '#ec4899', bgColor: 'bg-pink-100' },
    'training': { label: 'Training', color: '#f97316', bgColor: 'bg-orange-100' },
};

// Internal UI item (converted from API)
interface UITimelineItem {
    id: string;
    name: string;
    unit: string;
    startWeek: number;
    endWeek: number;
    description: string;
    category: string;
    serviceType: TimelineItem['serviceType'];
    color: string;
}

// Convert API items to UI items
const convertToUIItems = (apiItems: TimelineItem[]): UITimelineItem[] => {
    return apiItems.map(item => ({
        id: item._id || '',
        name: item.serviceName,
        unit: item.serviceAmount,
        startWeek: item.weekStart,
        endWeek: item.weekEnd,
        description: item.serviceName,
        serviceType: item.serviceType,
        category: categoryMap[item.serviceType]?.label || 'Other',
        color: categoryMap[item.serviceType]?.color || '#6366f1',
    }));
};

export function GanttTimeline({
    clinicId,
    startDate,
    endDate,
    items: apiItems,
    loading = false,
    onUpdateItem,
    onDeleteItem,
    onRefresh
}: GanttTimelineProps) {
    // ==================== STATE ====================
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    const [dragType, setDragType] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
    const [pendingUpdate, setPendingUpdate] = useState<{
        itemId: string;
        weekNumber: number;
        type: 'move' | 'resize-start' | 'resize-end';
    } | null>(null);
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [editPosition, setEditPosition] = useState<{ top: number; left: number; width: number } | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // ==================== COMPUTED ====================
    const items = convertToUIItems(apiItems);
    const totalWeeks = Math.ceil(differenceInWeeks(endDate, startDate)) + 1;

    // สร้าง array ของสัปดาห์พร้อมข้อมูลเดือน
    const weeks = Array.from({ length: totalWeeks }, (_, i) => {
        const weekStart = addWeeks(startDate, i);
        const weekEnd = addWeeks(weekStart, 1);
        return {
            weekNumber: i + 1,
            date: weekStart,
            label: `W${i + 1}`,
            dateRange: `(${format(weekStart, 'd', { locale: th })}-${format(weekEnd, 'd', { locale: th })})`,
            month: format(weekStart, 'MMM yyyy', { locale: th }),
            monthIndex: getMonth(weekStart),
            year: getYear(weekStart)
        };
    });
    // จัดกลุ่ม weeks ตามเดือน
    const monthGroups: { month: string; weeks: typeof weeks }[] = [];
    weeks.forEach(week => {
        const lastGroup = monthGroups[monthGroups.length - 1];
        if (!lastGroup || lastGroup.month !== week.month) {
            monthGroups.push({ month: week.month, weeks: [week] });
        } else {
            lastGroup.weeks.push(week);
        }
    });
    // จัดกลุ่ม items ตาม category
    const groupedItems = items.reduce((acc, item) => {
        const cat = item.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, UITimelineItem[]>);
    const categories = [
        { key: 'Setup', serviceType: 'setup', label: 'Setup', color: 'bg-blue-100' },
        { key: 'Coperate Identity', serviceType: 'coperateIdentity', label: 'Coperate Identity', color: 'bg-purple-100' },
        { key: 'Website', serviceType: 'website', label: 'Website', color: 'bg-green-100' },
        { key: 'Social Media', serviceType: 'socialMedia', label: 'Social Media', color: 'bg-pink-100' },
        { key: 'Training', serviceType: 'training', label: 'Training', color: 'bg-orange-100' },
    ];
    // ==================== HANDLERS ====================

    // Handle drag start
    const handleMouseDown = (itemId: string, type: 'move' | 'resize-start' | 'resize-end', e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggedItem(itemId);
        setDragType(type);
    };
    // Handle drag move - track position for save
    const handleMouseMove = useCallback((weekNumber: number) => {
        if (!draggedItem || !dragType) return;
        setPendingUpdate({
            itemId: draggedItem,
            weekNumber,
            type: dragType,
        });
    }, [draggedItem, dragType]);
    // Save timeline item after drag ends
    const saveTimelineItem = useCallback(async (update: typeof pendingUpdate) => {
        if (!update) return;
        const { itemId, weekNumber, type } = update;
        const item = items.find(i => i.id === itemId);
        if (!item || !item.id) {
            return;
        }
        let updates: { weekStart?: number; weekEnd?: number } = {};
        if (type === 'move') {
            const duration = item.endWeek - item.startWeek;
            updates = {
                weekStart: weekNumber,
                weekEnd: weekNumber + duration,
            };
        } else if (type === 'resize-start') {
            if (weekNumber < item.endWeek) {
                updates = { weekStart: weekNumber };
            }
        } else if (type === 'resize-end') {
            if (weekNumber > item.startWeek) {
                updates = { weekEnd: weekNumber };
            }
        }
        if (Object.keys(updates).length > 0) {
            setIsSaving(true);
            try {
                await onUpdateItem(itemId, updates);
            } catch (error) {
                console.error('Failed to save timeline item:', error);
            } finally {
                setIsSaving(false);
            }
        }
    }, [items, onUpdateItem]);
    // Handle drag end - save to API
    const handleMouseUp = useCallback(async () => {
        if (!draggedItem || !dragType) {
            setDraggedItem(null);
            setDragType(null);
            return;
        }
        // Save pending update
        if (pendingUpdate) {
            await saveTimelineItem(pendingUpdate);
            setPendingUpdate(null);
        }
        setDraggedItem(null);
        setDragType(null);
    }, [draggedItem, dragType, pendingUpdate, saveTimelineItem]);
    // Handle cell click - create timeline for item
    const handleCellClick = async (itemId: string, weekNumber: number) => {
        if (draggedItem) return;

        const item = items.find(i => i.id === itemId);
        if (!item || !item.id) return;
        // If item has no timeline yet (weekStart = 0), create one
        if (item.startWeek === 0 || item.endWeek === 0) {
            setIsSaving(true);
            try {
                await onUpdateItem(item.id, {
                    weekStart: weekNumber,
                    weekEnd: weekNumber,
                });
            } finally {
                setIsSaving(false);
            }
        }
    };
    // Handle double click to edit description
    const handleDoubleClick = (itemId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const item = items.find(i => i.id === itemId);
        if (item) {
            const target = e.currentTarget as HTMLElement;
            const rect = target.getBoundingClientRect();
            const timelineWidth = (item.endWeek - item.startWeek + 1) * 96;
            setEditingItem(itemId);
            setEditValue(item.description || '');
            setEditPosition({
                top: rect.top,
                left: rect.left,
                width: timelineWidth
            });
        }
    };
    const handleEditSubmit = async () => {
        if (editingItem) {
            const item = items.find(i => i.id === editingItem);
            if (item && item.id) {
                setIsSaving(true);
                try {
                    await onUpdateItem(item.id, { serviceName: editValue || item.name });
                } finally {
                    setIsSaving(false);
                }
            }
            setEditingItem(null);
            setEditValue('');
            setEditPosition(null);
        }
    };
    const handleEditCancel = () => {
        setEditingItem(null);
        setEditValue('');
        setEditPosition(null);
    };
    const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, itemId });
    };
    const handleDeleteTimeline = async (itemId: string) => {
        const item = items.find(i => i.id === itemId);
        if (!item || !item.id) return;
        setIsSaving(true);
        try {
            await onUpdateItem(item.id, { weekStart: 0, weekEnd: 0 });
        } finally {
            setIsSaving(false);
            setContextMenu(null);
        }
    };
    // ==================== EFFECTS ====================

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);
    // Global mouse up for drag end
    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseUp]);
    // Focus input when editing
    useEffect(() => {
        if (editingItem && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingItem]);
    // ==================== RENDER ====================
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600">กำลังโหลด Timeline...</span>
            </div>
        );
    }
    return (
        <div className="w-full overflow-x-auto relative select-none">
            {/* Saving indicator */}
            {isSaving && (
                <div className="absolute top-2 right-2 flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-md z-50">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                    <span className="text-sm text-gray-600">กำลังบันทึก...</span>
                </div>
            )}
            <div className="min-w-max" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                {/* Header - Month Row */}
                <div className="flex border-b bg-gray-100">
                    <div className="w-64 border-r"></div>
                    <div className="w-32 border-r"></div>
                    {monthGroups.map((group, idx) => (
                        <div
                            key={idx}
                            className="border-r px-3 py-2 text-center font-semibold text-gray-700"
                            style={{ width: `${group.weeks.length * 96}px` }}
                        >
                            {group.month}
                        </div>
                    ))}
                </div>

                {/* Header - Week Row */}
                <div className="flex border-b bg-gray-50">
                    <div className="w-64 border-r p-3 font-semibold">รายการ</div>
                    <div className="w-32 border-r p-3 font-semibold text-center">จำนวน</div>
                    {weeks.map((week) => (
                        <div key={week.weekNumber} className="w-24 border-r p-2 text-center">
                            <div className="font-semibold text-sm">{week.label}</div>
                            <div className="text-xs text-gray-500">{week.dateRange}</div>
                        </div>
                    ))}
                </div>

                {/* Body */}
                {categories.map((category) => (
                    <div key={category.key}>
                        {/* Category Header */}
                        <div className={`flex border-b ${category.color}`}>
                            <div className="w-64 border-r p-3 font-semibold text-blue-700">
                                {category.label}
                            </div>
                            <div className="w-32 border-r"></div>
                            {weeks.map((week) => (
                                <div key={week.weekNumber} className="w-24 border-r"></div>
                            ))}
                        </div>

                        {/* Category Items */}
                        {groupedItems[category.key]?.map((item) => {
                            const hasTimeline = item.startWeek > 0 && item.endWeek > 0;

                            return (
                                <div key={item.id} className="flex border-b hover:bg-gray-50 relative">
                                    <div className="w-64 border-r p-3">{item.name}</div>
                                    <div className="w-32 border-r p-3 text-center text-sm text-gray-600">
                                        {item.unit || '---'}
                                    </div>

                                    {/* Timeline Grid */}
                                    <div className="flex relative" style={{ width: `${weeks.length * 96}px` }}>
                                        {weeks.map((week, weekIndex) => {
                                            const weekNum = week.weekNumber;
                                            const isInTimeline = hasTimeline && item.startWeek <= weekNum && item.endWeek >= weekNum;
                                            const isMiddleCell = hasTimeline && weekNum > item.startWeek && weekNum < item.endWeek;

                                            return (
                                                <div
                                                    key={week.weekNumber}
                                                    className={`w-24 h-12 relative cursor-pointer hover:bg-blue-50 ${isMiddleCell ? '' : 'border-r'
                                                        }`}
                                                    onMouseEnter={() => handleMouseMove(weekNum)}
                                                    onClick={() => handleCellClick(item.id, weekNum)}
                                                >
                                                    {/* Timeline Bar */}
                                                    {isInTimeline && item.startWeek === weekNum && (
                                                        <div
                                                            data-item-id={item.id}
                                                            className={`absolute top-0 left-0 h-12 ${draggedItem === item.id ? 'opacity-70' : ''
                                                                } ${editingItem === item.id ? 'ring-2 ring-purple-500' : ''}`}
                                                            style={{
                                                                backgroundColor: item.color || '#6366f1',
                                                                width: `${(item.endWeek - item.startWeek + 1) * 96}px`,
                                                                zIndex: 10,
                                                            }}
                                                            onMouseDown={(e) => handleMouseDown(item.id, 'move', e)}
                                                            onDoubleClick={(e) => handleDoubleClick(item.id, e)}
                                                            onContextMenu={(e) => handleContextMenu(e, item.id)}
                                                        >
                                                            {/* Resize Handle - Start */}
                                                            <div
                                                                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white hover:bg-opacity-30 z-10"
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    handleMouseDown(item.id, 'resize-start', e);
                                                                }}
                                                            />

                                                            {/* Description/Name Text */}
                                                            <div className="absolute inset-0 flex items-center px-3 text-xs text-white font-medium overflow-hidden whitespace-nowrap">
                                                                {item.description}
                                                            </div>
                                                            {/* Resize Handle - End */}
                                                            <div
                                                                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white hover:bg-opacity-30 z-10"
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    handleMouseDown(item.id, 'resize-end', e);
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}

                {/* Inline Edit Input */}
                {editingItem && editPosition && (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleEditSubmit();
                            } else if (e.key === 'Escape') {
                                handleEditCancel();
                            }
                        }}
                        onBlur={handleEditSubmit}
                        className="fixed z-50 px-3 py-1 text-xs text-white bg-purple-600 border-2 border-purple-500 rounded-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                        style={{
                            top: editPosition.top,
                            left: editPosition.left,
                            width: editPosition.width,
                            height: '48px',
                        }}
                        placeholder="พิมพ์ข้อความ..."
                    />
                )}

                {/* Context Menu */}
                {contextMenu && (
                    <div
                        className="fixed bg-white border rounded-lg shadow-lg py-1 z-50"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                    >
                        <button
                            onClick={() => {
                                const item = items.find(i => i.id === contextMenu.itemId);
                                if (item) {
                                    const target = document.querySelector(`[data-item-id="${item.id}"]`) as HTMLElement;
                                    if (target) {
                                        const rect = target.getBoundingClientRect();
                                        const timelineWidth = (item.endWeek - item.startWeek + 1) * 96;
                                        setEditingItem(item.id);
                                        setEditValue(item.description || item.name);
                                        setEditPosition({
                                            top: rect.top,
                                            left: rect.left,
                                            width: timelineWidth
                                        });
                                    }
                                }
                                setContextMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                        >
                            แก้ไข
                        </button>
                        <button
                            onClick={() => handleDeleteTimeline(contextMenu.itemId)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600"
                        >
                            ลบ Timeline
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}