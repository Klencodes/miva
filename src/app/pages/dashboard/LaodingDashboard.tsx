export default function LaodingDashboard() {
  return (
    <div className="h-full bg-background">
      {/* Shimmer Animation Container */}
      <div className="relative overflow-hidden">
        {/* Main Content Skeleton */}
        <div className="w-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-3">
              <div className="h-8 w-64 bg-card rounded-sm animate-pulse relative">
                <div className="absolute inset-0 -translate-x-full bg-disabled shimmer"></div>
              </div>
              <div className="h-4 w-96 bg-card rounded-sm animate-pulse relative">
                <div className="absolute inset-0 -translate-x-full bg-disabled shimmer"></div>
              </div>
            </div>
            <div className="h-10 w-32 bg-card rounded-sm animate-pulse relative">
              <div className="absolute inset-0 -translate-x-full bg-disabled shimmer"></div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-background rounded-2xl p-6 shadow-sm border border-border backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-4 w-20 bg-card rounded animate-pulse relative">
                    <div className="absolute inset-0 -translate-x-full bg-disabled shimmer"></div>
                  </div>
                  <div className="h-6 w-6 bg-card rounded animate-pulse relative">
                    <div className="absolute inset-0 -translate-x-full bg-disabled shimmer"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-8 w-16 bg-card rounded animate-pulse relative">
                    <div className="absolute inset-0 -translate-x-full bg-disabled shimmer"></div>
                  </div>
                  <div className="h-3 w-24 bg-card rounded animate-pulse relative">
                    <div className="absolute inset-0 -translate-x-full bg-disabled shimmer"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-background rounded-2xl p-6 shadow-sm border border-border backdrop-blur-sm">
                <div className="flex justify-between items-center mb-6">
                  <div className="h-5 w-32 bg-card rounded animate-pulse relative">
                    <div className="absolute inset-0 -translate-x-full bg-disabled shimmer"></div>
                  </div>
                  <div className="h-8 w-24 bg-card rounded-sm animate-pulse relative">
                    <div className="absolute inset-0 -translate-x-full bg-disabled shimmer"></div>
                  </div>
                </div>
                <div className="h-64 bg-card rounded-sm animate-pulse relative">
                  <div className="absolute inset-0 -translate-x-full bg-disabled shimmer"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
