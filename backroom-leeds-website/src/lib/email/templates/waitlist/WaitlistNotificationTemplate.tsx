/**
 * Waitlist Notification Email Template
 * 
 * Prohibition-themed email template for waitlist availability notifications
 * with time-sensitive booking opportunities.
 * 
 * @module WaitlistNotificationTemplate
 */

import {
  Body,
  Button,
  Column,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text
} from '@react-email/components';
import * as React from 'react';
import { format, addMinutes } from 'date-fns';

// ============================================================================
// Types
// ============================================================================

export interface WaitlistNotificationProps {
  customerName: string;
  waitlistEntry: {
    id: string;
    createdAt: Date | string;
    preferences: {
      preferredDate: Date | string;
      preferredTime?: string;
      partySize: number;
      floor?: 'upstairs' | 'downstairs';
      specialRequests?: string;
    };
  };
  availableSlot: {
    date: Date | string;
    timeSlot: string;
    tableName: string;
    floor: string;
    capacity: number;
    price: number;
    availability: {
      totalTables: number;
      availableTables: number;
    };
  };
  booking: {
    reservationWindow: number; // minutes
    expiresAt: Date | string;
    bookingUrl: string;
    priority: number;
  };
  eventInfo?: {
    name: string;
    type: string;
    djLineup?: string[];
    specialOffers?: string[];
  };
}

// ============================================================================
// Styles
// ============================================================================

const styles = {
  body: {
    backgroundColor: '#1a1a1a',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0,
    padding: 0
  },
  container: {
    backgroundColor: '#0d0d0d',
    border: '2px solid #8B7355',
    borderRadius: '8px',
    margin: '40px auto',
    padding: '0',
    maxWidth: '600px',
    overflow: 'hidden'
  },
  header: {
    backgroundColor: '#1a1a1a',
    padding: '40px 40px 30px',
    textAlign: 'center' as const,
    borderBottom: '1px solid #8B7355'
  },
  logo: {
    margin: '0 auto'
  },
  content: {
    padding: '40px'
  },
  heading: {
    color: '#D4AF37',
    fontSize: '32px',
    fontFamily: 'Bebas Neue, Arial Black, sans-serif',
    fontWeight: '400',
    letterSpacing: '2px',
    margin: '0 0 10px',
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const
  },
  subheading: {
    color: '#D4C4A0',
    fontSize: '18px',
    fontFamily: 'Playfair Display, Georgia, serif',
    fontStyle: 'italic' as const,
    margin: '0 0 30px',
    textAlign: 'center' as const
  },
  availabilityBadge: {
    backgroundColor: '#4CAF50',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '0.5px',
    padding: '8px 20px',
    borderRadius: '20px',
    textTransform: 'uppercase' as const,
    margin: '0 0 30px'
  },
  urgencyBadge: {
    backgroundColor: '#FF5722',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.5px',
    padding: '6px 16px',
    borderRadius: '16px',
    textTransform: 'uppercase' as const,
    marginLeft: '10px'
  },
  availabilityNotice: {
    backgroundColor: '#1a3a1a',
    border: '2px solid #4CAF50',
    borderRadius: '6px',
    padding: '30px',
    margin: '30px 0',
    textAlign: 'center' as const
  },
  availabilityIcon: {
    color: '#4CAF50',
    fontSize: '48px',
    margin: '0 0 20px'
  },
  availabilityHeading: {
    color: '#4CAF50',
    fontSize: '24px',
    fontFamily: 'Bebas Neue, Arial Black, sans-serif',
    letterSpacing: '1px',
    margin: '0 0 15px',
    textTransform: 'uppercase' as const
  },
  availabilityText: {
    color: '#D4C4A0',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '10px 0'
  },
  urgencySection: {
    backgroundColor: '#2e1a1a',
    border: '2px solid #FF5722',
    borderRadius: '6px',
    padding: '25px',
    margin: '25px 0'
  },
  urgencyHeading: {
    color: '#FF5722',
    fontSize: '22px',
    fontFamily: 'Bebas Neue, Arial Black, sans-serif',
    letterSpacing: '1px',
    margin: '0 0 15px',
    textAlign: 'center' as const
  },
  countdown: {
    color: '#FF5722',
    fontSize: '36px',
    fontWeight: '600',
    margin: '20px 0',
    textAlign: 'center' as const
  },
  countdownText: {
    color: '#D4C4A0',
    fontSize: '16px',
    margin: '10px 0',
    textAlign: 'center' as const
  },
  slotDetails: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #8B7355',
    borderRadius: '6px',
    padding: '25px',
    margin: '25px 0'
  },
  sectionHeading: {
    color: '#8B7355',
    fontSize: '20px',
    fontFamily: 'Bebas Neue, Arial Black, sans-serif',
    letterSpacing: '1px',
    margin: '0 0 20px',
    textTransform: 'uppercase' as const
  },
  detailRow: {
    marginBottom: '15px'
  },
  label: {
    color: '#8B7355',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.5px',
    margin: '0 0 5px',
    textTransform: 'uppercase' as const
  },
  value: {
    color: '#D4C4A0',
    fontSize: '16px',
    margin: '0'
  },
  largeValue: {
    color: '#D4AF37',
    fontSize: '20px',
    fontWeight: '600',
    margin: '0'
  },
  priceHighlight: {
    color: '#4CAF50',
    fontSize: '24px',
    fontWeight: '600',
    margin: '0'
  },
  eventSection: {
    backgroundColor: '#1a1a2e',
    border: '2px solid #D4AF37',
    borderRadius: '6px',
    padding: '25px',
    margin: '25px 0'
  },
  eventHeading: {
    color: '#D4AF37',
    fontSize: '22px',
    fontFamily: 'Bebas Neue, Arial Black, sans-serif',
    letterSpacing: '1px',
    margin: '0 0 15px',
    textAlign: 'center' as const
  },
  eventDetails: {
    color: '#D4C4A0',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '10px 0'
  },
  djLineup: {
    color: '#D4C4A0',
    fontSize: '14px',
    lineHeight: '1.8',
    margin: '5px 0 5px 20px'
  },
  specialOffer: {
    backgroundColor: '#D4AF37',
    color: '#0d0d0d',
    fontSize: '14px',
    fontWeight: '600',
    padding: '8px 15px',
    borderRadius: '20px',
    margin: '10px 5px',
    display: 'inline-block'
  },
  availabilityMeter: {
    backgroundColor: '#262626',
    border: '1px solid #8B7355',
    borderRadius: '6px',
    padding: '20px',
    margin: '25px 0',
    textAlign: 'center' as const
  },
  meterHeading: {
    color: '#8B7355',
    fontSize: '16px',
    fontFamily: 'Bebas Neue, Arial Black, sans-serif',
    letterSpacing: '1px',
    margin: '0 0 15px',
    textTransform: 'uppercase' as const
  },
  meterBar: {
    backgroundColor: '#1a1a1a',
    border: '2px solid #8B7355',
    borderRadius: '10px',
    height: '20px',
    margin: '10px 0',
    overflow: 'hidden',
    position: 'relative' as const
  },
  meterFill: {
    backgroundColor: '#4CAF50',
    height: '100%',
    borderRadius: '8px'
  },
  meterText: {
    color: '#D4C4A0',
    fontSize: '14px',
    margin: '10px 0'
  },
  priorityInfo: {
    backgroundColor: '#2e2e1a',
    border: '1px solid #D4AF37',
    borderRadius: '6px',
    padding: '20px',
    margin: '25px 0'
  },
  priorityHeading: {
    color: '#D4AF37',
    fontSize: '18px',
    fontFamily: 'Bebas Neue, Arial Black, sans-serif',
    letterSpacing: '1px',
    margin: '0 0 10px'
  },
  priorityText: {
    color: '#D4C4A0',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '8px 0'
  },
  artDecoSeparator: {
    borderTop: '2px solid #8B7355',
    borderBottom: '1px solid #8B7355',
    margin: '20px 0',
    height: '3px',
    backgroundColor: 'transparent'
  },
  bookButton: {
    backgroundColor: '#4CAF50',
    borderRadius: '6px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '20px',
    fontWeight: '600',
    letterSpacing: '0.5px',
    padding: '18px 45px',
    textDecoration: 'none',
    textTransform: 'uppercase' as const,
    margin: '20px auto',
    textAlign: 'center' as const,
    boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    border: '2px solid #D4AF37',
    borderRadius: '6px',
    color: '#D4AF37',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: '600',
    letterSpacing: '0.5px',
    padding: '14px 30px',
    textDecoration: 'none',
    textTransform: 'uppercase' as const,
    margin: '10px',
    textAlign: 'center' as const
  },
  footer: {
    backgroundColor: '#1a1a1a',
    borderTop: '1px solid #8B7355',
    padding: '30px 40px',
    textAlign: 'center' as const
  },
  footerText: {
    color: '#8B7355',
    fontSize: '14px',
    margin: '10px 0'
  },
  footerLink: {
    color: '#D4AF37',
    fontSize: '14px',
    margin: '0 10px',
    textDecoration: 'none'
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

const getTimeRemaining = (expiresAt: Date): { minutes: number; formattedTime: string } => {
  const now = new Date();
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const minutes = Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60)));
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return {
      minutes,
      formattedTime: `${hours}h ${remainingMinutes}m`
    };
  }
  
  return {
    minutes,
    formattedTime: `${minutes} minutes`
  };
};

const getAvailabilityPercentage = (available: number, total: number): number => {
  return Math.round((available / total) * 100);
};

const getPriorityLevel = (priority: number): { level: string; description: string } => {
  if (priority <= 10) {
    return {
      level: 'VIP Priority',
      description: 'You have first choice on this table'
    };
  } else if (priority <= 25) {
    return {
      level: 'High Priority',
      description: 'You\'re among the first to be notified'
    };
  } else if (priority <= 50) {
    return {
      level: 'Standard Priority',
      description: 'You\'re in a good position on the waitlist'
    };
  } else {
    return {
      level: 'Waitlist Member',
      description: 'Act quickly as others may book first'
    };
  }
};

// ============================================================================
// Template Component
// ============================================================================

export const WaitlistNotificationTemplate: React.FC<WaitlistNotificationProps> = ({
  customerName,
  waitlistEntry,
  availableSlot,
  booking,
  eventInfo
}) => {
  const slotDate = typeof availableSlot.date === 'string' 
    ? new Date(availableSlot.date) 
    : availableSlot.date;

  const expiresAt = typeof booking.expiresAt === 'string'
    ? new Date(booking.expiresAt)
    : booking.expiresAt;

  const timeRemaining = getTimeRemaining(expiresAt);
  const availabilityPercentage = getAvailabilityPercentage(
    availableSlot.availability.availableTables, 
    availableSlot.availability.totalTables
  );
  const priorityInfo = getPriorityLevel(booking.priority);

  return (
    <Html>
      <Head>
        <Font
          fontFamily="Bebas Neue"
          fallbackFontFamily="Arial Black"
          webFont={{
            url: 'https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXooxW5rygbi49c.woff2',
            format: 'woff2'
          }}
          fontWeight={400}
        />
        <Font
          fontFamily="Playfair Display"
          fallbackFontFamily="Georgia"
          webFont={{
            url: 'https://fonts.gstatic.com/s/playfairdisplay/v36/nuFiD-vYSZviVYUb_rj3ij__anPXDTLYgFE_.woff2',
            format: 'woff2'
          }}
          fontWeight={400}
          fontStyle="italic"
        />
      </Head>
      
      <Preview>Table available for {format(slotDate, 'EEEE, MMMM d')} - Book now before it's gone!</Preview>
      
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Img
              src="https://backroomleeds.com/images/logo-art-deco.png"
              alt="The Backroom Leeds"
              width="200"
              height="80"
              style={styles.logo}
            />
          </Section>
          
          {/* Content */}
          <Section style={styles.content}>
            <div style={{ textAlign: 'center' }}>
              <span style={styles.availabilityBadge}>Table Available</span>
              {timeRemaining.minutes <= 30 && (
                <span style={styles.urgencyBadge}>Limited Time</span>
              )}
            </div>
            
            <Heading style={styles.heading}>
              Great News, {customerName}!
            </Heading>
            
            <Text style={styles.subheading}>
              A table matching your preferences is now available
            </Text>
            
            {/* Availability Notice */}
            <Section style={styles.availabilityNotice}>
              <div style={styles.availabilityIcon}>🎉</div>
              <Heading as="h3" style={styles.availabilityHeading}>
                Your Table is Ready to Book
              </Heading>
              <Text style={styles.availabilityText}>
                We found a perfect match for your waitlist preferences: 
                {availableSlot.tableName} on {format(slotDate, 'EEEE, MMMM d')}.
              </Text>
              <Text style={styles.availabilityText}>
                This reservation is exclusively available to you for {timeRemaining.formattedTime}.
              </Text>
            </Section>
            
            {/* Urgency Timer */}
            {timeRemaining.minutes <= 60 && (
              <Section style={styles.urgencySection}>
                <Heading as="h4" style={styles.urgencyHeading}>
                  Reservation Expires Soon
                </Heading>
                <div style={styles.countdown}>
                  {timeRemaining.formattedTime}
                </div>
                <Text style={styles.countdownText}>
                  remaining to secure this table
                </Text>
              </Section>
            )}
            
            {/* Available Slot Details */}
            <Section style={styles.slotDetails}>
              <Heading as="h4" style={styles.sectionHeading}>
                Available Table Details
              </Heading>
              
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.label}>Date</Text>
                  <Text style={styles.largeValue}>
                    {format(slotDate, 'EEEE, MMMM d, yyyy')}
                  </Text>
                </Column>
                <Column>
                  <Text style={styles.label}>Time</Text>
                  <Text style={styles.largeValue}>{availableSlot.timeSlot}</Text>
                </Column>
              </Row>
              
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.label}>Table</Text>
                  <Text style={styles.value}>{availableSlot.tableName}</Text>
                </Column>
                <Column>
                  <Text style={styles.label}>Floor</Text>
                  <Text style={styles.value}>{availableSlot.floor}</Text>
                </Column>
              </Row>
              
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.label}>Capacity</Text>
                  <Text style={styles.value}>Up to {availableSlot.capacity} guests</Text>
                </Column>
                <Column>
                  <Text style={styles.label}>Deposit Required</Text>
                  <Text style={styles.priceHighlight}>£{availableSlot.price}</Text>
                </Column>
              </Row>
            </Section>
            
            {/* Event Information */}
            {eventInfo && (
              <Section style={styles.eventSection}>
                <Heading as="h3" style={styles.eventHeading}>
                  Tonight's Event: {eventInfo.name}
                </Heading>
                <Text style={styles.eventDetails}>
                  Join us for an unforgettable {eventInfo.type} experience
                </Text>
                {eventInfo.djLineup && eventInfo.djLineup.length > 0 && (
                  <>
                    <Text style={styles.label}>DJ Lineup:</Text>
                    {eventInfo.djLineup.map((dj, index) => (
                      <Text key={index} style={styles.djLineup}>
                        ♪ {dj}
                      </Text>
                    ))}
                  </>
                )}
                {eventInfo.specialOffers && eventInfo.specialOffers.length > 0 && (
                  <div style={{ textAlign: 'center', margin: '20px 0' }}>
                    {eventInfo.specialOffers.map((offer, index) => (
                      <span key={index} style={styles.specialOffer}>
                        {offer}
                      </span>
                    ))}
                  </div>
                )}
              </Section>
            )}
            
            {/* Availability Meter */}
            <Section style={styles.availabilityMeter}>
              <Text style={styles.meterHeading}>
                Table Availability Tonight
              </Text>
              <div style={styles.meterBar}>
                <div 
                  style={{
                    ...styles.meterFill,
                    width: `${100 - availabilityPercentage}%`,
                    backgroundColor: availabilityPercentage > 70 ? '#4CAF50' : 
                                   availabilityPercentage > 40 ? '#FF9800' : '#F44336'
                  }}
                />
              </div>
              <Text style={styles.meterText}>
                {availableSlot.availability.availableTables} of {availableSlot.availability.totalTables} tables remaining
              </Text>
              {availabilityPercentage <= 30 && (
                <Text style={{ ...styles.meterText, color: '#F44336', fontWeight: '600' }}>
                  High demand - book quickly!
                </Text>
              )}
            </Section>
            
            {/* Priority Information */}
            <Section style={styles.priorityInfo}>
              <Text style={styles.priorityHeading}>
                {priorityInfo.level} (Position #{booking.priority})
              </Text>
              <Text style={styles.priorityText}>
                {priorityInfo.description}
              </Text>
              <Text style={styles.priorityText}>
                • This exclusive reservation window expires at {format(expiresAt, 'HH:mm')}
              </Text>
              <Text style={styles.priorityText}>
                • You joined the waitlist on {format(new Date(waitlistEntry.createdAt), 'dd/MM/yyyy')}
              </Text>
            </Section>
            
            {/* Book Now CTA */}
            <Section style={{ textAlign: 'center', margin: '40px 0' }}>
              <Text style={{ ...styles.availabilityText, fontSize: '20px', marginBottom: '25px' }}>
                Secure your table now - this offer won't last long
              </Text>
              
              <Button 
                href={booking.bookingUrl} 
                style={styles.bookButton}
              >
                Book This Table Now
              </Button>
              
              <div style={{ margin: '25px 0' }}>
                <Text style={{ ...styles.availabilityText, fontSize: '14px' }}>
                  Expires in {timeRemaining.formattedTime} • £{availableSlot.price} deposit required
                </Text>
              </div>
              
              <div style={{ margin: '20px 0' }}>
                <Button 
                  href={`https://backroomleeds.com/waitlist/${waitlistEntry.id}`} 
                  style={styles.secondaryButton}
                >
                  View Waitlist Status
                </Button>
                
                <Button 
                  href="https://backroomleeds.com/contact" 
                  style={styles.secondaryButton}
                >
                  Contact Us
                </Button>
              </div>
            </Section>
            
            {/* Your Preferences Reminder */}
            <Section style={styles.slotDetails}>
              <Heading as="h4" style={styles.sectionHeading}>
                Your Waitlist Preferences
              </Heading>
              
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.label}>Preferred Date</Text>
                  <Text style={styles.value}>
                    {format(new Date(waitlistEntry.preferences.preferredDate), 'EEEE, MMMM d')}
                  </Text>
                </Column>
                <Column>
                  <Text style={styles.label}>Party Size</Text>
                  <Text style={styles.value}>{waitlistEntry.preferences.partySize} guests</Text>
                </Column>
              </Row>
              
              {waitlistEntry.preferences.preferredTime && (
                <Row style={styles.detailRow}>
                  <Column>
                    <Text style={styles.label}>Preferred Time</Text>
                    <Text style={styles.value}>{waitlistEntry.preferences.preferredTime}</Text>
                  </Column>
                </Row>
              )}
              
              {waitlistEntry.preferences.floor && (
                <Row style={styles.detailRow}>
                  <Column>
                    <Text style={styles.label}>Preferred Floor</Text>
                    <Text style={styles.value}>{waitlistEntry.preferences.floor}</Text>
                  </Column>
                </Row>
              )}
            </Section>
          </Section>
          
          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              The Backroom Leeds | Lower Briggate | Leeds LS1 6LY
            </Text>
            <Text style={styles.footerText}>
              Questions? Contact us at{' '}
              <Link href="mailto:bookings@backroomleeds.com" style={styles.footerLink}>
                bookings@backroomleeds.com
              </Link>
              {' '}or call{' '}
              <Link href="tel:+441132451234" style={styles.footerLink}>
                0113 245 1234
              </Link>
            </Text>
            
            <Text style={{ ...styles.footerText, fontSize: '12px', marginTop: '20px' }}>
              © 2024 The Backroom Leeds. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// ============================================================================
// Export
// ============================================================================

export default WaitlistNotificationTemplate;