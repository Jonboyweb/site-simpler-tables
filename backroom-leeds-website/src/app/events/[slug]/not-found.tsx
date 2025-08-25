import Link from 'next/link';
import { MainLayout } from '@/components/templates';
import { Button } from '@/components/atoms';

/**
 * Event Not Found Page
 * 
 * Custom 404 page for invalid event slugs with prohibition-era styling
 * and helpful navigation back to the main events listing.
 */
export default function EventNotFound() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-luxury-noir flex items-center justify-center">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            {/* Art Deco 404 Design */}
            <div className="relative mb-8">
              <div className="text-[200px] font-futura font-black text-luxury-copper/20 leading-none select-none">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 border-4 border-luxury-copper/40 rounded-full flex items-center justify-center">
                  <svg 
                    className="w-12 h-12 text-luxury-copper" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Error Message */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-futura font-black text-luxury-champagne mb-4 tracking-wider">
                EVENT NOT FOUND
              </h1>
              <p className="text-luxury-champagne/80 text-lg font-crimson italic mb-6 leading-relaxed">
                The speakeasy event you&apos;re looking for seems to have vanished into the prohibition era. 
                Perhaps it was never scheduled, or it&apos;s hidden deeper in our archives.
              </p>
              <p className="text-luxury-smoke/80 font-raleway">
                Don&apos;t worry - our current events are waiting to be discovered.
              </p>
            </div>

            {/* Navigation Options */}
            <div className="space-y-4 mb-12">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  href="/events"
                  variant="gold"
                  size="lg"
                  className="px-8 py-4 text-lg font-medium luxury-cta-primary"
                  artDeco
                >
                  View All Events
                </Button>
                <Button
                  href="/"
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 text-lg font-medium luxury-cta-secondary"
                  artDeco
                >
                  Back to Home
                </Button>
              </div>
              
              <div className="flex justify-center">
                <Button
                  href="/contact"
                  variant="ghost"
                  size="md"
                  className="text-luxury-copper hover:text-luxury-gold"
                >
                  Contact Us for Help
                </Button>
              </div>
            </div>

            {/* Current Events Teaser */}
            <div className="luxury-event-card p-8">
              <h2 className="text-2xl font-futura text-luxury-copper mb-6 tracking-wide">
                CURRENT EVENTS
              </h2>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <Link 
                  href="/events/la-fiesta"
                  className="group p-4 bg-luxury-noir/30 border border-luxury-copper/20 hover:border-luxury-copper/40 rounded-lg transition-all duration-300 hover:bg-luxury-copper/5"
                >
                  <h3 className="text-luxury-champagne font-futura text-lg mb-2 group-hover:text-luxury-copper transition-colors">
                    LA FIESTA
                  </h3>
                  <p className="text-luxury-champagne/60 text-sm font-crimson italic mb-2">
                    Latin nights every Friday
                  </p>
                  <p className="text-luxury-gold text-xs font-raleway">
                    Reggaeton • Latin House • Salsa
                  </p>
                </Link>

                <Link 
                  href="/events/shhh"
                  className="group p-4 bg-luxury-noir/30 border border-luxury-copper/20 hover:border-luxury-copper/40 rounded-lg transition-all duration-300 hover:bg-luxury-copper/5"
                >
                  <h3 className="text-luxury-champagne font-futura text-lg mb-2 group-hover:text-luxury-copper transition-colors">
                    SHHH!
                  </h3>
                  <p className="text-luxury-champagne/60 text-sm font-crimson italic mb-2">
                    Underground beats every Saturday
                  </p>
                  <p className="text-luxury-gold text-xs font-raleway">
                    Deep House • Tech House • Progressive
                  </p>
                </Link>

                <Link 
                  href="/events/nostalgia"
                  className="group p-4 bg-luxury-noir/30 border border-luxury-copper/20 hover:border-luxury-copper/40 rounded-lg transition-all duration-300 hover:bg-luxury-copper/5"
                >
                  <h3 className="text-luxury-champagne font-futura text-lg mb-2 group-hover:text-luxury-copper transition-colors">
                    NOSTALGIA
                  </h3>
                  <p className="text-luxury-champagne/60 text-sm font-crimson italic mb-2">
                    Classic hits every Sunday
                  </p>
                  <p className="text-luxury-gold text-xs font-raleway">
                    80s • 90s • 2000s • Classic Hits
                  </p>
                </Link>
              </div>
            </div>

            {/* Additional Help */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-luxury-copper/10 rounded-lg">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <span className="text-luxury-champagne/80 text-sm font-raleway">
                  Looking for a specific event? Our team can help you find what you&apos;re looking for.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}