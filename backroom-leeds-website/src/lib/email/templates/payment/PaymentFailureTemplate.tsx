/**
 * Payment Failure Email Template
 * 
 * Prohibition-themed email template for failed payment notifications
 * with retry instructions and support information.
 * 
 * @module PaymentFailureTemplate
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

export interface PaymentFailureProps {
  customerName: string;
  booking: {
    id: string;
    date: Date | string;
    timeSlot: string;
    tableName: string;
    floor: string;
    partySize: number;
  };
  payment: {
    id: string;
    type: 'deposit' | 'balance' | 'full_payment' | 'drinks_package';
    attemptedAmount: number;
    currency: string;
    method?: string;
    last4?: string;
    failedAt: Date | string;
    errorCode?: string;
    errorMessage: string;
    retryUrl: string;
  };
  totals: {
    originalAmount: number;
    totalPaid: number;
    remainingBalance: number;
  };
  urgency: {
    isUrgent: boolean;
    hoursUntilBooking?: number;
    deadlineDate?: Date | string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
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
  failureBadge: {
    backgroundColor: '#F44336',
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
  urgentBadge: {
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
  failureNotice: {
    backgroundColor: '#3a1a1a',
    border: '2px solid #F44336',
    borderRadius: '6px',
    padding: '30px',
    margin: '30px 0',
    textAlign: 'center' as const
  },
  failureIcon: {
    color: '#F44336',
    fontSize: '48px',
    margin: '0 0 20px'
  },
  failureHeading: {
    color: '#F44336',
    fontSize: '24px',
    fontFamily: 'Bebas Neue, Arial Black, sans-serif',
    letterSpacing: '1px',
    margin: '0 0 15px',
    textTransform: 'uppercase' as const
  },
  failureText: {
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
  urgencyText: {
    color: '#D4C4A0',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '10px 0',
    textAlign: 'center' as const
  },
  countdown: {
    color: '#FF5722',
    fontSize: '32px',
    fontWeight: '600',
    margin: '20px 0',
    textAlign: 'center' as const
  },
  errorDetails: {
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
  errorValue: {
    color: '#F44336',
    fontSize: '14px',
    fontFamily: 'monospace',
    backgroundColor: '#262626',
    padding: '8px 12px',
    borderRadius: '4px',
    margin: '0'
  },
  solutionsSection: {
    backgroundColor: '#1a1a2e',
    border: '1px solid #D4AF37',
    borderRadius: '6px',
    padding: '25px',
    margin: '25px 0'
  },
  solutionItem: {
    color: '#D4C4A0',
    fontSize: '14px',
    lineHeight: '1.8',
    margin: '10px 0',
    paddingLeft: '25px',
    position: 'relative' as const
  },
  solutionIcon: {
    color: '#D4AF37',
    position: 'absolute' as const,
    left: '0px',
    top: '2px'
  },
  paymentSummary: {
    backgroundColor: '#262626',
    border: '1px solid #8B7355',
    borderRadius: '6px',
    padding: '25px',
    margin: '25px 0'
  },
  artDecoSeparator: {
    borderTop: '2px solid #8B7355',
    borderBottom: '1px solid #8B7355',
    margin: '20px 0',
    height: '3px',
    backgroundColor: 'transparent'
  },
  retryButton: {
    backgroundColor: '#D4AF37',
    borderRadius: '6px',
    color: '#0d0d0d',
    display: 'inline-block',
    fontSize: '18px',
    fontWeight: '600',
    letterSpacing: '0.5px',
    padding: '16px 40px',
    textDecoration: 'none',
    textTransform: 'uppercase' as const,
    margin: '20px auto',
    textAlign: 'center' as const
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
  contactSection: {
    backgroundColor: 'transparent',
    borderTop: '1px solid #8B7355',
    marginTop: '30px',
    paddingTop: '20px'
  },
  contactHeading: {
    color: '#8B7355',
    fontSize: '16px',
    fontFamily: 'Bebas Neue, Arial Black, sans-serif',
    letterSpacing: '1px',
    margin: '0 0 15px',
    textTransform: 'uppercase' as const
  },
  contactText: {
    color: '#D4C4A0',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '8px 0'
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

const getPaymentTypeLabel = (type: string): string => {
  switch (type) {
    case 'deposit':
      return 'Table Deposit';
    case 'balance':
      return 'Remaining Balance';
    case 'full_payment':
      return 'Full Payment';
    case 'drinks_package':
      return 'Drinks Package';
    default:
      return 'Payment';
  }
};

const getUrgencyMessage = (riskLevel: string, hoursUntilBooking?: number): { title: string; message: string } => {
  if (riskLevel === 'critical') {
    return {
      title: 'Immediate Action Required',
      message: `Your booking is in ${hoursUntilBooking} hours and requires payment to be confirmed.`
    };
  } else if (riskLevel === 'high') {
    return {
      title: 'Urgent Payment Required',
      message: `Your booking is soon and payment is needed to secure your table.`
    };
  } else if (riskLevel === 'medium') {
    return {
      title: 'Payment Needed',
      message: 'Please complete your payment to confirm your booking.'
    };
  } else {
    return {
      title: 'Payment Failed',
      message: 'We were unable to process your payment. Please try again.'
    };
  }
};

const getFailureReasons = (errorCode?: string): string[] => {
  const commonReasons = [
    'Check that your card details are correct',
    'Ensure you have sufficient funds available',
    'Contact your bank if the issue persists',
    'Try a different payment method'
  ];

  if (errorCode) {
    switch (errorCode) {
      case 'insufficient_funds':
        return [
          'Your card has insufficient funds',
          'Try a different card or payment method',
          'Contact your bank for assistance'
        ];
      case 'card_declined':
        return [
          'Your card was declined by your bank',
          'Check with your bank about the transaction',
          'Try a different card or payment method'
        ];
      case 'expired_card':
        return [
          'Your card has expired',
          'Please use a current, valid card',
          'Update your payment method'
        ];
      default:
        return commonReasons;
    }
  }

  return commonReasons;
};

// ============================================================================
// Template Component
// ============================================================================

export const PaymentFailureTemplate: React.FC<PaymentFailureProps> = ({
  customerName,
  booking,
  payment,
  totals,
  urgency
}) => {
  const bookingDate = typeof booking.date === 'string' 
    ? new Date(booking.date) 
    : booking.date;

  const failedAt = typeof payment.failedAt === 'string'
    ? new Date(payment.failedAt)
    : payment.failedAt;

  const urgencyInfo = getUrgencyMessage(urgency.riskLevel, urgency.hoursUntilBooking);
  const failureReasons = getFailureReasons(payment.errorCode);

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
      
      <Preview>Payment failed for your booking on {format(bookingDate, 'MMMM d')} - Action required</Preview>
      
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
              <span style={styles.failureBadge}>Payment Failed</span>
              {urgency.isUrgent && (
                <span style={styles.urgentBadge}>Urgent</span>
              )}
            </div>
            
            <Heading style={styles.heading}>
              Payment Issue, {customerName}
            </Heading>
            
            <Text style={styles.subheading}>
              We couldn't process your payment
            </Text>
            
            {/* Failure Notice */}
            <Section style={styles.failureNotice}>
              <div style={styles.failureIcon}>⚠️</div>
              <Heading as="h3" style={styles.failureHeading}>
                Payment Unsuccessful
              </Heading>
              <Text style={styles.failureText}>
                We were unable to process your {getPaymentTypeLabel(payment.type).toLowerCase()} 
                of £{payment.attemptedAmount.toFixed(2)} for your booking.
              </Text>
              <Text style={styles.failureText}>
                <strong>Error:</strong> {payment.errorMessage}
              </Text>
            </Section>
            
            {/* Urgency Warning */}
            {urgency.isUrgent && (
              <Section style={styles.urgencySection}>
                <Heading as="h4" style={styles.urgencyHeading}>
                  {urgencyInfo.title}
                </Heading>
                {urgency.hoursUntilBooking && urgency.hoursUntilBooking <= 48 && (
                  <div style={styles.countdown}>
                    {urgency.hoursUntilBooking} hours until your booking
                  </div>
                )}
                <Text style={styles.urgencyText}>
                  {urgencyInfo.message}
                </Text>
                {urgency.deadlineDate && (
                  <Text style={styles.urgencyText}>
                    <strong>Payment deadline:</strong> {format(new Date(urgency.deadlineDate), 'dd/MM/yyyy HH:mm')}
                  </Text>
                )}
              </Section>
            )}
            
            {/* Error Details */}
            <Section style={styles.errorDetails}>
              <Heading as="h4" style={styles.sectionHeading}>
                Payment Attempt Details
              </Heading>
              
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.label}>Attempted Amount</Text>
                  <Text style={styles.value}>£{payment.attemptedAmount.toFixed(2)}</Text>
                </Column>
                <Column>
                  <Text style={styles.label}>Payment Type</Text>
                  <Text style={styles.value}>{getPaymentTypeLabel(payment.type)}</Text>
                </Column>
              </Row>
              
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.label}>Failed At</Text>
                  <Text style={styles.value}>
                    {format(failedAt, 'dd/MM/yyyy HH:mm')}
                  </Text>
                </Column>
                <Column>
                  <Text style={styles.label}>Payment Method</Text>
                  <Text style={styles.value}>
                    {payment.method && payment.last4 
                      ? `Card ending in ${payment.last4}`
                      : payment.method || 'Not specified'
                    }
                  </Text>
                </Column>
              </Row>
              
              {payment.errorCode && (
                <Row style={styles.detailRow}>
                  <Column>
                    <Text style={styles.label}>Error Code</Text>
                    <Text style={styles.errorValue}>{payment.errorCode}</Text>
                  </Column>
                </Row>
              )}
            </Section>
            
            {/* Solutions */}
            <Section style={styles.solutionsSection}>
              <Heading as="h4" style={styles.sectionHeading}>
                How to Fix This
              </Heading>
              
              {failureReasons.map((reason, index) => (
                <div key={index} style={styles.solutionItem}>
                  <span style={styles.solutionIcon}>•</span>
                  {reason}
                </div>
              ))}
            </Section>
            
            {/* Payment Summary */}
            <Section style={styles.paymentSummary}>
              <Heading as="h4" style={styles.sectionHeading}>
                Booking Payment Status
              </Heading>
              
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.label}>Booking Total</Text>
                  <Text style={styles.value}>£{totals.originalAmount.toFixed(2)}</Text>
                </Column>
                <Column>
                  <Text style={styles.label}>Paid So Far</Text>
                  <Text style={styles.value}>£{totals.totalPaid.toFixed(2)}</Text>
                </Column>
              </Row>
              
              <Hr style={styles.artDecoSeparator} />
              
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.label}>Outstanding Amount</Text>
                  <Text style={{ ...styles.value, color: '#F44336', fontSize: '20px', fontWeight: '600' }}>
                    £{totals.remainingBalance.toFixed(2)}
                  </Text>
                </Column>
              </Row>
            </Section>
            
            {/* Retry Payment CTA */}
            <Section style={{ textAlign: 'center', margin: '40px 0' }}>
              <Text style={{ ...styles.failureText, fontSize: '18px', marginBottom: '25px' }}>
                Don't worry - you can try your payment again now
              </Text>
              
              <Button 
                href={payment.retryUrl} 
                style={styles.retryButton}
              >
                Retry Payment Now
              </Button>
              
              <div style={{ margin: '20px 0' }}>
                <Button 
                  href={`https://backroomleeds.com/bookings/${booking.id}`} 
                  style={styles.secondaryButton}
                >
                  View Booking
                </Button>
                
                <Button 
                  href="https://backroomleeds.com/contact" 
                  style={styles.secondaryButton}
                >
                  Get Help
                </Button>
              </div>
            </Section>
            
            {/* Booking Details */}
            <Section style={styles.errorDetails}>
              <Heading as="h4" style={styles.sectionHeading}>
                Your Booking Details
              </Heading>
              
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.label}>Date</Text>
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
            </Section>
            
            {/* Contact Support */}
            <Section style={styles.contactSection}>
              <Heading as="h4" style={styles.contactHeading}>
                Need Help?
              </Heading>
              <Text style={styles.contactText}>
                If you're having trouble with payment, our team is here to help.
              </Text>
              <Text style={styles.contactText}>
                • Call us directly at 0113 245 1234
              </Text>
              <Text style={styles.contactText}>
                • Email us at bookings@backroomleeds.com
              </Text>
              <Text style={styles.contactText}>
                • Use the live chat on our website
              </Text>
              <Text style={styles.contactText}>
                Quote your booking reference: {booking.id}
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

export default PaymentFailureTemplate;