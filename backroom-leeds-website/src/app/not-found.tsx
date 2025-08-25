import type { Metadata } from 'next';
import { Button, Heading, Text } from '@/components/atoms';
import { MainLayout } from '@/components/templates';

export const metadata: Metadata = {
  title: '404 - Page Not Found | The Backroom Leeds',
  description: 'The page you are looking for could not be found.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <MainLayout>
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto px-4">
          <div className="mb-8">
            {/* Art Deco 404 Design */}
            <div className="relative mb-6">
              <div className="text-9xl font-bebas text-speakeasy-gold/20 select-none">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 border-4 border-speakeasy-gold/30 rotate-45 rounded-lg"></div>
              </div>
            </div>
            
            <Heading level={1} className="text-4xl md:text-5xl font-bebas text-speakeasy-gold mb-4">
              Speakeasy Not Found
            </Heading>
            <Text className="text-xl text-speakeasy-champagne/90 font-playfair mb-6">
              It seems you've wandered into the wrong part of our establishment. 
              The page you're looking for has vanished into the night like a whisper from the prohibition era.
            </Text>
          </div>
          
          <div className="space-y-4">
            <Button 
              href="/"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
            >
              Return to Main Floor
            </Button>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                href="/events"
                variant="secondary"
                size="md"
              >
                Browse Events
              </Button>
              <Button 
                href="/book"
                variant="secondary"
                size="md"
              >
                Book a Table
              </Button>
              <Button 
                href="/contact"
                variant="ghost"
                size="md"
              >
                Contact Us
              </Button>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-speakeasy-gold/20">
            <Text className="text-speakeasy-champagne/60 text-sm">
              "In the speakeasy of life, sometimes the most interesting discoveries happen when you take a wrong turn."
            </Text>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}