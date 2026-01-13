import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ClinicCardProps {
  id: string;
  name: string;
  logo?: string;
  onClick?: () => void;
}

export function ClinicCard({ name, logo, onClick }: ClinicCardProps) {
  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-1',
        'border-none bg-transparent'
      )}
      onClick={onClick}
    >
      <div className="flex flex-col items-center gap-3 p-4">
        {/* Folder Icon */}
        <div className="relative w-full aspect-square max-w-[140px]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl rounded-tl-none shadow-md group-hover:shadow-xl transition-shadow">
            {/* Folder Tab */}
            <div className="absolute -top-3 left-0 w-16 h-6 bg-gradient-to-br from-blue-400 to-blue-500 rounded-t-lg" />
            
            {/* Logo/Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              {logo ? (
                <img src={logo} alt={name} className="w-16 h-16 object-contain" />
              ) : (
                <span className="text-3xl font-bold text-white/80">Logo</span>
              )}
            </div>
          </div>
        </div>

        {/* Clinic Name */}
        <h3 className="text-sm font-medium text-gray-900 text-center line-clamp-2 w-full">
          {name}
        </h3>
      </div>
    </Card>
  );
}