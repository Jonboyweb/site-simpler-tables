/**
 * Cancellation Confirmation Email Template
 * 
 * Prohibition-themed email template for booking cancellations
 * with refund information and policy details.
 * 
 * @module CancellationConfirmationTemplate
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

export interface CancellationConfirmationProps {
  customerName: string;
  booking: {
    id: string;
    date: Date | string;
    timeSlot: string;
    tableName: string;
    floor: string;
    partySize: number;
    originalAmount: number;
    depositPaid: number;
  };
  refund: {
    eligible: boolean;
    amount: number;
    reason?: string;
    processedAt?: Date;
    estimatedRefundDate?: Date;
    refundReference?: string;
  };
  cancellation: {
    cancelledAt: Date;
    hoursBeforeEvent: number;
    reason?: string;
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
  cancellationNotice: {
    backgroundColor: '#262626',
    border: '2px solid #D4AF37',
    borderRadius: '6px',
    padding: '30px',
    margin: '30px 0',
    textAlign: 'center' as const
  },
  noticeIcon: {
    color: '#D4AF37',
    fontSize: '48px',
    margin: '0 0 20px'
  },
  noticeHeading: {
    color: '#D4AF37',
    fontSize: '24px',
    fontFamily: 'Bebas Neue, Arial Black, sans-serif',
    letterSpacing: '1px',
    margin: '0 0 15px',
    textTransform: 'uppercase' as const
  },
  noticeText: {
    color: '#D4C4A0',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '10px 0'
  },
  detailsSection: {
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
  refundSection: {
    backgroundColor: '#1a3a1a',
    border: '2px solid #4CAF50',
    borderRadius: '6px',
    padding: '25px',
    margin: '25px 0'
  },
  noRefundSection: {
    backgroundColor: '#3a1a1a',
    border: '2px solid #F44336',
    borderRadius: '6px',
    padding: '25px',
    margin: '25px 0'
  },
  refundHeading: {
    color: '#4CAF50',
    fontSize: '22px',
    fontFamily: 'Bebas Neue, Arial Black, sans-serif',
    letterSpacing: '1px',
    margin: '0 0 15px',
    textAlign: 'center' as const
  },
  noRefundHeading: {
    color: '#F44336',
    fontSize: '22px',
    fontFamily: 'Bebas Neue, Arial Black, sans-serif',
    letterSpacing: '1px',
    margin: '0 0 15px',
    textAlign: 'center' as const
  },
  refundAmount: {
    color: '#4CAF50',
    fontSize: '32px',
    fontWeight: '600',
    margin: '10px 0',
    textAlign: 'center' as const
  },
  artDecoSeparator: {
    borderTop: '2px solid #8B7355',
    borderBottom: '1px solid #8B7355',
    margin: '20px 0',
    height: '3px',
    backgroundColor: 'transparent'
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
  }
};

// ============================================================================
// Template Component
// ============================================================================

export const CancellationConfirmationTemplate: React.FC<CancellationConfirmationProps> = ({
  customerName,
  booking,
  refund,
  cancellation
}) => {
  const bookingDate = typeof booking.date === 'string' 
    ? new Date(booking.date) 
    : booking.date;

  const cancellationDate = typeof cancellation.cancelledAt === 'string'
    ? new Date(cancellation.cancelledAt)
    : cancellation.cancelledAt;

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
      
      <Preview>Your booking cancellation for {format(bookingDate, 'EEEE, MMMM d')} has been processed</Preview>
      
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
              Booking Cancelled
            </Heading>
            
            <Text style={styles.subheading}>
              We're sorry to see you go, {customerName}
            </Text>
            
            {/* Cancellation Notice */}
            <Section style={styles.cancellationNotice}>
              <div style={styles.noticeIcon}>⚠️</div>
              <Heading as="h3" style={styles.noticeHeading}>
                Cancellation Confirmed
              </Heading>
              <Text style={styles.noticeText}>
                Your booking for {format(bookingDate, 'EEEE, MMMM d, yyyy')} has been successfully cancelled.
              </Text>
              <Text style={styles.noticeText}>
                Cancelled {cancellation.hoursBeforeEvent} hours before your scheduled arrival.
              </Text>
            </Section>
            
            {/* Booking Details */}
            <Section style={styles.detailsSection}>
              <Heading as="h4" style={styles.sectionHeading}>
                Cancelled Booking Details
              </Heading>
              
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.label}>Booking Reference</Text>
                  <Text style={styles.value}>{booking.id}</Text>
                </Column>
              </Row>
              
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.label}>Original Date</Text>
                  <Text style={styles.value}>
                    {format(bookingDate, 'EEEE, MMMM d, yyyy')}
                  </Text>
                </Column>
                <Column>
                  <Text style={styles.label}>Time</Text>
                  <Text style={styles.value}>{booking.timeSlot}</Text>
                </Column>
              </Row>
              
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.label}>Table</Text>
                  <Text style={styles.value}>{booking.tableName}</Text>
                </Column>
                <Column>
                  <Text style={styles.label}>Party Size</Text>
                  <Text style={styles.value}>{booking.partySize} guests</Text>
                </Column>
              </Row>
              
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.label}>Cancellation Date</Text>
                  <Text style={styles.value}>
                    {format(cancellationDate, 'dd/MM/yyyy HH:mm')}
                  </Text>
                </Column>
              </Row>
              
              {cancellation.reason && (
                <Row style={styles.detailRow}>
                  <Column>
                    <Text style={styles.label}>Cancellation Reason</Text>
                    <Text style={styles.value}>{cancellation.reason}</Text>
                  </Column>
                </Row>
              )}
            </Section>
            
            {/* Refund Information */}
            {refund.eligible ? (
              <Section style={styles.refundSection}>
                <Heading as="h4" style={styles.refundHeading}>
                  Refund Confirmed
                </Heading>
                <Text style={styles.refundAmount}>
                  £{refund.amount.toFixed(2)}
                </Text>
                <Text style={styles.noticeText}>
                  Your refund has been processed and will appear in your account within 3-5 business days.
                </Text>
                {refund.refundReference && (
                  <Text style={styles.noticeText}>
                    <strong>Refund Reference:</strong> {refund.refundReference}
                  </Text>
                )}
                {refund.estimatedRefundDate && (
                  <Text style={styles.noticeText}>
                    <strong>Expected in account:</strong> {format(refund.estimatedRefundDate, 'dd/MM/yyyy')}
                  </Text>
                )}
              </Section>
            ) : (
              <Section style={styles.noRefundSection}>
                <Heading as="h4" style={styles.noRefundHeading}>
                  No Refund Available
                </Heading>
                <Text style={styles.noticeText}>
                  Unfortunately, your booking was cancelled within 48 hours of the event and is not eligible for a refund according to our cancellation policy.
                </Text>
                {refund.reason && (
                  <Text style={styles.noticeText}>
                    <strong>Reason:</strong> {refund.reason}
                  </Text>
                )}
              </Section>
            )}
            
            {/* Payment Summary */}
            <Section style={styles.detailsSection}>
              <Heading as="h4" style={styles.sectionHeading}>
                Payment Summary
              </Heading>
              
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.label}>Original Booking Amount</Text>
                  <Text style={styles.value}>£{booking.originalAmount.toFixed(2)}</Text>
                </Column>
                <Column>
                  <Text style={styles.label}>Deposit Paid</Text>
                  <Text style={styles.value}>£{booking.depositPaid.toFixed(2)}</Text>
                </Column>
              </Row>
              
              <Hr style={styles.artDecoSeparator} />
              
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.label}>Refund Amount</Text>
                  <Text style={styles.largeValue}>£{refund.amount.toFixed(2)}</Text>
                </Column>
              </Row>
            </Section>
            
            {/* Rebooking CTA */}
            <Section style={{ textAlign: 'center', margin: '40px 0' }}>
              <Text style={{ ...styles.noticeText, fontSize: '18px', marginBottom: '20px' }}>
                We'd love to welcome you back another time
              </Text>
              <Button 
                href="https://backroomleeds.com/book" 
                style={styles.button}
              >
                Book Another Table
              </Button>
            </Section>
            
            {/* Important Information */}
            <Section style={styles.policies}>
              <Heading as="h4" style={styles.policyHeading}>
                Cancellation Policy
              </Heading>
              <Text style={styles.policyText}>
                • Cancellations made 48+ hours before your booking are eligible for a full refund
              </Text>
              <Text style={styles.policyText}>
                • Cancellations made within 48 hours are not eligible for refunds
              </Text>
              <Text style={styles.policyText}>
                • Refunds are processed within 3-5 business days to your original payment method
              </Text>
              <Text style={styles.policyText}>
                • For questions about your cancellation, please contact our team
              </Text>
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

export default CancellationConfirmationTemplate;