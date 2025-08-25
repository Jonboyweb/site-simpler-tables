'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { EventGalleryProps, VenueImage } from '@/types/components';

/**
 * EventGallery Component
 * 
 * Interactive gallery showcasing venue spaces, event atmosphere,
 * and customer experiences with prohibition-era styling.
 */
export function EventGallery({
  images,
  eventType,
  autoplay = false,
}: EventGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<VenueImage | null>(null);
  const [currentCategory, setCurrentCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter images by category
  const categories = [
    { id: 'all', label: 'All Photos', count: images.length },
    { id: 'atmosphere', label: 'Atmosphere', count: images.filter(img => img.category === 'atmosphere').length },
    { id: 'venue', label: 'Venue', count: images.filter(img => img.category === 'venue').length },
    { id: 'dj_performance', label: 'Performances', count: images.filter(img => img.category === 'dj_performance').length },
    { id: 'food_drink', label: 'Food & Drinks', count: images.filter(img => img.category === 'food_drink').length },
  ].filter(cat => cat.count > 0);

  const filteredImages = currentCategory === 'all' 
    ? images 
    : images.filter(img => img.category === currentCategory);

  // Handle keyboard navigation in modal
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setSelectedImage(null);
      } else if (e.key === 'ArrowLeft') {
        navigateImage('prev');
      } else if (e.key === 'ArrowRight') {
        navigateImage('next');
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isModalOpen, selectedImage]);

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!selectedImage) return;

    const currentIndex = filteredImages.findIndex(img => img.id === selectedImage.id);
    if (currentIndex === -1) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % filteredImages.length;
    } else {
      newIndex = currentIndex === 0 ? filteredImages.length - 1 : currentIndex - 1;
    }

    setSelectedImage(filteredImages[newIndex]);
  };

  const openModal = (image: VenueImage) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  if (images.length === 0) {
    return (
      <section className="luxury-event-card p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-luxury-copper/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-luxury-copper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-luxury-champagne/60 font-crimson italic">
          Event gallery coming soon...
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="luxury-event-card p-8">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-futura text-luxury-copper mb-4 tracking-wide">
            EVENT GALLERY
          </h2>
          <p className="text-luxury-champagne/80 font-crimson italic text-lg max-w-2xl mx-auto">
            Experience the atmosphere, energy, and sophistication of The Backroom Leeds
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setCurrentCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-raleway transition-all duration-300 ${
                currentCategory === category.id
                  ? 'bg-luxury-copper text-luxury-noir'
                  : 'text-luxury-champagne/80 hover:text-luxury-champagne hover:bg-luxury-copper/10'
              }`}
            >
              {category.label}
              <span className="ml-2 text-xs opacity-60">({category.count})</span>
            </button>
          ))}
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer bg-luxury-noir/30"
              onClick={() => openModal(image)}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-cover transition-all duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-luxury-noir/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Hover Content */}
              <div className="absolute inset-0 flex items-end justify-between p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                <div>
                  <p className="text-luxury-champagne font-raleway text-sm capitalize">
                    {image.category.replace('_', ' ')}
                  </p>
                </div>
                <div className="bg-luxury-copper/80 backdrop-blur-sm rounded-full p-2">
                  <svg className="w-4 h-4 text-luxury-noir" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Event Type Badge */}
              {image.eventType && (
                <div className="absolute top-3 left-3 px-2 py-1 bg-luxury-noir/80 backdrop-blur-sm rounded-full">
                  <span className="text-luxury-copper text-xs font-raleway uppercase tracking-wider">
                    {image.eventType.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* View All Link */}
        {filteredImages.length < images.length && (
          <div className="text-center mt-8">
            <button
              onClick={() => setCurrentCategory('all')}
              className="luxury-cta-ghost px-6 py-3 font-medium"
            >
              View All {images.length} Photos
            </button>
          </div>
        )}
      </section>

      {/* Lightbox Modal */}
      {isModalOpen && selectedImage && (
        <div className="fixed inset-0 z-50 bg-luxury-noir/95 backdrop-blur-sm flex items-center justify-center p-4">
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-luxury-noir/80 hover:bg-luxury-copper/80 rounded-full flex items-center justify-center transition-colors group"
          >
            <svg className="w-5 h-5 text-luxury-champagne group-hover:text-luxury-noir" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation Buttons */}
          {filteredImages.length > 1 && (
            <>
              <button
                onClick={() => navigateImage('prev')}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-luxury-noir/80 hover:bg-luxury-copper/80 rounded-full flex items-center justify-center transition-colors group"
              >
                <svg className="w-6 h-6 text-luxury-champagne group-hover:text-luxury-noir" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={() => navigateImage('next')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-luxury-noir/80 hover:bg-luxury-copper/80 rounded-full flex items-center justify-center transition-colors group"
              >
                <svg className="w-6 h-6 text-luxury-champagne group-hover:text-luxury-noir" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Main Image */}
          <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
            <div className="relative w-full h-full max-h-[80vh]">
              <Image
                src={selectedImage.url}
                alt={selectedImage.alt}
                fill
                className="object-contain"
                quality={95}
                priority
              />
            </div>
          </div>

          {/* Image Info */}
          <div className="absolute bottom-4 left-4 right-4 bg-luxury-noir/80 backdrop-blur-sm rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-luxury-champagne font-raleway capitalize mb-1">
                  {selectedImage.category.replace('_', ' ')}
                </p>
                <p className="text-luxury-champagne/60 text-sm font-crimson italic">
                  {selectedImage.alt}
                </p>
              </div>
              <div className="text-luxury-copper text-sm font-raleway">
                {filteredImages.findIndex(img => img.id === selectedImage.id) + 1} / {filteredImages.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}