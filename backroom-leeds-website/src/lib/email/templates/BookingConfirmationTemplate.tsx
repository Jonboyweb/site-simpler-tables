/**
 * Booking Confirmation Email Template
 * 
 * Prohibition-themed email template for booking confirmations
 * with QR code and comprehensive booking details.
 * 
 * @module BookingConfirmationTemplate
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
import { format } from 'date-fns';

// ============================================================================
// Types
// ============================================================================

export interface BookingConfirmationProps {
  customerName: string;
  booking: {
    id: string;
    date: Date | string;
    timeSlot: string;
    tableName: string;
    floor: string;
    partySize: number;
    specialRequests?: string;
    totalAmount: number;
    depositPaid: number;
    remainingBalance: number;
  };
  qrCodeUrl: string;
  drinksPackage?: {
    name: string;
    price: number;
    description: string;
    includes: string[];
  };
  eventInfo?: {
    name: string;
    type: string;
    djLineup?: string[];
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
  artDecoSeparator: {
    borderTop: '2px solid #8B7355',
    borderBottom: '1px solid #8B7355',
    margin: '20px 0',
    height: '3px',
    backgroundColor: 'transparent',
    position: 'relative' as const
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
  sectionHeading: {
    color: '#8B7355',
    fontSize: '20px',
    fontFamily: 'Bebas Neue, Arial Black, sans-serif',
    letterSpacing: '1px',
    margin: '30px 0 15px',
    textTransform: 'uppercase' as const
  },
  bookingDetails: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #8B7355',
    borderRadius: '6px',
    padding: '25px',
    margin: '25px 0'
  },
  detailsRow: {
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
  packageSection: {
    backgroundColor: '#262626',
    border: '1px solid #D4AF37',
    borderRadius: '6px',
    padding: '20px',
    margin: '25px 0'
  },
  packageHeading: {
    color: '#D4AF37',
    fontSize: '22px',
    fontFamily: 'Bebas Neue, Arial Black, sans-serif',
    letterSpacing: '1px',
    margin: '0 0 10px',
    textAlign: 'center' as const
  },
  packagePrice: {
    color: '#D4C4A0',
    fontSize: '24px',
    fontWeight: '600',
    margin: '10px 0',
    textAlign: 'center' as const
  },
  packageDetails: {
    color: '#D4C4A0',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '15px 0'
  },
  packageIncludes: {
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
  policies: {
    backgroundColor: 'transparent',
    borderTop: '1px solid #8B7355',
    marginTop: '30px',
    paddingTop: '20px'
  },
  policyHeading: {
    color: '#8B7355',
    fontSize: '16px',
    fontFamily: 'Bebas Neue, Arial Black, sans-serif',
    letterSpacing: '1px',
    margin: '0 0 15px',
    textTransform: 'uppercase' as const
  },
  policyText: {
    color: '#D4C4A0',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '8px 0'
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
    margin: '30px auto',
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
  },
  socialLinks: {
    marginTop: '20px'
  },
  eventBadge: {
    backgroundColor: '#D4AF37',
    color: '#0d0d0d',
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.5px',
    padding: '4px 12px',
    borderRadius: '4px',
    textTransform: 'uppercase' as const,
    margin: '10px 0'
  }
};

// ============================================================================
// Template Component
// ============================================================================

export const BookingConfirmationTemplate: React.FC<BookingConfirmationProps> = ({
  customerName,
  booking,
  qrCodeUrl,
  drinksPackage,
  eventInfo
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
      
      <Preview>Your booking at The Backroom Leeds is confirmed for {format(bookingDate, 'EEEE, MMMM d')}</Preview>
      
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
            <Heading style={styles.heading}>
              Welcome to The Backroom, {customerName}
            </Heading>
            
            <Text style={styles.subheading}>
              Your reservation has been confirmed
            </Text>
            
            {/* Event Badge */}
            {eventInfo && (
              <div style={{ textAlign: 'center' }}>
                <span style={styles.eventBadge}>{eventInfo.name}</span>
              </div>
            )}
            
            {/* Booking Details */}
            <Section style={styles.bookingDetails}>
              <Row style={styles.detailsRow}>
                <Column>
                  <Text style={styles.label}>Date</Text>
                  <Text style={styles.largeValue}>
                    {format(bookingDate, 'EEEE, MMMM d, yyyy')}
                  </Text>
                </Column>
              </Row>
              
              <Row style={styles.detailsRow}>
                <Column>
                  <Text style={styles.label}>Time</Text>
                  <Text style={styles.value}>{booking.timeSlot}</Text>
                </Column>
                <Column>
                  <Text style={styles.label}>Party Size</Text>
                  <Text style={styles.value}>{booking.partySize} guests</Text>
                </Column>
              </Row>
              
              <Row style={styles.detailsRow}>
                <Column>
                  <Text style={styles.label}>Table</Text>
                  <Text style={styles.value}>{booking.tableName}</Text>
                </Column>
                <Column>
                  <Text style={styles.label}>Floor</Text>
                  <Text style={styles.value}>{booking.floor}</Text>
                </Column>
              </Row>
              
              {booking.specialRequests && (
                <Row style={styles.detailsRow}>
                  <Column>
                    <Text style={styles.label}>Special Requests</Text>
                    <Text style={styles.value}>{booking.specialRequests}</Text>
                  </Column>
                </Row>
              )}
              
              <Hr style={styles.artDecoSeparator} />
              
              <Row style={styles.detailsRow}>
                <Column>
                  <Text style={styles.label}>Deposit Paid</Text>
                  <Text style={styles.value}>£{booking.depositPaid}</Text>
                </Column>
                <Column>
                  <Text style={styles.label}>Remaining Balance</Text>
                  <Text style={styles.largeValue}>£{booking.remainingBalance}</Text>
                </Column>
              </Row>
            </Section>
            
            {/* Drinks Package */}
            {drinksPackage && (
              <Section style={styles.packageSection}>
                <Heading as="h3" style={styles.packageHeading}>
                  {drinksPackage.name}
                </Heading>
                <Text style={styles.packagePrice}>
                  £{drinksPackage.price} total
                </Text>
                <Text style={styles.packageDetails}>
                  {drinksPackage.description}
                </Text>
                {drinksPackage.includes.length > 0 && (
                  <>
                    <Text style={styles.label}>Package Includes:</Text>
                    {drinksPackage.includes.map((item, index) => (
                      <Text key={index} style={styles.packageIncludes}>
                        • {item}
                      </Text>
                    ))}
                  </>
                )}
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
                Show this code at the door for express entry
              </Text>
            </Section>
            
            {/* Important Information */}
            <Section style={styles.policies}>
              <Heading as="h4" style={styles.policyHeading}>
                Important Information
              </Heading>
              <Text style={styles.policyText}>
                • Dress code: Smart casual (no sportswear or trainers)
              </Text>
              <Text style={styles.policyText}>
                • Tables are held for 15 minutes past booking time
              </Text>
              <Text style={styles.policyText}>
                • Cancellations must be made 48 hours in advance for refund eligibility
              </Text>
              <Text style={styles.policyText}>
                • Remaining balance of £{booking.remainingBalance} is due on arrival
              </Text>
              <Text style={styles.policyText}>
                • Challenge 21 policy - please bring valid ID
              </Text>
            </Section>
            
            {/* CTA Button */}
            <Section style={{ textAlign: 'center' }}>
              <Button 
                href={`https://backroomleeds.com/bookings/${booking.id}`} 
                style={styles.button}
              >
                View Your Booking
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
            
            <Section style={styles.socialLinks}>
              <Link 
                href="https://instagram.com/backroomleeds" 
                style={{ ...styles.footerLink, marginRight: '20px' }}
              >
                Instagram
              </Link>
              <Link 
                href="https://facebook.com/backroomleeds" 
                style={styles.footerLink}
              >
                Facebook
              </Link>
            </Section>
            
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

export default BookingConfirmationTemplate;