import { LoadingSpinner } from '@/components/atoms';

export default function ContactLoading() {
  return (
    <div className="min-h-screen bg-speakeasy-noir">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="animate-pulse">
              <div className="h-16 bg-speakeasy-burgundy/30 rounded-lg w-64 mx-auto mb-6"></div>
              <div className="h-6 bg-speakeasy-burgundy/20 rounded w-96 mx-auto"></div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Contact Details Skeleton */}
            <div className="space-y-8 animate-pulse">
              <div>
                <div className="h-8 bg-speakeasy-burgundy/30 rounded w-48 mb-6"></div>
                
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-speakeasy-burgundy/20 flex-shrink-0"></div>
                      <div className="space-y-2">
                        <div className="h-5 bg-speakeasy-burgundy/30 rounded w-20"></div>
                        <div className="h-4 bg-speakeasy-burgundy/20 rounded w-32"></div>
                        <div className="h-4 bg-speakeasy-burgundy/20 rounded w-28"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Opening Hours Skeleton */}
            <div className="bg-speakeasy-burgundy/10 rounded-lg p-8 border border-speakeasy-gold/20 animate-pulse">
              <div className="h-8 bg-speakeasy-burgundy/30 rounded w-48 mb-6"></div>
              
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-speakeasy-gold/10">
                    <div className="h-4 bg-speakeasy-burgundy/20 rounded w-24"></div>
                    <div className="h-4 bg-speakeasy-burgundy/30 rounded w-32"></div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-speakeasy-burgundy/20 rounded border border-speakeasy-gold/20">
                <div className="h-4 bg-speakeasy-burgundy/20 rounded w-full mb-2"></div>
                <div className="h-4 bg-speakeasy-burgundy/20 rounded w-5/6"></div>
              </div>
            </div>
          </div>

          {/* Quick Actions Skeleton */}
          <div className="grid md:grid-cols-2 gap-8 mb-12 animate-pulse">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-speakeasy-burgundy/20 rounded-lg p-8 border border-speakeasy-gold/20 text-center">
                <div className="h-6 bg-speakeasy-burgundy/30 rounded w-32 mx-auto mb-4"></div>
                <div className="space-y-2 mb-6">
                  <div className="h-4 bg-speakeasy-burgundy/20 rounded w-full"></div>
                  <div className="h-4 bg-speakeasy-burgundy/20 rounded w-4/5 mx-auto"></div>
                </div>
                <div className="h-12 bg-speakeasy-burgundy/30 rounded w-full"></div>
              </div>
            ))}
          </div>

          {/* Map Skeleton */}
          <div className="bg-speakeasy-burgundy/10 rounded-lg p-8 border border-speakeasy-gold/20 animate-pulse">
            <div className="h-6 bg-speakeasy-burgundy/30 rounded w-48 mx-auto mb-4"></div>
            <div className="bg-speakeasy-burgundy/20 rounded h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="h-4 bg-speakeasy-burgundy/30 rounded w-32 mx-auto mb-2"></div>
                <div className="h-4 bg-speakeasy-burgundy/20 rounded w-40 mx-auto"></div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mt-8">
            <LoadingSpinner size="lg" className="text-speakeasy-gold" />
          </div>
        </div>
      </div>
    </div>
  );
}