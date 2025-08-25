import { LoadingSpinner } from '@/components/atoms';

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-speakeasy-noir">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-speakeasy-gold/20 rounded-full flex items-center justify-center">
            <LoadingSpinner size="lg" className="text-speakeasy-gold" />
          </div>
          <div className="animate-pulse">
            <div className="h-6 bg-speakeasy-burgundy/30 rounded w-32 mx-auto mb-2"></div>
            <div className="h-4 bg-speakeasy-burgundy/20 rounded w-48 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}