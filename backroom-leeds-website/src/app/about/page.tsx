import type { Metadata } from 'next';
import { MainLayout } from '@/components/templates';
import { Heading, Text, Button } from '@/components/atoms';

export const metadata: Metadata = {
  title: 'About Us | The Backroom Leeds',
  description: 'Learn about The Backroom Leeds - Leeds\' premier speakeasy experience beneath the railway bridges. Our story, heritage, and prohibition-era inspiration.',
  keywords: ['The Backroom Leeds', 'speakeasy history', 'Leeds nightclub', 'prohibition era', 'about us'],
  openGraph: {
    title: 'About The Backroom Leeds',
    description: 'Discover the story behind Leeds\' most exclusive speakeasy venue',
    type: 'website',
  },
};

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Heading level={1} className="text-5xl md:text-6xl font-bebas text-speakeasy-gold mb-6">
              Our Story
            </Heading>
            <Text className="text-xl text-speakeasy-champagne font-playfair leading-relaxed max-w-3xl mx-auto">
              Beneath the historic railway bridges of Leeds lies a secret. 
              A place where the spirit of prohibition lives on, where jazz flows as freely as the finest whiskey, 
              and where every night tells a story of elegance and rebellion.
            </Text>
          </div>

          {/* Story Content */}
          <div className="space-y-12">
            <section className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Heading level={2} className="text-3xl font-bebas text-speakeasy-gold mb-4">
                  The Prohibition Era Lives On
                </Heading>
                <Text className="text-speakeasy-champagne/90 leading-relaxed mb-4">
                  Step through our unmarked door and discover a world frozen in time. 
                  The Backroom Leeds captures the essence of the 1920s speakeasy culture, 
                  where the finest cocktails were crafted in shadow and sophistication ruled the night.
                </Text>
                <Text className="text-speakeasy-champagne/90 leading-relaxed">
                  Our venue pays homage to the golden age of jazz and cocktails, 
                  when discretion was valued and every evening held the promise of adventure.
                </Text>
              </div>
              <div className="bg-speakeasy-burgundy/20 rounded-lg p-8 border border-speakeasy-gold/20">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-speakeasy-gold/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🥃</span>
                  </div>
                  <Heading level={3} className="text-xl font-bebas text-speakeasy-gold mb-2">
                    Since 2023
                  </Heading>
                  <Text className="text-speakeasy-champagne/80 text-sm">
                    Crafting unforgettable nights in the heart of Leeds
                  </Text>
                </div>
              </div>
            </section>

            <section className="grid md:grid-cols-2 gap-12 items-center">
              <div className="md:order-2">
                <Heading level={2} className="text-3xl font-bebas text-speakeasy-gold mb-4">
                  Beneath the Bridges
                </Heading>
                <Text className="text-speakeasy-champagne/90 leading-relaxed mb-4">
                  Our unique location beneath Leeds&apos; railway bridges creates an atmosphere unlike any other. 
                  The rhythmic rumble overhead becomes part of our soundtrack, 
                  adding an industrial elegance to our prohibition-themed sanctuary.
                </Text>
                <Text className="text-speakeasy-champagne/90 leading-relaxed">
                  With 16 carefully curated tables across two atmospheric floors, 
                  we offer an intimate setting where every detail has been designed to transport you 
                  to the golden age of speakeasies.
                </Text>
              </div>
              <div className="md:order-1">
                <div className="bg-speakeasy-burgundy/20 rounded-lg p-8 border border-speakeasy-gold/20">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-speakeasy-champagne">Total Tables</span>
                      <span className="text-speakeasy-gold font-bebas text-xl">16</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-speakeasy-champagne">Two Floors</span>
                      <span className="text-speakeasy-gold font-bebas text-xl">✓</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-speakeasy-champagne">Unique Location</span>
                      <span className="text-speakeasy-gold font-bebas text-xl">✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="text-center bg-speakeasy-burgundy/10 rounded-lg p-12 border border-speakeasy-gold/20">
              <Heading level={2} className="text-3xl font-bebas text-speakeasy-gold mb-4">
                Experience the Mystery
              </Heading>
              <Text className="text-speakeasy-champagne/90 leading-relaxed max-w-2xl mx-auto mb-8">
                From our signature cocktails crafted by master mixologists to our carefully curated events 
                featuring the finest DJs and performers, every visit to The Backroom is designed to be extraordinary.
              </Text>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button href="/book" variant="primary" size="lg">
                  Reserve Your Table
                </Button>
                <Button href="/events" variant="secondary" size="lg">
                  View Events
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}