'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Badge, Heading, Text, CalendarIcon, ClockIcon } from '@/components/atoms';
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
    <div className="luxury-event-card group">
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
          <div className="w-full h-full bg-gradient-to-br from-luxury-charcoal to-luxury-charcoal-light flex items-center justify-center">
            <div className="text-center">
              <Heading level={3} variant="great-vibes" className="text-luxury-copper/50">
                The Backroom
              </Heading>
            </div>
          </div>
        )}
        {isSoldOut && (
          <div className="absolute inset-0 bg-luxury-charcoal/80 flex items-center justify-center">
            <Badge variant="danger" size="md" className="text-2xl px-6 py-2 bg-luxury-copper text-luxury-charcoal">
              Sold Out
            </Badge>
          </div>
        )}
        
        {/* Availability Indicator */}
        {!isSoldOut && showBookingCTA && (
          <div className="absolute top-4 left-4">
            {isLowAvailability ? (
              <Badge variant="warning" size="sm" className="backdrop-blur-sm bg-luxury-copper-dark/90 text-luxury-champagne">
                Only {tablesRemaining} left
              </Badge>
            ) : (
              <Badge variant="success" size="sm" className="backdrop-blur-sm bg-luxury-copper/90 text-luxury-charcoal">
                {tablesRemaining} tables available
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Event Details */}
      <div className="p-8 space-y-4">
        {/* Event Category Badge */}
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-luxury-copper text-luxury-charcoal text-xs font-semibold uppercase tracking-wider rounded">
            {eventType?.replace('_', ' ') || 'Exclusive Event'}
          </span>
        </div>
        
        {/* Title and Pricing */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="flex-1 font-futura text-xl text-luxury-ivory font-normal uppercase tracking-wider">
            {title}
          </h3>
          {!isSoldOut && (
            <div className="flex flex-col gap-1 text-right">
              <Badge variant="success" size="sm" className="bg-luxury-copper/20 text-luxury-copper border border-luxury-copper/30">
                Available
              </Badge>
              {showBookingCTA && (
                <Text variant="caption" className="text-luxury-copper font-medium">
                  From £{pricing.min}
                </Text>
              )}
            </div>
          )}
        </div>

        {/* Date and Time */}
        <div className="flex justify-between items-center py-3 border-b border-luxury-copper/20">
          <div className="flex items-center gap-2 text-luxury-smoke">
            <CalendarIcon size="sm" className="text-luxury-copper" />
            <Text variant="caption" className="font-raleway">{formattedDate}</Text>
          </div>
          <div className="flex items-center gap-2 text-luxury-copper">
            <ClockIcon size="sm" />
            <Text variant="caption" className="font-medium">{formattedTime}</Text>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-luxury-smoke-light font-crimson italic leading-relaxed line-clamp-3">
            {description}
          </p>
        )}

        {/* Artists */}
        {artists.length > 0 && (
          <div className="space-y-3">
            <Text variant="caption" className="text-luxury-copper font-futura uppercase tracking-wide">
              Featuring:
            </Text>
            <div className="flex flex-wrap gap-2">
              {artists.map((artist) => (
                <Badge key={artist} variant="default" size="sm" className="bg-luxury-charcoal-light/60 text-luxury-champagne border border-luxury-copper/30">
                  {artist}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-6 space-y-3">
          {/* Table Booking Button */}
          {showBookingCTA && (
            <div className="space-y-3">
              {isSoldOut ? (
                <button className="w-full py-3 px-6 bg-luxury-charcoal-light/50 text-luxury-smoke border border-luxury-smoke/30 rounded font-medium uppercase tracking-wide cursor-not-allowed" disabled>
                  Tables Sold Out
                </button>
              ) : (
                <div className="flex gap-3">
                  <Link href={`/book/${id}`} className="flex-1">
                    <button className="luxury-cta-primary w-full py-3 px-6 rounded font-medium uppercase tracking-wide">
                      Book Table
                    </button>
                  </Link>
                  {ticketLink && (
                    <button 
                      onClick={() => window.open(ticketLink, '_blank')}
                      className="luxury-cta-secondary py-3 px-6 rounded font-medium uppercase tracking-wide"
                    >
                      Tickets
                    </button>
                  )}
                </div>
              )}
              
              {/* Booking Info */}
              {!isSoldOut && (
                <div className="text-center text-xs text-luxury-smoke font-raleway">
                  £50 deposit • {tablesRemaining} tables remaining
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};