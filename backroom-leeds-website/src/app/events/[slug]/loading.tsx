import { MainLayout } from '@/components/templates';

/**
 * Event Detail Loading Page
 * 
 * Loading state for individual event pages with prohibition-era styling.
 * Provides skeleton loading animation while event data is being fetched.
 */
export default function EventDetailLoading() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-luxury-noir">
        {/* Hero Section Skeleton */}
        <section className="relative min-h-[80vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-luxury-noir via-luxury-burgundy/10 to-luxury-noir" />
          
          <div className="relative z-10 container mx-auto px-4 py-16">
            <div className="max-w-4xl">
              {/* Event Type Badge Skeleton */}
              <div className="mb-6">
                <div className="inline-block w-32 h-8 bg-luxury-copper/20 rounded-full animate-pulse" />
              </div>

              {/* Event Name Skeleton */}
              <div className="mb-6">
                <div className="w-80 h-20 bg-luxury-champagne/10 rounded-lg animate-pulse mb-4" />
                <div className="w-48 h-20 bg-luxury-champagne/10 rounded-lg animate-pulse" />
              </div>

              {/* Date & Location Skeleton */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-12 bg-luxury-copper/30 animate-pulse" />
                  <div>
                    <div className="w-48 h-6 bg-luxury-gold/20 rounded animate-pulse mb-2" />
                    <div className="w-32 h-4 bg-luxury-champagne/20 rounded animate-pulse" />
                  </div>
                </div>
                
                <div className="hidden md:block w-px h-12 bg-luxury-copper/30 mx-6" />
                
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-luxury-copper/30 rounded animate-pulse" />
                  <div>
                    <div className="w-40 h-5 bg-luxury-champagne/20 rounded animate-pulse mb-1" />
                    <div className="w-32 h-3 bg-luxury-smoke/20 rounded animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Description Skeleton */}
              <div className="mb-8 space-y-3">
                <div className="w-full h-4 bg-luxury-champagne/10 rounded animate-pulse" />
                <div className="w-4/5 h-4 bg-luxury-champagne/10 rounded animate-pulse" />
                <div className="w-3/5 h-4 bg-luxury-champagne/10 rounded animate-pulse" />
              </div>

              {/* Genres Skeleton */}
              <div className="flex flex-wrap gap-2 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-20 h-6 bg-luxury-noir/40 border border-luxury-copper/20 rounded-full animate-pulse"
                  />
                ))}
              </div>

              {/* Action Buttons Skeleton */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <div className="w-48 h-14 bg-luxury-gold/20 rounded animate-pulse" />
                <div className="w-40 h-14 bg-luxury-copper/20 rounded animate-pulse" />
                <div className="w-36 h-14 bg-luxury-champagne/10 rounded animate-pulse" />
              </div>

              {/* DJ Lineup Skeleton */}
              <div className="p-6 bg-luxury-noir/20 border border-luxury-copper/20 rounded-lg">
                <div className="w-32 h-5 bg-luxury-copper/20 rounded animate-pulse mb-3" />
                <div className="flex flex-wrap gap-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-32 h-6 bg-luxury-champagne/10 rounded animate-pulse"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Skeleton */}
        <div className="container mx-auto px-4 py-16 space-y-16">
          {/* Event Information Section Skeleton */}
          <section className="luxury-event-card p-8">
            <div className="text-center mb-8">
              <div className="w-64 h-10 bg-luxury-copper/20 rounded animate-pulse mx-auto mb-4" />
              <div className="w-96 h-5 bg-luxury-champagne/10 rounded animate-pulse mx-auto" />
            </div>

            {/* Tab Navigation Skeleton */}
            <div className="flex flex-wrap justify-center gap-2 mb-8 border-b border-luxury-copper/20 pb-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-24 h-12 bg-luxury-copper/20 rounded-lg animate-pulse"
                />
              ))}
            </div>

            {/* Content Area Skeleton */}
            <div className="min-h-[400px] grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="w-48 h-8 bg-luxury-copper/20 rounded animate-pulse" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-full h-4 bg-luxury-champagne/10 rounded animate-pulse"
                    />
                  ))}
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2"
                    >
                      <div className="w-2 h-2 bg-luxury-copper/20 rounded-full animate-pulse" />
                      <div className="w-48 h-4 bg-luxury-champagne/10 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="w-56 h-8 bg-luxury-copper/20 rounded animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="text-center p-4 bg-luxury-noir/30 rounded-lg"
                    >
                      <div className="w-20 h-8 bg-luxury-gold/20 rounded animate-pulse mx-auto mb-2" />
                      <div className="w-24 h-3 bg-luxury-champagne/10 rounded animate-pulse mx-auto" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Gallery Section Skeleton */}
          <section className="luxury-event-card p-8">
            <div className="text-center mb-8">
              <div className="w-48 h-10 bg-luxury-copper/20 rounded animate-pulse mx-auto mb-4" />
              <div className="w-80 h-5 bg-luxury-champagne/10 rounded animate-pulse mx-auto" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/3] bg-luxury-noir/30 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </section>

          {/* Booking Section Skeleton */}
          <section className="luxury-event-card p-8">
            <div className="text-center mb-8">
              <div className="w-56 h-10 bg-luxury-copper/20 rounded animate-pulse mx-auto mb-4" />
              <div className="w-96 h-5 bg-luxury-champagne/10 rounded animate-pulse mx-auto" />
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="w-32 h-6 bg-luxury-champagne/20 rounded animate-pulse" />
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-16 h-10 bg-luxury-noir/40 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="p-4 bg-luxury-noir/30 rounded-lg"
                    >
                      <div className="w-24 h-5 bg-luxury-champagne/20 rounded animate-pulse mb-2" />
                      <div className="w-48 h-3 bg-luxury-champagne/10 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="w-40 h-6 bg-luxury-champagne/20 rounded animate-pulse" />
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="p-6 bg-luxury-noir/30 border border-luxury-copper/20 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="w-48 h-6 bg-luxury-champagne/20 rounded animate-pulse mb-2" />
                          <div className="w-32 h-4 bg-luxury-champagne/10 rounded animate-pulse" />
                        </div>
                        <div className="text-right">
                          <div className="w-16 h-8 bg-luxury-gold/20 rounded animate-pulse mb-1" />
                          <div className="w-12 h-3 bg-luxury-champagne/10 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        {[1, 2, 3].map((j) => (
                          <div
                            key={j}
                            className="flex items-center gap-2"
                          >
                            <div className="w-4 h-4 bg-luxury-copper/20 rounded animate-pulse" />
                            <div className="w-40 h-4 bg-luxury-champagne/10 rounded animate-pulse" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}