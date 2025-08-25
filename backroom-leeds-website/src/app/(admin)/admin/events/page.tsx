import type { Metadata } from 'next';
import { Heading, Text, Button } from '@/components/atoms';

export const metadata: Metadata = {
  title: 'Events Management | The Backroom Leeds Admin',
  description: 'Manage venue events, DJs, and entertainment schedule',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminEventsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Heading level={1} className="text-4xl font-bebas text-speakeasy-gold mb-2">
            Events Management
          </Heading>
          <Text className="text-speakeasy-champagne/80">
            Manage events, upload artwork, and schedule DJ performances
          </Text>
        </div>
        <div className="flex gap-3">
          <Button variant="primary">
            Create Event
          </Button>
          <Button variant="secondary">
            Manage DJs
          </Button>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-speakeasy-burgundy/20 rounded-lg border border-speakeasy-gold/20">
        <div className="p-6 border-b border-speakeasy-gold/20">
          <Heading level={2} className="text-xl font-bebas text-speakeasy-gold">
            Upcoming Events
          </Heading>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Sample events */}
          {[
            { name: 'LA FIESTA', date: '2025-01-31', time: '22:00', dj: 'DJ Rodriguez', bookings: 15, artwork: true },
            { name: 'SHHH!', date: '2025-02-01', time: '21:00', dj: 'Luna Beats', bookings: 12, artwork: true },
            { name: 'NOSTALGIA', date: '2025-02-02', time: '20:30', dj: 'Vintage Vibes', bookings: 8, artwork: false },
          ].map((event, i) => (
            <div key={i} className="bg-speakeasy-noir/30 rounded-lg p-4 border border-speakeasy-gold/10">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                    event.artwork ? 'bg-speakeasy-gold/20' : 'bg-speakeasy-burgundy/30'
                  }`}>
                    {event.artwork ? (
                      <span className="text-speakeasy-gold text-xs">IMG</span>
                    ) : (
                      <span className="text-speakeasy-champagne/50 text-xs">No Image</span>
                    )}
                  </div>
                  <div>
                    <Heading level={3} className="text-lg font-bebas text-speakeasy-gold">
                      {event.name}
                    </Heading>
                    <Text className="text-speakeasy-champagne/80 text-sm">
                      {new Date(event.date).toLocaleDateString('en-GB')} at {event.time}
                    </Text>
                    <Text className="text-speakeasy-champagne/60 text-sm">
                      DJ: {event.dj}
                    </Text>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <Text className="text-speakeasy-gold font-bebas text-lg">{event.bookings}</Text>
                    <Text className="text-speakeasy-champagne/70 text-xs">Bookings</Text>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-speakeasy-gold/20 text-speakeasy-gold rounded text-sm hover:bg-speakeasy-gold/30 transition-colors" disabled>
                      Edit
                    </button>
                    <button className="px-3 py-1 bg-speakeasy-copper/20 text-speakeasy-copper rounded text-sm hover:bg-speakeasy-copper/30 transition-colors" disabled>
                      Upload Artwork
                    </button>
                    <button className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30 transition-colors" disabled>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Event Creation Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
          <Heading level={2} className="text-xl font-bebas text-speakeasy-gold mb-4">
            Create New Event
          </Heading>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
                Event Name
              </label>
              <input
                type="text"
                placeholder="e.g., LA FIESTA"
                className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
                disabled
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
                DJ/Artist
              </label>
              <select
                className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold"
                disabled
              >
                <option>Select DJ/Artist</option>
                <option>DJ Rodriguez</option>
                <option>Luna Beats</option>
                <option>Vintage Vibes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-speakeasy-champagne mb-2">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Event description..."
                className="w-full px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/20 rounded text-speakeasy-champagne focus:outline-none focus:border-speakeasy-gold resize-none"
                disabled
              />
            </div>

            <Button variant="primary" size="sm" className="w-full" disabled>
              Create Event
            </Button>
          </div>
        </div>

        <div className="bg-speakeasy-burgundy/20 rounded-lg p-6 border border-speakeasy-gold/20">
          <Heading level={2} className="text-xl font-bebas text-speakeasy-gold mb-4">
            Artwork Upload
          </Heading>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-speakeasy-gold/20 rounded-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-speakeasy-gold/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-speakeasy-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <Text className="text-speakeasy-champagne mb-2">
                Drag and drop artwork here
              </Text>
              <Text className="text-speakeasy-champagne/70 text-sm mb-4">
                JPEG or PNG, max 5MB
              </Text>
              <Button variant="secondary" size="sm" disabled>
                Choose File
              </Button>
            </div>

            <div className="bg-speakeasy-noir/30 rounded p-4">
              <Text className="text-speakeasy-champagne/80 text-sm mb-2">
                <strong>Upload Requirements:</strong>
              </Text>
              <ul className="text-speakeasy-champagne/70 text-sm space-y-1">
                <li>• Format: JPEG or PNG only</li>
                <li>• Size: Maximum 5MB</li>
                <li>• Recommended: 1080x1080px</li>
                <li>• Minimum: 800x800px</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* DJ/Artist Management */}
      <div className="bg-speakeasy-burgundy/20 rounded-lg border border-speakeasy-gold/20">
        <div className="p-6 border-b border-speakeasy-gold/20">
          <Heading level={2} className="text-xl font-bebas text-speakeasy-gold">
            DJ/Artist Roster
          </Heading>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'DJ Rodriguez', genre: 'Latin House', events: 15, rating: 4.9 },
              { name: 'Luna Beats', genre: 'Deep House', events: 12, rating: 4.8 },
              { name: 'Vintage Vibes', genre: 'Classic Hits', events: 8, rating: 4.7 },
            ].map((dj, i) => (
              <div key={i} className="bg-speakeasy-noir/30 rounded-lg p-4 border border-speakeasy-gold/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-speakeasy-gold/20 rounded-full flex items-center justify-center">
                    <span className="text-speakeasy-gold font-bebas text-sm">
                      {dj.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <Text className="text-speakeasy-champagne font-medium">{dj.name}</Text>
                    <Text className="text-speakeasy-champagne/70 text-xs">{dj.genre}</Text>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <Text className="text-speakeasy-gold font-bebas">{dj.events}</Text>
                    <Text className="text-speakeasy-champagne/70 text-xs">Events</Text>
                  </div>
                  <div>
                    <Text className="text-speakeasy-gold font-bebas">{dj.rating}</Text>
                    <Text className="text-speakeasy-champagne/70 text-xs">Rating</Text>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-speakeasy-gold/10">
                  <Button variant="ghost" size="xs" className="w-full" disabled>
                    Edit Profile
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Development Notice */}
      <div className="bg-speakeasy-burgundy/10 border border-speakeasy-gold/20 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-speakeasy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-speakeasy-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <Heading level={3} className="text-lg font-bebas text-speakeasy-gold mb-2">
              Development Status
            </Heading>
            <Text className="text-speakeasy-champagne/80 text-sm leading-relaxed">
              Events management system is in development. Features will include:
              event CRUD operations, artwork upload with image processing, DJ/artist profile management,
              and integration with ticket sales platforms. File upload size limits will be enforced.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}