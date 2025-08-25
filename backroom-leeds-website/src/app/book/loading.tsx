import { LoadingSpinner } from '@/components/atoms';

export default function BookingLoading() {
  return (
    <div className="min-h-screen bg-speakeasy-noir">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="animate-pulse">
              <div className="h-16 bg-speakeasy-burgundy/30 rounded-lg w-96 mx-auto mb-4"></div>
              <div className="h-6 bg-speakeasy-burgundy/20 rounded w-80 mx-auto mb-8"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
                    <div className="h-6 bg-speakeasy-burgundy/30 rounded w-32 mx-auto mb-2"></div>
                    <div className="h-4 bg-speakeasy-burgundy/20 rounded w-24 mx-auto"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="animate-pulse">
            <div className="bg-speakeasy-burgundy/30 rounded-lg h-96 max-w-2xl mx-auto"></div>
          </div>
          
          <div className="flex justify-center mt-8">
            <LoadingSpinner size="lg" className="text-speakeasy-gold" />
          </div>
        </div>
      </div>
    </div>
  );
}