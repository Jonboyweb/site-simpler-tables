'use client';

import { useState, useEffect } from 'react';
import { Text, Button, LoadingSpinner } from '@/components/atoms';
import { Card } from '@/components/molecules';

interface EventsListProps {
  onEventUpdate: () => void;
}

export function EventsList({ onEventUpdate }: EventsListProps) {
  return (
    <Card className="p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-4xl mb-4">🎉</div>
        <Text className="text-speakeasy-gold text-lg mb-2">
          Event Management Coming Soon
        </Text>
        <Text className="text-speakeasy-champagne/70 mb-6">
          Comprehensive event creation, editing, and management tools with artwork upload, 
          artist assignment, and ticket integration will be available here.
        </Text>
        
        <div className="space-y-3">
          <Text className="text-speakeasy-copper text-sm font-medium">Features will include:</Text>
          <ul className="text-speakeasy-champagne/60 text-sm space-y-1">
            <li>• Event creation and editing with image upload</li>
            <li>• Artist/DJ assignment and management</li>
            <li>• Recurring event scheduling</li>
            <li>• Fatsoma ticket link integration</li>
            <li>• Event capacity and booking tracking</li>
            <li>• Performance analytics and insights</li>
          </ul>
        </div>
        
        <div className="flex gap-3 justify-center mt-6">
          <Button variant="outline" href="/admin/events">
            Current Events Page
          </Button>
          <Button variant="ghost" href="/admin/artists">
            Manage Artists
          </Button>
        </div>
      </div>
    </Card>
  );
}