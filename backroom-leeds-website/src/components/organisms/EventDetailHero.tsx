'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/atoms';
import type { EventDetailHeroProps } from '@/types/components';

/**
 * EventDetailHero Component
 * 
 * Hero section for event detail pages with immersive imagery,
 * event information, and prominent booking call-to-action.
 * Implements prohibition-era design with Art Deco styling.
 */
export function EventDetailHero({
  event,
  eventDate,
  heroImage,
  soldOut = false,
  onBookingClick,
}: EventDetailHeroProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Format event date and time
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(eventDate);

  const formattedTime = `${event.start_time} - ${event.end_time}`;

  // Get day of week for styling
  const dayOfWeek = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
  }).format(eventDate);

  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        {heroImage ? (
          <div className="relative w-full h-full">
            <Image
              src={heroImage}
              alt={`${event.name} at The Backroom Leeds`}
              fill
              className={`object-cover transition-all duration-1000 ${
                imageLoaded ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
              }`}
              priority
              onLoad={() => setImageLoaded(true)}
              quality={90}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-luxury-noir/95 via-luxury-noir/70 to-luxury-noir/50" />
            <div className="absolute inset-0 bg-gradient-to-t from-luxury-noir/90 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-luxury-noir via-luxury-burgundy/20 to-luxury-noir" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-4xl">
          {/* Event Type Badge */}
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="px-4 py-2 bg-luxury-copper/20 border border-luxury-copper/40 rounded-full backdrop-blur-sm">
              <span className="text-luxury-copper font-futura text-sm tracking-widest uppercase">
                {dayOfWeek} Night Event
              </span>
            </div>
            {soldOut && (
              <div className="px-4 py-2 bg-red-600/20 border border-red-500/40 rounded-full backdrop-blur-sm">
                <span className="text-red-400 font-futura text-sm tracking-widest uppercase">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          {/* Event Name */}
          <h1 className="text-6xl md:text-8xl font-futura font-black text-luxury-champagne mb-6 tracking-wider leading-none">
            {event.name}
          </h1>

          {/* Event Date & Time */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-12 bg-luxury-copper" />
              <div>
                <div className="text-luxury-gold text-xl font-crimson font-semibold">
                  {formattedDate}
                </div>
                <div className="text-luxury-champagne/80 font-raleway">
                  {formattedTime}
                </div>
              </div>
            </div>
            
            <div className="hidden md:block w-px h-12 bg-luxury-copper/30 mx-6" />
            
            <div className="flex items-center gap-3">
              <svg 
                className="w-5 h-5 text-luxury-copper" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
              <div>
                <div className="text-luxury-champagne font-raleway font-medium">
                  The Backroom Leeds
                </div>
                <div className="text-luxury-smoke/80 text-sm">
                  Speakeasy • Leeds City Centre
                </div>
              </div>
            </div>
          </div>

          {/* Event Description */}
          <p className="text-luxury-champagne/90 text-lg md:text-xl font-crimson italic leading-relaxed mb-8 max-w-3xl">
            {event.description}
          </p>

          {/* Music Genres */}
          {event.music_genres && event.music_genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {event.music_genres.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 bg-luxury-noir/60 border border-luxury-copper/30 rounded-full text-luxury-champagne text-sm font-raleway backdrop-blur-sm"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {!soldOut ? (
              <Button
                onClick={onBookingClick}
                variant="gold"
                size="lg"
                className="px-8 py-4 text-lg font-medium min-w-[200px] luxury-cta-primary"
                artDeco
              >
                Book Table Now
              </Button>
            ) : (
              <Button
                disabled
                variant="ghost"
                size="lg"
                className="px-8 py-4 text-lg font-medium min-w-[200px] opacity-60 cursor-not-allowed"
              >
                Sold Out
              </Button>
            )}

            {event.ticket_url && (
              <Button
                href={event.ticket_url}
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg font-medium min-w-[200px] luxury-cta-secondary"
                artDeco
              >
                Entry Tickets
              </Button>
            )}

            <Button
              href="/contact"
              variant="ghost"
              size="lg"
              className="px-6 py-4 text-lg font-medium text-luxury-champagne/80 hover:text-luxury-champagne"
            >
              <svg 
                className="w-5 h-5 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              Group Bookings
            </Button>
          </div>

          {/* DJ Lineup Teaser */}
          {event.dj_lineup && event.dj_lineup.length > 0 && (
            <div className="mt-12 p-6 bg-luxury-noir/40 border border-luxury-copper/20 rounded-lg backdrop-blur-sm">
              <h3 className="text-luxury-copper font-futura text-lg mb-3 tracking-wide uppercase">
                Featured Artists
              </h3>
              <div className="flex flex-wrap gap-3">
                {event.dj_lineup.map((dj) => (
                  <span
                    key={dj}
                    className="text-luxury-champagne font-crimson text-lg"
                  >
                    {dj}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex flex-col items-center gap-2 text-luxury-champagne/60 hover:text-luxury-champagne transition-colors cursor-pointer">
          <span className="text-sm font-raleway tracking-wider uppercase">
            Explore Event
          </span>
          <svg 
            className="w-6 h-6 animate-bounce" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 14l-7 7m0 0l-7-7m7 7V3" 
            />
          </svg>
        </div>
      </div>
    </section>
  );
}