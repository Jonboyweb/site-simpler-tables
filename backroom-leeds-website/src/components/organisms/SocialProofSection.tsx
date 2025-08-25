'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { SocialProofSectionProps, EventReview, SocialMediaPost } from '@/types/components';

/**
 * SocialProofSection Component
 * 
 * Showcases customer reviews, ratings, and social media content
 * to build trust and demonstrate the quality of The Backroom Leeds experience.
 */
export function SocialProofSection({
  reviews,
  socialMediaPosts = [],
  eventType,
}: SocialProofSectionProps) {
  const [activeTab, setActiveTab] = useState<'reviews' | 'social'>('reviews');

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const verifiedReviews = reviews.filter(review => review.verified);
  const recentReviews = reviews
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 6);

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'text-luxury-gold' : 'text-luxury-copper/30'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  if (reviews.length === 0 && socialMediaPosts.length === 0) {
    return (
      <section className="luxury-event-card p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-luxury-copper/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-luxury-copper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-luxury-champagne/60 font-crimson italic">
          Customer reviews coming soon...
        </p>
      </section>
    );
  }

  return (
    <section className="luxury-event-card p-8">
      {/* Section Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-futura text-luxury-copper mb-4 tracking-wide">
          WHAT OUR GUESTS SAY
        </h2>
        <p className="text-luxury-champagne/80 font-crimson italic text-lg max-w-2xl mx-auto">
          Discover why The Backroom Leeds is Leeds&apos; most talked-about speakeasy experience
        </p>
      </div>

      {/* Overall Stats */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-6 bg-luxury-noir/30 rounded-lg">
            <div className="flex justify-center mb-2">
              {renderStars(Math.round(averageRating), 'lg')}
            </div>
            <div className="text-3xl font-futura text-luxury-gold mb-1">
              {averageRating.toFixed(1)}
            </div>
            <div className="text-luxury-champagne/80 text-sm font-raleway">
              Average Rating
            </div>
          </div>
          
          <div className="text-center p-6 bg-luxury-noir/30 rounded-lg">
            <div className="text-3xl font-futura text-luxury-gold mb-1">
              {reviews.length}
            </div>
            <div className="text-luxury-champagne/80 text-sm font-raleway">
              Customer Reviews
            </div>
          </div>
          
          <div className="text-center p-6 bg-luxury-noir/30 rounded-lg">
            <div className="text-3xl font-futura text-luxury-gold mb-1">
              {verifiedReviews.length}
            </div>
            <div className="text-luxury-champagne/80 text-sm font-raleway">
              Verified Bookings
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      {socialMediaPosts.length > 0 && (
        <div className="flex justify-center gap-2 mb-8 border-b border-luxury-copper/20 pb-4">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 rounded-lg font-futura tracking-wide transition-all duration-300 ${
              activeTab === 'reviews'
                ? 'bg-luxury-copper text-luxury-noir'
                : 'text-luxury-champagne/80 hover:text-luxury-champagne hover:bg-luxury-copper/10'
            }`}
          >
            Customer Reviews
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`px-6 py-3 rounded-lg font-futura tracking-wide transition-all duration-300 ${
              activeTab === 'social'
                ? 'bg-luxury-copper text-luxury-noir'
                : 'text-luxury-champagne/80 hover:text-luxury-champagne hover:bg-luxury-copper/10'
            }`}
          >
            Social Media
          </button>
        </div>
      )}

      {/* Reviews Tab */}
      {(activeTab === 'reviews' || socialMediaPosts.length === 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          {recentReviews.map((review) => (
            <div key={review.id} className="p-6 bg-luxury-noir/30 border border-luxury-copper/20 rounded-lg">
              {/* Review Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-luxury-copper/20 rounded-full flex items-center justify-center">
                    <span className="text-luxury-copper font-futura font-bold">
                      {review.customerName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-luxury-champagne font-raleway font-medium">
                      {review.customerName}
                    </h4>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating, 'sm')}
                      {review.verified && (
                        <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs font-raleway rounded uppercase tracking-wider">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-luxury-champagne/60 text-sm font-raleway">
                  {formatDate(review.date)}
                </div>
              </div>

              {/* Review Content */}
              <blockquote className="text-luxury-champagne/90 font-crimson italic leading-relaxed mb-4">
                &ldquo;{review.comment}&rdquo;
              </blockquote>

              {/* Event Type Badge */}
              <div className="flex justify-between items-center">
                <span className="px-3 py-1 bg-luxury-copper/20 text-luxury-copper text-xs font-raleway rounded uppercase tracking-wider">
                  {review.eventType.replace('_', ' ')}
                </span>
                
                {/* Review Photos */}
                {review.photos && review.photos.length > 0 && (
                  <div className="flex -space-x-2">
                    {review.photos.slice(0, 3).map((photo, index) => (
                      <div key={index} className="w-8 h-8 rounded-full border-2 border-luxury-copper/30 overflow-hidden bg-luxury-noir/40">
                        <Image
                          src={photo}
                          alt="Customer photo"
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {review.photos.length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-luxury-copper/30 bg-luxury-copper/20 flex items-center justify-center">
                        <span className="text-luxury-copper text-xs font-bold">
                          +{review.photos.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Social Media Tab */}
      {activeTab === 'social' && socialMediaPosts.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {socialMediaPosts.map((post) => (
            <div key={post.id} className="group">
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-luxury-noir/30 border border-luxury-copper/20 hover:border-luxury-copper/40 rounded-lg transition-all duration-300 hover:bg-luxury-copper/5"
              >
                {/* Platform Icon */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 text-luxury-copper">
                    {post.platform === 'instagram' && (
                      <svg fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.621 5.367 11.987 11.988 11.987c6.62 0 11.987-5.366 11.987-11.987C24.014 5.367 18.637.001 12.017.001z"/>
                      </svg>
                    )}
                    {post.platform === 'twitter' && (
                      <svg fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-luxury-champagne/80 font-raleway font-medium capitalize">
                    {post.platform}
                  </span>
                </div>

                {/* Thumbnail */}
                {post.thumbnailUrl && (
                  <div className="aspect-square mb-3 rounded-lg overflow-hidden">
                    <Image
                      src={post.thumbnailUrl}
                      alt="Social media post"
                      width={400}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Post Info */}
                <div className="space-y-2">
                  <p className="text-luxury-champagne font-raleway font-medium">
                    @{post.author}
                  </p>
                  {post.caption && (
                    <p className="text-luxury-champagne/80 text-sm font-crimson italic line-clamp-2">
                      {post.caption}
                    </p>
                  )}
                  <p className="text-luxury-champagne/60 text-xs font-raleway">
                    {formatDate(post.date)}
                  </p>
                </div>
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Call to Action */}
      <div className="text-center mt-12 p-6 bg-luxury-copper/10 border border-luxury-copper/30 rounded-lg">
        <h3 className="text-2xl font-futura text-luxury-copper mb-3 tracking-wide">
          SHARE YOUR EXPERIENCE
        </h3>
        <p className="text-luxury-champagne/80 font-crimson italic mb-4">
          Tag us @backroomleeds and use #BackroomExperience to share your speakeasy memories
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="https://instagram.com/backroomleeds"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-luxury-noir/40 hover:bg-luxury-copper/20 rounded-lg transition-colors text-luxury-champagne hover:text-luxury-copper"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.621 5.367 11.987 11.988 11.987c6.62 0 11.987-5.366 11.987-11.987C24.014 5.367 18.637.001 12.017.001z"/>
            </svg>
            @backroomleeds
          </a>
          <a
            href="https://twitter.com/backroomleeds"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-luxury-noir/40 hover:bg-luxury-copper/20 rounded-lg transition-colors text-luxury-champagne hover:text-luxury-copper"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            @backroomleeds
          </a>
        </div>
      </div>
    </section>
  );
}