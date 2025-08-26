'use client';

import { Text, Button } from '@/components/atoms';
import { Card } from '@/components/molecules';

export function EventAnalytics() {
  return (
    <Card className="p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-4xl mb-4">📊</div>
        <Text className="text-speakeasy-gold text-lg mb-2">
          Event Analytics Coming Soon
        </Text>
        <Text className="text-speakeasy-champagne/70 mb-6">
          Comprehensive event performance analytics, booking conversion rates, 
          and attendance insights will be available here.
        </Text>
        
        <div className="space-y-3">
          <Text className="text-speakeasy-copper text-sm font-medium">Features will include:</Text>
          <ul className="text-speakeasy-champagne/60 text-sm space-y-1">
            <li>• Event performance metrics</li>
            <li>• Booking conversion rates</li>
            <li>• Attendance vs capacity analysis</li>
            <li>• Revenue per event tracking</li>
            <li>• Popular event comparisons</li>
            <li>• Seasonal trend analysis</li>
          </ul>
        </div>
        
        <Button variant="outline" className="mt-6" href="/admin/reports">
          View Reports Section
        </Button>
      </div>
    </Card>
  );
}