/**
 * Booking Reminder Email Template
 * 
 * Prohibition-themed email template for pre-arrival reminders
 * with essential information and QR code.
 * 
 * @module BookingReminderTemplate
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
import { format, addHours } from 'date-fns';

// ============================================================================
// Types
// ============================================================================

export interface BookingReminderProps {
  customerName: string;
  booking: {
    id: string;
    date: Date | string;
    timeSlot: string;
    tableName: string;
    floor: string;
    partySize: number;
    specialRequests?: string;
    remainingBalance: number;
  };
  qrCodeUrl: string;
  reminderType: 'week_before' | 'day_before' | 'day_of';
  eventInfo?: {
    name: string;
    type: string;
    djLineup?: string[];
    specialNotes?: string;
  };
  weatherAlert?: {
    condition: string;
    recommendation: string;
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
  reminderBadge: {
    backgroundColor: '#D4AF37',
    color: '#0d0d0d',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '0.5px',
    padding: '8px 20px',
    borderRadius: '20px',
    textTransform: 'uppercase' as const,
    margin: '0 0 30px'
  },
  countdownSection: {
    backgroundColor: '#262626',
    border: '2px solid #D4AF37',
    borderRadius: '6px',
    padding: '30px',
    margin: '30px 0',
    textAlign: 'center' as const
  },
  countdownHeading: {
    color: '#D4AF37',
    fontSize: '24px',
    fontFamily: 'Bebas Neue, Arial Black, sans-serif',
    letterSpacing: '1px',
    margin: '0 0 15px',
    textTransform: 'uppercase' as const
  },
  countdownText: {
    color: '#D4C4A0',
    fontSize: '18px',
    fontWeight: '600',
    margin: '10px 0'
  },
  bookingDetails: {
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
  qrSection: {
    backgroundColor: '#1a1a1a',
    border: '2px solid #D4AF37',
    borderRadius: '6px',
    padding: '30px',
    margin: '30px 0',
    textAlign: 'center' as const
  },
  qrCode: {
    border: '4px solid #8B7355',
    borderRadius: '8px',
    display: 'inline-block',
    padding: '10px',
    backgroundColor: '#ffffff',
    margin: '0 auto'
  },
  qrText: {
    color: '#D4AF37',
    fontSize: '16px',
    fontWeight: '600',
    margin: '20px 0 0',
    textAlign: 'center' as const
  },
  weatherAlert: {
    backgroundColor: '#2e2e1a',
    border: '1px solid #D4AF37',
    borderRadius: '6px',
    padding: '20px',
    margin: '25px 0',
    textAlign: 'center' as const
  },
  weatherIcon: {
    fontSize: '32px',
    margin: '0 0 10px'
  },
  weatherText: {
    color: '#D4C4A0',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '10px 0'
  },
  checklist: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #8B7355',
    borderRadius: '6px',
    padding: '25px',
    margin: '25px 0'
  },
  checklistItem: {
    color: '#D4C4A0',
    fontSize: '14px',
    lineHeight: '1.8',
    margin: '8px 0',
    paddingLeft: '25px',
    position: 'relative' as const
  },
  checklistIcon: {
    color: '#D4AF37',
    position: 'absolute' as const,
    left: '0px',
    top: '2px'
  },
  artDecoSeparator: {
    borderTop: '2px solid #8B7355',
    borderBottom: '1px solid #8B7355',
    margin: '20px 0',
    height: '3px',
    backgroundColor: 'transparent'
  },
  button: {
    backgroundColor: '#D4AF37',
    borderRadius: '6px',
    color: '#0d0d0d',
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

const getReminderTitle = (reminderType: string): string => {
  switch (reminderType) {
    case 'week_before':
      return 'Your Booking is Next Week';
    case 'day_before':
      return 'Your Booking is Tomorrow';
    case 'day_of':
      return 'Your Booking is Today';
    default:
      return 'Booking Reminder';
  }
};

const getReminderMessage = (reminderType: string): string => {
  switch (reminderType) {
    case 'week_before':
      return 'Just a friendly reminder about your upcoming booking';
    case 'day_before':
      return "We're looking forward to welcoming you tomorrow";
    case 'day_of':
      return "We can't wait to see you tonight";
    default:
      return 'Your booking is coming up';
  }
};

const getCountdownText = (bookingDate: Date, reminderType: string): string => {
  const now = new Date();
  const hoursUntil = Math.round((bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  
  if (reminderType === 'day_of') {
    if (hoursUntil <= 6) {
      return `${hoursUntil} hours until your arrival`;
    }
    return 'Your booking is today';
  } else if (reminderType === 'day_before') {
    return 'Less than 24 hours until your booking';
  } else {
    const daysUntil = Math.round(hoursUntil / 24);
    return `${daysUntil} days until your booking`;
  }
};

// ============================================================================
// Template Component
// ============================================================================

export const BookingReminderTemplate: React.FC<BookingReminderProps> = ({
  customerName,
  booking,
  qrCodeUrl,
  reminderType,
  eventInfo,
  weatherAlert
}) => {
  const bookingDate = typeof booking.date === 'string' 
    ? new Date(booking.date) 
    : booking.date;

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
      
      <Preview>{getReminderTitle(reminderType)} - {format(bookingDate, 'EEEE, MMMM d')}</Preview>
      
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
              <span style={styles.reminderBadge}>{getReminderTitle(reminderType)}</span>
            </div>
            
            <Heading style={styles.heading}>
              Hello {customerName}
            </Heading>
            
            <Text style={styles.subheading}>
              {getReminderMessage(reminderType)}
            </Text>
            
            {/* Countdown */}
            <Section style={styles.countdownSection}>
              <Heading as="h3" style={styles.countdownHeading}>
                {getCountdownText(bookingDate, reminderType)}
              </Heading>
              <Text style={styles.countdownText}>
                {format(bookingDate, 'EEEE, MMMM d, yyyy')} at {booking.timeSlot}
              </Text>
            </Section>
            
            {/* Booking Quick Details */}
            <Section style={styles.bookingDetails}>
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.label}>Table</Text>
                  <Text style={styles.largeValue}>{booking.tableName}</Text>
                </Column>
                <Column>
                  <Text style={styles.label}>Party Size</Text>
                  <Text style={styles.largeValue}>{booking.partySize} guests</Text>
                </Column>
              </Row>
              
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.label}>Floor</Text>
                  <Text style={styles.value}>{booking.floor}</Text>
                </Column>
                <Column>
                  <Text style={styles.label}>Balance Due</Text>
                  <Text style={styles.value}>£{booking.remainingBalance}</Text>
                </Column>
              </Row>
              
              {booking.specialRequests && (
                <Row style={styles.detailRow}>
                  <Column>
                    <Text style={styles.label}>Special Requests</Text>
                    <Text style={styles.value}>{booking.specialRequests}</Text>
                  </Column>
                </Row>
              )}
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
                    <Text style={styles.label}>Tonight's DJ Lineup:</Text>
                    {eventInfo.djLineup.map((dj, index) => (
                      <Text key={index} style={styles.djLineup}>
                        ♪ {dj}
                      </Text>
                    ))}
                  </>
                )}
                {eventInfo.specialNotes && (
                  <Text style={styles.eventDetails}>
                    <strong>Special Notes:</strong> {eventInfo.specialNotes}
                  </Text>
                )}
              </Section>
            )}
            
            {/* Weather Alert */}
            {weatherAlert && reminderType === 'day_of' && (
              <Section style={styles.weatherAlert}>
                <div style={styles.weatherIcon}>🌤️</div>
                <Text style={styles.weatherText}>
                  <strong>Weather Update:</strong> {weatherAlert.condition}
                </Text>
                <Text style={styles.weatherText}>
                  {weatherAlert.recommendation}
                </Text>
              </Section>
            )}
            
            {/* Pre-Arrival Checklist */}
            {reminderType === 'day_of' && (
              <Section style={styles.checklist}>
                <Heading as="h4" style={styles.sectionHeading}>
                  Pre-Arrival Checklist
                </Heading>
                
                <div style={styles.checklistItem}>
                  <span style={styles.checklistIcon}>✓</span>
                  Bring valid photo ID (Challenge 21 policy)
                </div>
                <div style={styles.checklistItem}>
                  <span style={styles.checklistIcon}>✓</span>
                  Have your QR code ready (below)
                </div>
                <div style={styles.checklistItem}>
                  <span style={styles.checklistIcon}>✓</span>
                  Prepare remaining balance: £{booking.remainingBalance}
                </div>
                <div style={styles.checklistItem}>
                  <span style={styles.checklistIcon}>✓</span>
                  Dress code: Smart casual (no sportswear/trainers)
                </div>
                <div style={styles.checklistItem}>
                  <span style={styles.checklistIcon}>✓</span>
                  Arrive on time - tables held for 15 minutes
                </div>
              </Section>
            )}
            
            {/* QR Code */}
            <Section style={styles.qrSection}>
              <Img
                src={qrCodeUrl}
                alt="Booking QR Code"
                width="200"
                height="200"
                style={styles.qrCode}
              />
              <Text style={styles.qrText}>
                Your express entry code
              </Text>
              <Text style={{ ...styles.weatherText, textAlign: 'center', margin: '10px 0 0' }}>
                Show this at the door for priority check-in
              </Text>
            </Section>
            
            {/* Action Buttons */}
            <Section style={{ textAlign: 'center', margin: '40px 0' }}>
              <Button 
                href={`https://backroomleeds.com/bookings/${booking.id}`} 
                style={styles.button}
              >
                View Booking
              </Button>
              <Button 
                href="https://backroomleeds.com/contact" 
                style={{ ...styles.button, backgroundColor: 'transparent', border: '2px solid #D4AF37', color: '#D4AF37' }}
              >
                Contact Us
              </Button>
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

export default BookingReminderTemplate;