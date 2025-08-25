/**
 * EventsGridSkeleton Component
 * 
 * Loading skeleton for the events grid while Server Components fetch data.
 * Follows the prohibition-era speakeasy design system.
 */

export const EventsGridSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Loading events">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="animate-pulse" role="status" aria-hidden="true">
          <div className="bg-speakeasy-burgundy/20 border border-speakeasy-gold/20 rounded-lg overflow-hidden">
            {/* Image skeleton */}
            <div className="h-64 bg-gradient-to-br from-speakeasy-burgundy/40 to-speakeasy-noir/40" />
            
            {/* Content skeleton */}
            <div className="p-6 space-y-4">
              {/* Title */}
              <div className="h-8 bg-speakeasy-gold/20 rounded w-3/4" />
              
              {/* Date and time */}
              <div className="flex gap-4">
                <div className="h-4 bg-speakeasy-champagne/20 rounded w-24" />
                <div className="h-4 bg-speakeasy-champagne/20 rounded w-20" />
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <div className="h-4 bg-speakeasy-champagne/20 rounded w-full" />
                <div className="h-4 bg-speakeasy-champagne/20 rounded w-5/6" />
                <div className="h-4 bg-speakeasy-champagne/20 rounded w-4/6" />
              </div>
              
              {/* Artists */}
              <div className="space-y-2">
                <div className="h-3 bg-speakeasy-gold/20 rounded w-16" />
                <div className="flex gap-2">
                  <div className="h-6 bg-speakeasy-champagne/20 rounded-full px-3 w-20" />
                  <div className="h-6 bg-speakeasy-champagne/20 rounded-full px-3 w-24" />
                </div>
              </div>
              
              {/* Button */}
              <div className="pt-2">
                <div className="h-10 bg-speakeasy-gold/20 rounded w-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Loading events...</span>
    </div>
  );
};