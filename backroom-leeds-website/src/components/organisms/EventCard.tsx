'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Card } from '@/components/molecules';
import { Button, Badge, Heading, Text, CalendarIcon, ClockIcon } from '@/components/atoms';
import type { EventCardProps } from '@/types/components';

interface EnhancedEventCardProps extends EventCardProps {
  availableTables?: number;
  showBookingCTA?: boolean;
  eventType?: 'LA_FIESTA' | 'SHHH' | 'NOSTALGIA';
}

export const EventCard = ({
  id,
  title,
  date,
  image,
  description,
  artists = [],
  ticketLink,
  soldOut = false,
  availableTables,
  showBookingCTA = true,
  eventType,
}: EnhancedEventCardProps) => {
  const [tablesRemaining] = useState<number>(availableTables || 16);

  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

  const formattedTime = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  // Get event-specific pricing info
  const getEventPricing = (type: string | undefined) => {
    switch (type) {
      case 'LA_FIESTA':
        return { min: 170, max: 580, recommended: 'premium' };
      case 'SHHH':
        return { min: 320, max: 580, recommended: 'vip' };
      case 'NOSTALGIA':
        return { min: 170, max: 320, recommended: 'basic' };
      default:
        return { min: 170, max: 580, recommended: 'premium' };
    }
  };

  const pricing = getEventPricing(eventType);
  const isLowAvailability = tablesRemaining <= 5;
  const isSoldOut = tablesRemaining === 0 || soldOut;

  return (
    <Card variant="elevated" hover padding="none" className="overflow-hidden group">
      {/* Event Image */}
      <div className="relative h-64 w-full overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-speakeasy-burgundy to-speakeasy-noir flex items-center justify-center">
            <div className="text-center">
              <Heading level={3} variant="great-vibes" className="text-speakeasy-gold/50">
                The Backroom
              </Heading>
            </div>
          </div>
        )}
        {isSoldOut && (
          <div className="absolute inset-0 bg-speakeasy-noir/80 flex items-center justify-center">
            <Badge variant="danger" size="md" className="text-2xl px-6 py-2">
              Sold Out
            </Badge>
          </div>
        )}
        
        {/* Availability Indicator */}
        {!isSoldOut && showBookingCTA && (
          <div className="absolute top-4 left-4">
            {isLowAvailability ? (
              <Badge variant="warning" size="sm" className="backdrop-blur-sm bg-speakeasy-copper/90">
                Only {tablesRemaining} left
              </Badge>
            ) : (
              <Badge variant="success" size="sm" className="backdrop-blur-sm bg-speakeasy-gold/90 text-speakeasy-noir">
                {tablesRemaining} tables available
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Event Details */}
      <div className="p-6 space-y-4">
        {/* Title and Badge */}
        <div className="flex items-start justify-between gap-4">
          <Heading level={4} variant="bebas" className="flex-1">
            {title}
          </Heading>
          {!isSoldOut && (
            <div className="flex flex-col gap-1 text-right">
              <Badge variant="success" size="sm">
                Available
              </Badge>
              {showBookingCTA && (
                <Text variant="caption" className="text-speakeasy-gold">
                  From £{pricing.min}
                </Text>
              )}
            </div>
          )}
        </div>

        {/* Date and Time */}
        <div className="flex flex-wrap gap-4 text-speakeasy-champagne/80">
          <div className="flex items-center gap-2">
            <CalendarIcon size="sm" />
            <Text variant="caption">{formattedDate}</Text>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon size="sm" />
            <Text variant="caption">{formattedTime}</Text>
          </div>
        </div>

        {/* Description */}
        {description && (
          <Text variant="body" className="line-clamp-3">
            {description}
          </Text>
        )}

        {/* Artists */}
        {artists.length > 0 && (
          <div className="space-y-2">
            <Text variant="caption" className="text-speakeasy-gold">
              Featuring:
            </Text>
            <div className="flex flex-wrap gap-2">
              {artists.map((artist) => (
                <Badge key={artist} variant="default" size="sm">
                  {artist}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 space-y-3">
          {/* Table Booking Button */}
          {showBookingCTA && (
            <div>
              {isSoldOut ? (
                <Button variant="ghost" fullWidth disabled>
                  Tables Sold Out
                </Button>
              ) : (
                <Link href={`/book/${id}`} className="block">
                  <Button
                    variant="gold"
                    fullWidth
                    className="group"
                  >
                    <span className="flex items-center justify-between w-full">
                      <span>Book Table</span>
                      <span className="text-sm font-normal text-speakeasy-noir/80">
                        From £{pricing.min}
                      </span>
                    </span>
                  </Button>
                </Link>
              )}
              
              {/* Quick info about booking */}
              {!isSoldOut && (
                <Text variant="caption" className="text-center mt-2 text-speakeasy-champagne/70 block">
                  £50 deposit • {tablesRemaining} tables left
                </Text>
              )}
            </div>
          )}
          
          {/* Ticket Button (if available) */}
          {ticketLink && (
            <div className="border-t border-speakeasy-gold/20 pt-3">
              <Button
                variant="copper"
                size="sm"
                fullWidth
                onClick={() => window.open(ticketLink, '_blank')}
                className="text-sm"
              >
                Get Entry Tickets
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};