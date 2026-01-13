import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, RotateCcw, Trash2, Database, Info } from 'lucide-react';
import { isMockMode } from '@/config/env';
import { storageManager, mockTaskApiService } from '@/services';
import { useTaskStore } from '@/stores/taskStore';

/**
 * DevTools component for managing mock data in development
 * Only shows when in mock mode
 */
export function DevTools() {
  const [showInfo, setShowInfo] = useState(false);
  const { fetchAll, tasks, users, clinics } = useTaskStore();

  if (!isMockMode()) {
    return null;
  }

  const handleReset = () => {
    if (confirm('รีเซ็ตข้อมูลกลับไปเป็นค่าเริ่มต้นหรือไม่?')) {
      mockTaskApiService.reset();
      fetchAll();
      alert('รีเซ็ตข้อมูลเรียบร้อยแล้ว');
    }
  };

  const handleClear = () => {
    if (confirm('ลบข้อมูลทั้งหมดหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      mockTaskApiService.clear();
      fetchAll();
      alert('ลบข้อมูลเรียบร้อยแล้ว');
    }
  };

  const handleDownload = () => {
    mockTaskApiService.downloadData();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            storageManager.importData(data);
            fetchAll();
            alert('นำเข้าข้อมูลเรียบร้อยแล้ว');
          } catch (error) {
            alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg z-50 border-purple-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Dev Tools</CardTitle>
          </div>
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            Mock Mode
          </Badge>
        </div>
        <CardDescription className="text-xs">
          จัดการข้อมูลทดสอบ (localStorage)
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Data Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 rounded p-2">
            <div className="text-xs text-gray-500">Tasks</div>
            <div className="text-lg font-semibold text-gray-900">{tasks.length}</div>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <div className="text-xs text-gray-500">Users</div>
            <div className="text-lg font-semibold text-gray-900">{users.length}</div>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <div className="text-xs text-gray-500">Clinics</div>
            <div className="text-lg font-semibold text-gray-900">{clinics.length}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="w-full text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        {/* Info Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInfo(!showInfo)}
          className="w-full text-xs"
        >
          <Info className="h-3 w-3 mr-1" />
          {showInfo ? 'ซ่อนข้อมูล' : 'แสดงข้อมูลเพิ่มเติม'}
        </Button>

        {/* Info Panel */}
        {showInfo && (
          <div className="bg-blue-50 rounded p-3 text-xs space-y-2">
            <p className="font-medium text-blue-900">คำแนะนำ:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• <strong>Export:</strong> ดาวน์โหลดข้อมูลเป็นไฟล์ JSON</li>
              <li>• <strong>Import:</strong> นำเข้าข้อมูลจากไฟล์ JSON</li>
              <li>• <strong>Reset:</strong> รีเซ็ตกลับเป็นข้อมูลเริ่มต้น</li>
              <li>• <strong>Clear:</strong> ลบข้อมูลทั้งหมด</li>
            </ul>
            <p className="text-blue-600 pt-2">
              ข้อมูลจะถูกบันทึกใน localStorage ของ browser
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}