import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    FileText,
    Plus,
    RefreshCw,
    AlertCircle,
    Loader2,
    MoreVertical,
    Pencil,
    Trash2,
    ArrowLeft,
    Clock,
    User,
} from 'lucide-react';
import { TiptapEditor } from './TiptapEditor';
import { clinicService, type ClinicDocument } from '@/services/clinicService';

interface DocumentTabProps {
    clinicId: string;
}

/**
 * Safe date formatting - handles all edge cases
 */
const formatDate = (date: any, formatStr: 'short' | 'long' = 'long'): string => {
    // Handle null, undefined, empty string
    if (!date) return '-';

    try {
        let dateObj: Date;

        // If already a Date object
        if (date instanceof Date) {
            dateObj = date;
        }
        // If string, try to parse
        else if (typeof date === 'string') {
            dateObj = new Date(date);
        }
        // If number (timestamp)
        else if (typeof date === 'number') {
            dateObj = new Date(date);
        }
        // Unknown type
        else {
            return '-';
        }

        // Check if date is valid
        if (isNaN(dateObj.getTime())) {
            return '-';
        }

        // Format based on requested format
        if (formatStr === 'short') {
            return dateObj.toLocaleDateString('th-TH', {
                day: '2-digit',
                month: 'short',
                year: '2-digit',
            });
        }

        // Long format
        return dateObj.toLocaleDateString('th-TH', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (error) {
        console.warn('Date formatting error:', error, 'for date:', date);
        return '-';
    }
};

const getUserName = (user: any): string => {
    if (!user) return 'Unknown';

    // If user is just a string
    if (typeof user === 'string') return user;

    // If user has 'name' property
    if (user.name && typeof user.name === 'string') return user.name;

    // If user has firstname/lastname
    if (user.firstname || user.lastname) {
        const fullName = `${user.firstname || ''} ${user.lastname || ''}`.trim();
        return fullName || user.nickname || 'Unknown';
    }

    // If user has nickname
    if (user.nickname) return user.nickname;

    // If user has username
    if (user.username) return user.username;

    return 'Unknown';
};

// ==================== COMPONENT ====================

export function DocumentTab({ clinicId }: DocumentTabProps) {
    // Document list state
    const [documents, setDocuments] = useState<ClinicDocument[]>([]);
    const [documentsLoading, setDocumentsLoading] = useState(false);
    const [documentsError, setDocumentsError] = useState<string | null>(null);

    // Selected document state
    const [selectedDocument, setSelectedDocument] = useState<ClinicDocument | null>(null);
    const [selectedDocLoading, setSelectedDocLoading] = useState(false);

    // Create dialog state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newDocTitle, setNewDocTitle] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    // Rename dialog state
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [renameDocId, setRenameDocId] = useState<string | null>(null);
    const [renameTitle, setRenameTitle] = useState('');
    const [renameLoading, setRenameLoading] = useState(false);

    // Fetch documents list
    const fetchDocuments = useCallback(async () => {
        if (!clinicId) return;

        setDocumentsLoading(true);
        setDocumentsError(null);

        try {
            const response = await clinicService.getDocuments(clinicId);

            if (response.success && response.data) {
                setDocuments(response.data.documents || []);
            } else {
                setDocumentsError(response.error || 'Failed to fetch documents');
            }
        } catch (error) {
            console.error('Fetch documents error:', error);
            setDocumentsError('Network error');
        }

        setDocumentsLoading(false);
    }, [clinicId]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    // Create new document
    const handleCreate = async () => {
        if (!newDocTitle.trim() || !clinicId) return;

        setCreateLoading(true);

        try {
            const response = await clinicService.createDocument(clinicId, {
                title: newDocTitle.trim(),
                content: '<p></p>',
            });

            if (response.success && response.data) {
                setNewDocTitle('');
                setIsCreateOpen(false);
                await fetchDocuments();
                // Open the new document
                if (response.data.document) {
                    setSelectedDocument(response.data.document);
                }
            } else {
                setDocumentsError(response.error || 'Failed to create document');
            }
        } catch (error) {
            console.error('Create document error:', error);
            setDocumentsError('Network error');
        }

        setCreateLoading(false);
    };

    // Select document to edit
    const handleSelectDocument = async (doc: ClinicDocument) => {
        const docId = doc.id || doc._id;
        if (!docId || !clinicId) return;

        setSelectedDocLoading(true);

        try {
            const response = await clinicService.getDocument(clinicId, docId);

            if (response.success && response.data) {
                setSelectedDocument(response.data.document);
            } else {
                setDocumentsError(response.error || 'Failed to load document');
            }
        } catch (error) {
            console.error('Select document error:', error);
            setDocumentsError('Network error');
        }

        setSelectedDocLoading(false);
    };

    // Save document content
    const handleSaveDocument = async (content: string) => {
        const docId = selectedDocument?.id || selectedDocument?._id;
        if (!docId || !clinicId) return;

        const response = await clinicService.updateDocument(clinicId, docId, { content });

        if (response.success && response.data) {
            setSelectedDocument(response.data.document);
            // Update in list
            setDocuments((prev) =>
                prev.map((d) => ((d.id || d._id) === docId ? response.data!.document : d))
            );
        } else {
            throw new Error(response.error || 'Failed to save document');
        }
    };

    // Rename document
    const handleOpenRename = (doc: ClinicDocument) => {
        const docId = doc.id || doc._id;
        if (!docId) return;
        setRenameDocId(docId);
        setRenameTitle(doc.title);
        setIsRenameOpen(true);
    };

    const handleRename = async () => {
        if (!renameDocId || !renameTitle.trim() || !clinicId) return;

        setRenameLoading(true);

        try {
            const response = await clinicService.updateDocument(clinicId, renameDocId, {
                title: renameTitle.trim(),
            });

            if (response.success && response.data) {
                setIsRenameOpen(false);
                setRenameDocId(null);
                setRenameTitle('');
                await fetchDocuments();
                // Update selected if it's the same doc
                if (selectedDocument && (selectedDocument.id || selectedDocument._id) === renameDocId) {
                    setSelectedDocument(response.data.document);
                }
            } else {
                setDocumentsError(response.error || 'Failed to rename document');
            }
        } catch (error) {
            console.error('Rename document error:', error);
            setDocumentsError('Network error');
        }

        setRenameLoading(false);
    };

    // Delete document
    const handleDelete = async (doc: ClinicDocument) => {
        const docId = doc.id || doc._id;
        if (!docId || !clinicId) return;

        if (!confirm(`คุณต้องการลบเอกสาร "${doc.title}" ใช่หรือไม่?`)) return;

        try {
            const response = await clinicService.deleteDocument(clinicId, docId);

            if (response.success) {
                // Close if currently viewing this doc
                if (selectedDocument && (selectedDocument.id || selectedDocument._id) === docId) {
                    setSelectedDocument(null);
                }
                await fetchDocuments();
            } else {
                setDocumentsError(response.error || 'Failed to delete document');
            }
        } catch (error) {
            console.error('Delete document error:', error);
            setDocumentsError('Network error');
        }
    };

    // Back to list
    const handleBackToList = () => {
        setSelectedDocument(null);
    };

    // Loading state for selected document
    if (selectedDocLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600">กำลังโหลดเอกสาร...</span>
            </div>
        );
    }

    // Document Editor View
    if (selectedDocument) {
        const updatedAtDisplay = formatDate(selectedDocument.updatedAt || selectedDocument.createdAt);
        const createdByName = getUserName(selectedDocument.createdBy);

        return (
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={handleBackToList}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            กลับ
                        </Button>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {selectedDocument.title || 'Untitled'}
                            </h2>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {createdByName}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    อัปเดตล่าสุด: {updatedAtDisplay}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editor */}
                <TiptapEditor
                    content={selectedDocument.content || '<p></p>'}
                    onSave={handleSaveDocument}
                    placeholder="เริ่มพิมพ์เนื้อหาเอกสาร..."
                    autoSave
                    autoSaveDelay={5000}
                />
            </div>
        );
    }

    // Document List View
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-purple-600" />
                        เอกสาร
                    </h2>
                    <p className="text-gray-600 mt-1">จัดการเอกสารของคลินิก</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchDocuments}
                        disabled={documentsLoading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${documentsLoading ? 'animate-spin' : ''}`} />
                        รีเฟรช
                    </Button>
                    <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 gap-2"
                        onClick={() => setIsCreateOpen(true)}
                    >
                        <Plus className="h-4 w-4" />
                        สร้างเอกสาร
                    </Button>
                </div>
            </div>

            {/* Error */}
            {documentsError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{documentsError}</AlertDescription>
                </Alert>
            )}

            {/* Loading */}
            {documentsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
            ) : documents.length === 0 ? (
                // Empty state
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">ยังไม่มีเอกสาร</p>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        สร้างเอกสารแรก
                    </Button>
                </div>
            ) : (
                // Document Grid
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {documents.map((doc) => {
                        const docId = doc.id || doc._id || Math.random().toString();
                        const docUpdatedAt = formatDate(doc.updatedAt || doc.createdAt, 'short');
                        const docCreatedBy = getUserName(doc.createdBy);

                        return (
                            <Card
                                key={docId}
                                className="group hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => handleSelectDocument(doc)}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-base font-medium text-gray-900 line-clamp-2 flex-1">
                                            {doc.title || 'Untitled'}
                                        </CardTitle>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenRename(doc);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    แก้ไขชื่อ
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(doc);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    ลบ
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0 space-y-2">
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {docCreatedBy}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {docUpdatedAt}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create Document Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>สร้างเอกสารใหม่</DialogTitle>
                        <DialogDescription>ตั้งชื่อเอกสารของคุณ</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="docTitle">ชื่อเอกสาร</Label>
                            <Input
                                id="docTitle"
                                placeholder="เช่น แผนการรักษา, รายงานประจำเดือน"
                                value={newDocTitle}
                                onChange={(e) => setNewDocTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !createLoading) {
                                        handleCreate();
                                    }
                                }}
                                disabled={createLoading}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsCreateOpen(false);
                                setNewDocTitle('');
                            }}
                            disabled={createLoading}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            onClick={handleCreate}
                            className="bg-purple-600 hover:bg-purple-700"
                            disabled={!newDocTitle.trim() || createLoading}
                        >
                            {createLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    กำลังสร้าง...
                                </>
                            ) : (
                                'สร้างเอกสาร'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Document Dialog */}
            <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>เปลี่ยนชื่อเอกสาร</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="renameTitle">ชื่อใหม่</Label>
                            <Input
                                id="renameTitle"
                                value={renameTitle}
                                onChange={(e) => setRenameTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !renameLoading) {
                                        handleRename();
                                    }
                                }}
                                disabled={renameLoading}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsRenameOpen(false);
                                setRenameDocId(null);
                                setRenameTitle('');
                            }}
                            disabled={renameLoading}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            onClick={handleRename}
                            className="bg-purple-600 hover:bg-purple-700"
                            disabled={!renameTitle.trim() || renameLoading}
                        >
                            {renameLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    กำลังบันทึก...
                                </>
                            ) : (
                                'บันทึก'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default DocumentTab;