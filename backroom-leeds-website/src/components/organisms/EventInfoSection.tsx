'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/atoms';
import type { EventInfoSectionProps, DJProfile, TableAvailabilityInfo } from '@/types/components';

/**
 * EventInfoSection Component
 * 
 * Comprehensive event information section with DJ profiles,
 * table availability, and detailed event specifics.
 */
export function EventInfoSection({
  event,
  eventDate,
  djProfiles = [],
  tableAvailability = [],
}: EventInfoSectionProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'djs' | 'tables' | 'practical'>('overview');

  const availableTables = tableAvailability.filter(table => table.available).length;
  const totalTables = tableAvailability.length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏛️' },
    { id: 'djs', label: 'Artists', icon: '🎧' },
    { id: 'tables', label: 'Tables', icon: '🪑' },
    { id: 'practical', label: 'Info', icon: '📍' },
  ] as const;

  return (
    <section className="luxury-event-card p-8">
      {/* Section Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-futura text-luxury-copper mb-4 tracking-wide">
          EVENT DETAILS
        </h2>
        <p className="text-luxury-champagne/80 font-crimson italic text-lg max-w-2xl mx-auto">
          Everything you need to know for an unforgettable evening at Leeds&apos; premier speakeasy
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 border-b border-luxury-copper/20 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-lg font-futura tracking-wide transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-luxury-copper text-luxury-noir'
                : 'text-luxury-champagne/80 hover:text-luxury-champagne hover:bg-luxury-copper/10'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-futura text-luxury-copper mb-4 tracking-wide">
                  EXPERIENCE
                </h3>
                <div className="prose prose-lg prose-invert max-w-none">
                  <p className="text-luxury-champagne/90 font-crimson leading-relaxed">
                    {event.description}
                  </p>
                  
                  {/* Event Highlights */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 text-luxury-champagne/80">
                      <div className="w-2 h-2 bg-luxury-copper rounded-full" />
                      <span className="font-raleway">Authentic speakeasy atmosphere</span>
                    </div>
                    <div className="flex items-center gap-3 text-luxury-champagne/80">
                      <div className="w-2 h-2 bg-luxury-copper rounded-full" />
                      <span className="font-raleway">Premium sound system</span>
                    </div>
                    <div className="flex items-center gap-3 text-luxury-champagne/80">
                      <div className="w-2 h-2 bg-luxury-copper rounded-full" />
                      <span className="font-raleway">Expert mixology & craft cocktails</span>
                    </div>
                    <div className="flex items-center gap-3 text-luxury-champagne/80">
                      <div className="w-2 h-2 bg-luxury-copper rounded-full" />
                      <span className="font-raleway">Exclusive VIP table service</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-futura text-luxury-copper mb-4 tracking-wide">
                  MUSIC & ATMOSPHERE
                </h3>
                
                {/* Music Genres */}
                {event.music_genres && (
                  <div className="mb-6">
                    <h4 className="text-luxury-champagne font-raleway font-medium mb-3">
                      Music Styles
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {event.music_genres.map((genre) => (
                        <span
                          key={genre}
                          className="px-3 py-1 bg-luxury-noir/40 border border-luxury-copper/30 rounded-full text-luxury-champagne text-sm font-raleway"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Event Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-luxury-noir/30 rounded-lg">
                    <div className="text-2xl font-futura text-luxury-gold mb-1">
                      {event.start_time} - {event.end_time}
                    </div>
                    <div className="text-luxury-champagne/80 text-sm font-raleway">
                      Event Duration
                    </div>
                  </div>
                  <div className="text-center p-4 bg-luxury-noir/30 rounded-lg">
                    <div className="text-2xl font-futura text-luxury-gold mb-1">
                      {availableTables}/{totalTables}
                    </div>
                    <div className="text-luxury-champagne/80 text-sm font-raleway">
                      Tables Available
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DJs Tab */}
        {activeTab === 'djs' && (
          <div>
            <h3 className="text-2xl font-futura text-luxury-copper mb-6 tracking-wide">
              FEATURED ARTISTS
            </h3>
            
            {djProfiles.length > 0 ? (
              <div className="space-y-8">
                {djProfiles.map((dj) => (
                  <div key={dj.id} className="flex flex-col md:flex-row gap-6 p-6 bg-luxury-noir/30 rounded-lg">
                    {/* DJ Image */}
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 relative rounded-lg overflow-hidden">
                        {dj.imageUrl ? (
                          <Image
                            src={dj.imageUrl}
                            alt={dj.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-luxury-copper/20 flex items-center justify-center">
                            <svg className="w-12 h-12 text-luxury-copper/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DJ Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-xl font-futura text-luxury-champagne mb-1">
                            {dj.name}
                            {dj.isHeadliner && (
                              <span className="ml-3 px-2 py-1 bg-luxury-gold/20 text-luxury-gold text-xs font-raleway rounded uppercase tracking-wider">
                                Headliner
                              </span>
                            )}
                          </h4>
                          {dj.setTime && (
                            <div className="text-luxury-copper font-raleway text-sm">
                              {dj.setTime}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* DJ Bio */}
                      {dj.bio && (
                        <p className="text-luxury-champagne/80 font-crimson italic mb-4">
                          {dj.bio}
                        </p>
                      )}

                      {/* Genres */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {dj.genres.map((genre) => (
                          <span
                            key={genre}
                            className="px-2 py-1 bg-luxury-copper/20 text-luxury-copper text-xs font-raleway rounded"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>

                      {/* Social Links */}
                      <div className="flex gap-3">
                        {dj.instagramUrl && (
                          <a
                            href={dj.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-luxury-champagne/60 hover:text-luxury-copper transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.621 5.367 11.987 11.988 11.987c6.62 0 11.987-5.366 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM15.707 14.758c-.002-.003-.02-.022-.02-.022-.72.72-1.655 1.072-2.707 1.072s-1.987-.352-2.707-1.072c-.02 0-.018.019-.02.022-.002.002-.02 0-.02 0-.721-.721-1.072-1.655-1.072-2.707s.351-1.986 1.072-2.707c.002-.002.018-.02.02-.02.002-.003.02-.022.02-.022.72-.72 1.655-1.072 2.707-1.072s1.987.352 2.707 1.072c.02 0 .018.019.02.022.002.002.018.018.02.02.721.721 1.072 1.655 1.072 2.707s-.351 1.986-1.072 2.707z"/>
                            </svg>
                          </a>
                        )}
                        {dj.soundcloudUrl && (
                          <a
                            href={dj.soundcloudUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-luxury-champagne/60 hover:text-luxury-copper transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.255-2.154c-.009-.054-.049-.1-.099-.1zm1.283.384c-.058 0-.106.053-.113.112l-.184 1.77.184 1.722c.007.066.055.112.113.112.057 0 .104-.046.113-.112l.203-1.722-.203-1.77c-.009-.059-.056-.112-.113-.112z"/>
                            </svg>
                          </a>
                        )}
                        {dj.spotifyUrl && (
                          <a
                            href={dj.spotifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-luxury-champagne/60 hover:text-luxury-copper transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.599 0-.36.24-.66.54-.779 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.242 1.019zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-luxury-champagne/60">
                <p className="font-crimson italic">DJ lineup to be announced soon...</p>
              </div>
            )}
          </div>
        )}

        {/* Tables Tab */}
        {activeTab === 'tables' && (
          <div>
            <h3 className="text-2xl font-futura text-luxury-copper mb-6 tracking-wide">
              TABLE AVAILABILITY
            </h3>

            {tableAvailability.length > 0 ? (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {tableAvailability.map((table) => (
                    <div
                      key={table.tableNumber}
                      className={`p-6 rounded-lg border ${
                        table.available
                          ? 'bg-luxury-noir/30 border-luxury-copper/30'
                          : 'bg-luxury-noir/10 border-luxury-smoke/20 opacity-60'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-xl font-futura text-luxury-champagne">
                            Table {table.tableNumber}
                          </h4>
                          <p className="text-luxury-champagne/80 font-raleway capitalize">
                            {table.location} • {table.capacity} guests • {table.priceRange}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-raleway uppercase tracking-wider ${
                          table.available
                            ? 'bg-green-600/20 text-green-400'
                            : 'bg-red-600/20 text-red-400'
                        }`}>
                          {table.available ? 'Available' : 'Unavailable'}
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-2 mb-4">
                        {table.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2 text-sm text-luxury-champagne/70">
                            <svg className="w-4 h-4 text-luxury-copper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {feature}
                          </div>
                        ))}
                      </div>

                      {table.available && (
                        <Button
                          variant="copper"
                          size="sm"
                          className="w-full"
                          onClick={() => console.log(`Select table ${table.tableNumber}`)}
                        >
                          Select Table
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="text-center p-6 bg-luxury-copper/10 rounded-lg">
                  <p className="text-luxury-champagne/80 font-crimson italic mb-4">
                    Need a larger party size or have special requirements?
                  </p>
                  <Link 
                    href="/contact"
                    className="luxury-cta-secondary px-6 py-2 inline-block font-medium"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-luxury-champagne/60">
                <p className="font-crimson italic">Table information loading...</p>
              </div>
            )}
          </div>
        )}

        {/* Practical Info Tab */}
        {activeTab === 'practical' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-futura text-luxury-copper mb-4 tracking-wide">
                  VENUE INFO
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-luxury-copper mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <div>
                      <p className="text-luxury-champagne font-raleway font-medium">Location</p>
                      <p className="text-luxury-champagne/80 text-sm">
                        The Backroom Leeds<br />
                        Leeds City Centre<br />
                        LS1 Area (Exact address provided after booking)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-luxury-copper mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-luxury-champagne font-raleway font-medium">Entry Times</p>
                      <p className="text-luxury-champagne/80 text-sm">
                        Doors open: {event.start_time}<br />
                        Event ends: {event.end_time}<br />
                        Last entry: 02:00
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-luxury-copper mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <div>
                      <p className="text-luxury-champagne font-raleway font-medium">Age Requirement</p>
                      <p className="text-luxury-champagne/80 text-sm">
                        21+ event<br />
                        Valid ID required for entry<br />
                        No exceptions
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-futura text-luxury-copper mb-4 tracking-wide">
                  POLICIES
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-luxury-champagne font-raleway font-medium mb-2">
                      Dress Code
                    </h4>
                    <p className="text-luxury-champagne/80 text-sm">
                      Smart casual to smart dress code enforced. No sportswear, flip-flops, or overly casual attire.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-luxury-champagne font-raleway font-medium mb-2">
                      Booking Policy
                    </h4>
                    <p className="text-luxury-champagne/80 text-sm">
                      £50 deposit required per table. 48-hour cancellation policy. Maximum 2 tables per booking.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-luxury-champagne font-raleway font-medium mb-2">
                      What&apos;s Included
                    </h4>
                    <ul className="text-luxury-champagne/80 text-sm space-y-1">
                      <li>• Reserved table for your party</li>
                      <li>• Dedicated table service</li>
                      <li>• Access to full cocktail menu</li>
                      <li>• Premium sound experience</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="text-center p-6 bg-luxury-copper/10 rounded-lg">
              <h4 className="text-luxury-copper font-futura text-lg mb-3 tracking-wide">
                NEED MORE INFORMATION?
              </h4>
              <p className="text-luxury-champagne/80 font-crimson italic mb-4">
                Our team is here to help with any questions about your booking or special requirements.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link 
                  href="/contact"
                  className="luxury-cta-secondary px-6 py-2 font-medium"
                >
                  Contact Us
                </Link>
                <a 
                  href="tel:+44113000000"
                  className="luxury-cta-ghost px-6 py-2 font-medium"
                >
                  Call Us
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}