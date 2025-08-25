import type { Metadata } from 'next';
import { MainLayout } from '@/components/templates';
import { Heading, Text, Button } from '@/components/atoms';

export const metadata: Metadata = {
  title: 'Contact Us | The Backroom Leeds',
  description: 'Get in touch with The Backroom Leeds. Find our location, contact details, and opening hours for Leeds\' premier speakeasy venue.',
  keywords: ['The Backroom Leeds contact', 'Leeds speakeasy location', 'contact nightclub Leeds', 'The Backroom phone'],
  openGraph: {
    title: 'Contact The Backroom Leeds',
    description: 'Find us beneath the railway bridges in Leeds city center',
    type: 'website',
  },
};

export default function ContactPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Heading level={1} className="text-5xl md:text-6xl font-bebas text-speakeasy-gold mb-6">
              Find Us
            </Heading>
            <Text className="text-xl text-speakeasy-champagne font-playfair leading-relaxed max-w-3xl mx-auto">
              Discover the entrance to Leeds' most exclusive speakeasy. 
              Hidden beneath the railway bridges, we await your arrival.
            </Text>
          </div>

          {/* Contact Information */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Contact Details */}
            <div className="space-y-8">
              <div>
                <Heading level={2} className="text-3xl font-bebas text-speakeasy-gold mb-6">
                  Contact Information
                </Heading>
                
                <div className="space-y-6">
                  {/* Address */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-speakeasy-burgundy/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-speakeasy-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bebas text-speakeasy-gold mb-1">Location</h3>
                      <Text className="text-speakeasy-champagne/90">
                        Beneath the Railway Bridges<br />
                        Leeds City Centre<br />
                        West Yorkshire, LS1
                      </Text>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-speakeasy-burgundy/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-speakeasy-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bebas text-speakeasy-gold mb-1">Email</h3>
                      <a 
                        href="mailto:info@backroomleeds.co.uk" 
                        className="text-speakeasy-champagne/90 hover:text-speakeasy-gold transition-colors"
                      >
                        info@backroomleeds.co.uk
                      </a>
                      <br />
                      <Text className="text-speakeasy-champagne/70 text-sm">
                        For bookings and general enquiries
                      </Text>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-speakeasy-burgundy/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-speakeasy-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bebas text-speakeasy-gold mb-1">Phone</h3>
                      <a 
                        href="tel:+441132345678" 
                        className="text-speakeasy-champagne/90 hover:text-speakeasy-gold transition-colors"
                      >
                        +44 113 234 5678
                      </a>
                      <br />
                      <Text className="text-speakeasy-champagne/70 text-sm">
                        Call for assistance or special requests
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="bg-speakeasy-burgundy/10 rounded-lg p-8 border border-speakeasy-gold/20">
              <Heading level={2} className="text-3xl font-bebas text-speakeasy-gold mb-6">
                Opening Hours
              </Heading>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-speakeasy-gold/10">
                  <span className="text-speakeasy-champagne">Monday - Tuesday</span>
                  <span className="text-speakeasy-gold font-bebas">Closed</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-speakeasy-gold/10">
                  <span className="text-speakeasy-champagne">Wednesday</span>
                  <span className="text-speakeasy-gold font-bebas">10:00 PM - 3:00 AM</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-speakeasy-gold/10">
                  <span className="text-speakeasy-champagne">Thursday</span>
                  <span className="text-speakeasy-gold font-bebas">10:00 PM - 3:00 AM</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-speakeasy-gold/10">
                  <span className="text-speakeasy-champagne">Friday</span>
                  <span className="text-speakeasy-gold font-bebas">10:00 PM - 4:00 AM</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-speakeasy-gold/10">
                  <span className="text-speakeasy-champagne">Saturday</span>
                  <span className="text-speakeasy-gold font-bebas">10:00 PM - 4:00 AM</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-speakeasy-champagne">Sunday</span>
                  <span className="text-speakeasy-gold font-bebas">Closed</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-speakeasy-burgundy/20 rounded border border-speakeasy-gold/20">
                <Text className="text-speakeasy-champagne/80 text-sm">
                  <strong className="text-speakeasy-gold">Note:</strong> Last entry is typically 1 hour before closing. 
                  Please arrive by your reserved time or contact us if running late.
                </Text>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-speakeasy-burgundy/20 rounded-lg p-8 border border-speakeasy-gold/20 text-center">
              <h3 className="text-2xl font-bebas text-speakeasy-gold mb-4">Ready to Visit?</h3>
              <Text className="text-speakeasy-champagne/90 mb-6">
                Reserve your table now and join us for an unforgettable evening in Leeds' most exclusive speakeasy.
              </Text>
              <Button href="/book" variant="primary" size="lg" className="w-full">
                Book a Table
              </Button>
            </div>

            <div className="bg-speakeasy-burgundy/20 rounded-lg p-8 border border-speakeasy-gold/20 text-center">
              <h3 className="text-2xl font-bebas text-speakeasy-gold mb-4">Upcoming Events</h3>
              <Text className="text-speakeasy-champagne/90 mb-6">
                Discover our weekly events featuring top DJs and exclusive performances.
              </Text>
              <Button href="/events" variant="secondary" size="lg" className="w-full">
                View Events
              </Button>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="bg-speakeasy-burgundy/10 rounded-lg p-8 border border-speakeasy-gold/20">
            <Heading level={2} className="text-2xl font-bebas text-speakeasy-gold mb-4 text-center">
              Find Our Hidden Entrance
            </Heading>
            <div className="bg-speakeasy-burgundy/20 rounded h-64 flex items-center justify-center">
              <Text className="text-speakeasy-champagne/70 text-center">
                Interactive map will be integrated here<br />
                Showing our location beneath the railway bridges
              </Text>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}