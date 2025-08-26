'use client';

import { Text, Button } from '@/components/atoms';
import { Card } from '@/components/molecules';

export function EventCalendar() {
  return (
    <Card className="p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-4xl mb-4">📅</div>
        <Text className="text-speakeasy-gold text-lg mb-2">
          Event Calendar Coming Soon
        </Text>
        <Text className="text-speakeasy-champagne/70 mb-6">
          Interactive calendar view for event scheduling, conflict detection, 
          and visual event management will be available here.
        </Text>
        
        <div className="space-y-3">
          <Text className="text-speakeasy-copper text-sm font-medium">Features will include:</Text>
          <ul className="text-speakeasy-champagne/60 text-sm space-y-1">
            <li>• Month/week/day calendar views</li>
            <li>• Drag-and-drop event scheduling</li>
            <li>• Conflict detection and warnings</li>
            <li>• Event capacity visualization</li>
            <li>• Quick event creation and editing</li>
            <li>• Export calendar functionality</li>
          </ul>
        </div>
        
        <Button variant="outline" className="mt-6" href="/admin/events">
          View Current Events
        </Button>
      </div>
    </Card>
  );
}