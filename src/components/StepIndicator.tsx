import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Progress Bar Background */}
      <div className="relative">
        {/* Background Line */}
        <div
          className="absolute top-4 h-0.5 bg-gray-200 -z-10"
          style={{ left: `${100 / totalSteps / 2}%`, right: `${100 / totalSteps / 2}%` }}
        />

        {/* Active Progress Line */}
        <div
          className="absolute top-4 h-0.5 bg-gradient-to-r from-purple-500 to-purple-600 -z-10 transition-all duration-500 ease-in-out"
          style={{
            left: `${100 / totalSteps / 2}%`,
            width: `${((currentStep - 1) / (totalSteps - 1)) * (100 - 100 / totalSteps)}%`,
          }}
        />

        {/* Steps */}
        <div className="flex items-start justify-between relative">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isUpcoming = stepNumber > currentStep;

            return (
              <div
                key={stepNumber}
                className="flex flex-col items-center transition-all duration-300"
                style={{ width: `${100 / totalSteps}%` }}
              >
                {/* Step Circle */}
                <div className="relative">
                  {/* Outer Ring - Animated */}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-purple-600 opacity-20 animate-ping" />
                  )}

                  {/* Main Circle */}
                  <div
                    className={cn(
                      'relative w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all duration-300 shadow-sm',
                      isCompleted && 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md shadow-purple-500/30 scale-100',
                      isCurrent && 'bg-gradient-to-br from-purple-600 to-purple-700 text-white ring-2 ring-purple-100 shadow-lg shadow-purple-600/40 scale-105',
                      isUpcoming && 'bg-white border-2 border-gray-300 text-gray-400'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4 animate-in zoom-in duration-200" />
                    ) : (
                      <span className={cn(
                        'transition-all duration-200',
                        isCurrent && 'scale-105'
                      )}>
                        {stepNumber}
                      </span>
                    )}
                  </div>

                  {/* Glow Effect for Current Step */}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-purple-600 blur-sm opacity-30 -z-10" />
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-2 text-center max-w-[100px]">
                  <div
                    className={cn(
                      'text-[11px] font-medium transition-all duration-200',
                      isCompleted && 'text-purple-600',
                      isCurrent && 'text-purple-700 font-semibold',
                      isUpcoming && 'text-gray-400'
                    )}
                  >
                    {step}
                  </div>

                  {/* Step Status */}
                  {/* <div className="mt-0.5">
                    {isCompleted && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-purple-50 text-purple-600 animate-in fade-in duration-200">
                        เสร็จสิ้น
                      </span>
                    )}
                    {isCurrent && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-purple-100 text-purple-700 animate-pulse">
                        กำลังดำเนินการ
                      </span>
                    )}
                  </div> */}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}