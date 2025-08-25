'use client';

import Image from 'next/image';
import { Card } from '@/components/molecules';
import { Button, Badge, Heading, Text, CalendarIcon, ClockIcon } from '@/components/atoms';
import type { EventCardProps } from '@/types/components';

export const EventCard = ({
  title,
  date,
  image,
  description,
  artists = [],
  ticketLink,
  soldOut = false,
}: EventCardProps) => {
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
        {soldOut && (
          <div className="absolute inset-0 bg-speakeasy-noir/80 flex items-center justify-center">
            <Badge variant="danger" size="md" className="text-2xl px-6 py-2">
              Sold Out
            </Badge>
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
          {!soldOut && ticketLink && (
            <Badge variant="success" size="sm">
              Available
            </Badge>
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

        {/* Action Button */}
        {ticketLink && (
          <div className="pt-2">
            {soldOut ? (
              <Button variant="ghost" fullWidth disabled>
                Sold Out
              </Button>
            ) : (
              <Button
                variant="gold"
                fullWidth
                onClick={() => window.open(ticketLink, '_blank')}
              >
                Get Tickets
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};