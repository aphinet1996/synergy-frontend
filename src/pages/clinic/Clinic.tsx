import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ClinicCard } from '@/components/clinic/ClinicCard';
import { ClinicDialog } from '@/components/clinic/ClinicDialog';
import { Search, ChevronDown, Plus, Folder, RefreshCw } from 'lucide-react';
import { useClinicStore } from '@/stores/clinicStore';
import { useUserStore } from '@/stores/userStore';
import type { SortBy, ClinicListParams } from '@/types/clinic';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { debounce } from 'lodash';

const ITEMS_PER_PAGE = 18;
const SEARCH_DEBOUNCE_MS = 500;

export default function Clinics() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  // Zustand store
  const {
    clinics,
    pagination,
    loading,
    error,
    fetchClinics,
    clearError
  } = useClinicStore();

  // User store - get user role
  const { user } = useUserStore();

  // Check if user can add clinic (admin or manager only)
  const canAddClinic = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'manager';
  }, [user?.role]);

  const sortOptions = {
    newest: 'คลินิกที่สร้างใหม่ (ค่าเริ่มต้น)',
    name: 'เรียงตามชื่อภาษาอังกฤษ',
    contract: 'เรียงตามระยะเวลาสัญญาที่เหลืออยู่ที่สุด',
  };

  // สร้าง debounced function สำหรับ fetch
  const debouncedFetch = useCallback(
    debounce((params: ClinicListParams) => {
      fetchClinics(params);
      setIsSearching(false);
    }, SEARCH_DEBOUNCE_MS),
    [fetchClinics]
  );

  // Fetch clinics when params change
  useEffect(() => {
    const params: ClinicListParams = {
      search: searchQuery,
      sort: sortBy,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
    };

    if (searchQuery) {
      setIsSearching(true);
      debouncedFetch(params);
    } else {
      // ถ้าไม่มี search query ให้ fetch ทันที
      fetchClinics(params);
      setIsSearching(false);
    }

    // Cleanup function
    return () => {
      debouncedFetch.cancel();
    };
  }, [searchQuery, sortBy, currentPage, debouncedFetch, fetchClinics]);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (!pagination) return [];

    const totalPages = pagination.totalPages;
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('ellipsis');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value !== searchQuery && currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleSortChange = (value: SortBy) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleAddSuccess = () => {
    // Refresh clinic list from API
    const params: ClinicListParams = {
      search: searchQuery,
      sort: sortBy,
      page: 1,
      limit: ITEMS_PER_PAGE,
    };
    setCurrentPage(1);
    fetchClinics(params);
  };

  const handleClinicClick = (clinicId: string) => {
    navigate(`/clinic/${clinicId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = () => {
    // Cancel any pending debounced calls
    debouncedFetch.cancel();

    const params: ClinicListParams = {
      search: searchQuery,
      sort: sortBy,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
    };
    fetchClinics(params);
    setIsSearching(false);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Loading skeleton
  const renderSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="w-full aspect-square rounded-lg" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
        </div>
      ))}
    </div>
  );

  // Check if it's initial loading
  const isInitialLoading = loading && !clinics.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">คลินิก</h1>
        <p className="text-gray-500 mt-2">จัดการข้อมูลคลินิกทั้งหมด</p>
      </div>

      {/* Search, Filter, and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="ค้นหาชื่อคลินิก..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {/* Search indicator / Clear button */}
          {(isSearching || searchQuery) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isSearching ? (
                <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
              ) : searchQuery ? (
                <button
                  onClick={handleClearSearch}
                  className="text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
            </div>
          )}
        </div>

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto min-w-[280px]"
              disabled={isInitialLoading}
            >
              <span className="flex items-center gap-2 flex-1">
                <span className="font-medium">Filter</span>
                <ChevronDown className="h-4 w-4" />
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => handleSortChange(value as SortBy)}>
              {Object.entries(sortOptions).map(([key, label]) => (
                <DropdownMenuRadioItem key={key} value={key}>
                  <span className={key === 'newest' ? 'text-purple-600' : ''}>
                    {label}
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Refresh Button */}
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="icon"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading && !isSearching ? 'animate-spin' : ''}`} />
        </Button>

        {/* Add Button - Only show for admin and manager */}
        {canAddClinic && (
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มคลินิกใหม่
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="link"
              className="ml-2 p-0 h-auto"
              onClick={() => clearError()}
            >
              ปิด
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Results Info */}
      {!isInitialLoading && pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            แสดง {clinics.length} จาก {pagination.total} คลินิก
            {isSearching && (
              <span className="ml-2 text-gray-400">(กำลังค้นหา...)</span>
            )}
          </div>
          {pagination.totalPages > 1 && (
            <div className="text-sm text-gray-600">
              หน้า {currentPage} จาก {pagination.totalPages}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {isInitialLoading ? (
        renderSkeleton()
      ) : clinics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-gray-400 mb-4">
            <Folder className="h-16 w-16" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            ไม่พบคลินิก
          </h3>
          <p className="text-gray-500 text-center max-w-sm">
            {searchQuery
              ? 'ไม่พบคลินิกที่ตรงกับคำค้นหา ลองค้นหาด้วยคำอื่น'
              : 'เริ่มต้นด้วยการเพิ่มคลินิกแรกของคุณ'}
          </p>
          {/* Only show add button for admin and manager when no search query */}
          {!searchQuery && canAddClinic && (
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="mt-4 bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มคลินิกใหม่
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {clinics.map((clinic) => (
              <ClinicCard
                key={clinic.id}
                id={clinic.id}
                name={clinic.name.th || clinic.name.en}
                logo={clinic.clinicProfile}
                onClick={() => handleClinicClick(clinic.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>

                  {getPageNumbers().map((pageNum, idx) => {
                    if (pageNum === 'ellipsis') {
                      return (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum as number)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => currentPage < pagination.totalPages && handlePageChange(currentPage + 1)}
                      className={currentPage === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Add Clinic Dialog - Only render for admin and manager */}
      {canAddClinic && (
        <ClinicDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  );
}