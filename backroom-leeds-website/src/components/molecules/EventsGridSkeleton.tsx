/**
 * EventsGridSkeleton Component
 * 
 * Loading skeleton for the events grid while Server Components fetch data.
 * Follows the luxury underground sanctuary design system.
 */

export const EventsGridSkeleton = () => {
  return (
    <div className="luxury-events-grid" aria-label="Loading events">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="animate-pulse loading-shimmer" role="status" aria-hidden="true">
          <div className="luxury-event-card">
            {/* Image skeleton */}
            <div className="h-64 bg-gradient-to-br from-luxury-charcoal/40 to-luxury-charcoal-light/40" />
            
            {/* Content skeleton */}
            <div className="p-8 space-y-4">
              {/* Category badge */}
              <div className="h-5 bg-luxury-copper/20 rounded w-20" />
              
              {/* Title */}
              <div className="h-8 bg-luxury-copper/20 rounded w-3/4" />
              
              {/* Date and time */}
              <div className="flex justify-between border-b border-luxury-copper/10 pb-3">
                <div className="h-4 bg-luxury-smoke/20 rounded w-32" />
                <div className="h-4 bg-luxury-copper/20 rounded w-16" />
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <div className="h-4 bg-luxury-smoke-light/20 rounded w-full" />
                <div className="h-4 bg-luxury-smoke-light/20 rounded w-5/6" />
                <div className="h-4 bg-luxury-smoke-light/20 rounded w-4/6" />
              </div>
              
              {/* Artists */}
              <div className="space-y-2">
                <div className="h-3 bg-luxury-copper/20 rounded w-20" />
                <div className="flex gap-2">
                  <div className="h-6 bg-luxury-charcoal-light/30 rounded px-3 w-20" />
                  <div className="h-6 bg-luxury-charcoal-light/30 rounded px-3 w-24" />
                </div>
              </div>
              
              {/* Buttons */}
              <div className="pt-6">
                <div className="flex gap-3">
                  <div className="h-12 bg-luxury-copper/20 rounded flex-1" />
                  <div className="h-12 bg-luxury-copper/10 border border-luxury-copper/20 rounded w-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Loading events...</span>
    </div>
  );
};