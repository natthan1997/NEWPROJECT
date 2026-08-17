interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({ 
  className = '', 
  width, 
  height, 
  rounded = 'md' 
}: SkeletonProps) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`bg-gray-200 animate-pulse ${roundedClasses[rounded]} ${className}`}
      style={style}
    />
  );
}

// Predefined skeleton components
export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton width={40} height={40} rounded="lg" />
          <div className="flex-1">
            <Skeleton height={20} className="w-1/2 mb-2" />
            <Skeleton height={16} className="w-3/4" />
          </div>
        </div>
        <SkeletonText lines={3} />
        <div className="flex gap-2">
          <Skeleton height={32} className="w-20" />
          <Skeleton height={32} className="w-24" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonForm({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="space-y-2">
        <Skeleton height={16} className="w-24" />
        <Skeleton height={40} className="w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton height={16} className="w-32" />
        <Skeleton height={40} className="w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton height={16} className="w-28" />
        <Skeleton height={100} className="w-full" />
      </div>
      <div className="flex gap-4">
        <Skeleton height={44} className="flex-1" />
        <Skeleton height={44} className="flex-1" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-4">
          <Skeleton height={16} className="w-20" />
          <Skeleton height={16} className="w-24" />
          <Skeleton height={16} className="w-16" />
          <Skeleton height={16} className="w-20" />
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4">
            <div className="grid grid-cols-4 gap-4">
              <Skeleton height={16} className="w-32" />
              <Skeleton height={16} className="w-40" />
              <Skeleton height={16} className="w-24" />
              <div className="flex gap-2">
                <Skeleton height={24} className="w-16" />
                <Skeleton height={24} className="w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function POSSkeleton() {
  return (
    <div className="h-screen w-screen bg-[#F9F9F6] flex flex-col overflow-hidden font-sans select-none antialiased">
      {/* Header Skeleton */}
      <header className="h-[70px] border-b border-zinc-200 bg-white flex items-center justify-between px-6 xl:px-10 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Skeleton width={120} height={28} rounded="lg" />
        </div>
        <div className="flex items-center bg-zinc-100 p-1.5 rounded-2xl gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width={100} height={36} rounded="xl" />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Skeleton width={36} height={36} rounded="full" />
          <Skeleton width={36} height={36} rounded="full" />
          <Skeleton width={60} height={20} rounded="md" />
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel: Products List */}
        <div className="flex-1 flex flex-col overflow-hidden p-6 sm:p-8">
          {/* Search bar and Sub-views */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Skeleton height={46} className="w-full max-w-md" rounded="xl" />
            <div className="flex items-center gap-2">
              <Skeleton width={120} height={38} rounded="xl" />
              <Skeleton width={120} height={38} rounded="xl" />
            </div>
          </div>

          {/* Categories Horizontal / Vertical List */}
          <div className="mb-6 flex gap-3 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} width={i === 0 ? 80 : 100} height={38} rounded="xl" className="shrink-0" />
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-3 flex flex-col gap-3 shadow-xs">
                  <Skeleton className="w-full aspect-square animate-pulse" rounded="xl" />
                  <div className="space-y-2">
                    <Skeleton height={14} className="w-4/5" />
                    <Skeleton height={10} className="w-1/2" />
                  </div>
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <Skeleton height={16} className="w-1/3" />
                    <Skeleton width={28} height={28} rounded="full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Cart */}
        <div className="hidden md:flex w-[380px] lg:w-[440px] xl:w-[480px] border-l border-zinc-200 bg-white flex-col shrink-0">
          <header className="p-6 border-b border-gray-100 shrink-0 flex items-center justify-between">
            <Skeleton width={100} height={24} />
            <Skeleton width={80} height={20} />
          </header>

          {/* Cart items list */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton width={64} height={64} rounded="xl" className="shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton height={14} className="w-2/3" />
                  <Skeleton height={10} className="w-1/2" />
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Skeleton height={14} className="w-12" />
                  <Skeleton width={60} height={24} rounded="lg" />
                </div>
              </div>
            ))}
          </div>

          {/* Cart Footer */}
          <footer className="p-6 border-t border-gray-100 bg-[#FDFDFB] space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton width={120} height={16} />
              <Skeleton width={40} height={16} />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-150">
              <Skeleton width={100} height={18} />
              <Skeleton width={80} height={24} />
            </div>
            <div className="flex gap-3 pt-2">
              <Skeleton height={48} className="flex-1" rounded="xl" />
              <Skeleton height={48} className="flex-[2]" rounded="xl" />
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}