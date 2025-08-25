import { LoadingSpinner } from '@/components/atoms';

export default function AboutLoading() {
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

          <div className="space-y-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className={`space-y-4 ${i % 2 === 1 ? 'md:order-2' : ''}`}>
                    <div className="h-8 bg-speakeasy-burgundy/30 rounded w-48"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-speakeasy-burgundy/20 rounded w-full"></div>
                      <div className="h-4 bg-speakeasy-burgundy/20 rounded w-5/6"></div>
                      <div className="h-4 bg-speakeasy-burgundy/20 rounded w-4/5"></div>
                    </div>
                  </div>
                  <div className={`${i % 2 === 1 ? 'md:order-1' : ''}`}>
                    <div className="bg-speakeasy-burgundy/20 rounded-lg h-48 border border-speakeasy-gold/20"></div>
                  </div>
                </div>
              </div>
            ))}

            <div className="animate-pulse">
              <div className="text-center bg-speakeasy-burgundy/10 rounded-lg p-12 border border-speakeasy-gold/20">
                <div className="h-8 bg-speakeasy-burgundy/30 rounded w-64 mx-auto mb-4"></div>
                <div className="h-4 bg-speakeasy-burgundy/20 rounded w-96 mx-auto mb-8"></div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <div className="h-12 bg-speakeasy-burgundy/30 rounded w-40"></div>
                  <div className="h-12 bg-speakeasy-burgundy/20 rounded w-32"></div>
                </div>
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