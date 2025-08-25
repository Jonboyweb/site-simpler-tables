import { LoadingSpinner } from '@/components/atoms';

export default function EventsLoading() {
  return (
    <div className="min-h-screen bg-speakeasy-noir">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="animate-pulse">
            <div className="h-16 bg-speakeasy-burgundy/30 rounded-lg w-80 mx-auto mb-4"></div>
            <div className="h-6 bg-speakeasy-burgundy/20 rounded w-96 mx-auto"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-speakeasy-burgundy/30 rounded-lg h-96"></div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center mt-8">
          <LoadingSpinner size="lg" className="text-speakeasy-gold" />
        </div>
      </div>
    </div>
  );
}