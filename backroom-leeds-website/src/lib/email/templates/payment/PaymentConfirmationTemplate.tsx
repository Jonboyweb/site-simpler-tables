/**
 * Payment Confirmation Email Template
 * 
 * Prohibition-themed email template for successful payment confirmations
 * with transaction details and booking information.
 * 
 * @module PaymentConfirmationTemplate
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

export interface PaymentConfirmationProps {
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
    amount: number;
    currency: string;
    method: string;
    last4?: string;
    processedAt: Date | string;
    transactionId: string;
    receiptUrl?: string;
  };
  totals: {
    originalAmount: number;
    totalPaid: number;
    remainingBalance: number;
    drinksPackageAmount?: number;
  };
  drinksPackage?: {
    name: string;
    description: string;
    items: string[];
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
  successBadge: {
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
  paymentSummary: {
    backgroundColor: '#1a3a1a',
    border: '2px solid #4CAF50',
    borderRadius: '6px',
    padding: '30px',
    margin: '30px 0',
    textAlign: 'center' as const
  },
  paymentHeading: {
    color: '#4CAF50',
    fontSize: '24px',
    fontFamily: 'Bebas Neue, Arial Black, sans-serif',
    letterSpacing: '1px',
    margin: '0 0 15px',
    textTransform: 'uppercase' as const
  },
  paymentAmount: {
    color: '#4CAF50',
    fontSize: '48px',
    fontWeight: '600',
    margin: '20px 0',
    textAlign: 'center' as const
  },
  paymentType: {
    color: '#D4C4A0',
    fontSize: '16px',
    margin: '10px 0',
    textTransform: 'capitalize' as const
  },
  transactionDetails: {
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
  bookingDetails: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #8B7355',
    borderRadius: '6px',
    padding: '25px',
    margin: '25px 0'
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
  packageItem: {
    color: '#D4C4A0',
    fontSize: '14px',
    lineHeight: '1.8',
    margin: '5px 0 5px 20px'
  },
  balanceSummary: {
    backgroundColor: '#2e2e1a',
    border: '2px solid #D4AF37',
    borderRadius: '6px',
    padding: '25px',
    margin: '25px 0'
  },
  balanceHeading: {
    color: '#D4AF37',
    fontSize: '22px',
    fontFamily: 'Bebas Neue, Arial Black, sans-serif',
    letterSpacing: '1px',
    margin: '0 0 15px',
    textAlign: 'center' as const
  },
  artDecoSeparator: {
    borderTop: '2px solid #8B7355',
    borderBottom: '1px solid #8B7355',
    margin: '20px 0',
    height: '3px',
    backgroundColor: 'transparent'
  },
  receipt: {
    backgroundColor: 'transparent',
    borderTop: '1px solid #8B7355',
    borderBottom: '1px solid #8B7355',
    padding: '20px 0',
    margin: '30px 0'
  },
  receiptItem: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '10px 0',
    padding: '5px 0',
    borderBottom: '1px dotted #8B7355'
  },
  receiptLabel: {
    color: '#D4C4A0',
    fontSize: '14px'
  },
  receiptAmount: {
    color: '#D4C4A0',
    fontSize: '14px',
    fontWeight: '600'
  },
  receiptTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '20px 0 0',
    padding: '15px 0 0',
    borderTop: '2px solid #D4AF37'
  },
  receiptTotalLabel: {
    color: '#D4AF37',
    fontSize: '18px',
    fontWeight: '600'
  },
  receiptTotalAmount: {
    color: '#D4AF37',
    fontSize: '18px',
    fontWeight: '600'
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

const getPaymentMethodDisplay = (method: string, last4?: string): string => {
  if (method === 'card' && last4) {
    return `Card ending in ${last4}`;
  } else if (method === 'bank_transfer') {
    return 'Bank Transfer';
  } else if (method === 'apple_pay') {
    return 'Apple Pay';
  } else if (method === 'google_pay') {
    return 'Google Pay';
  }
  return method;
};

// ============================================================================
// Template Component
// ============================================================================

export const PaymentConfirmationTemplate: React.FC<PaymentConfirmationProps> = ({
  customerName,
  booking,
  payment,
  totals,
  drinksPackage
}) => {
  const bookingDate = typeof booking.date === 'string' 
    ? new Date(booking.date) 
    : booking.date;

  const processedAt = typeof payment.processedAt === 'string'
    ? new Date(payment.processedAt)
    : payment.processedAt;

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
      
      <Preview>Payment confirmation: £{payment.amount} for your booking on {format(bookingDate, 'MMMM d')}</Preview>
      
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
              <span style={styles.successBadge}>Payment Successful</span>
            </div>
            
            <Heading style={styles.heading}>
              Thank You, {customerName}
            </Heading>
            
            <Text style={styles.subheading}>
              Your payment has been processed successfully
            </Text>
            
            {/* Payment Summary */}
            <Section style={styles.paymentSummary}>
              <Heading as="h3" style={styles.paymentHeading}>
                {getPaymentTypeLabel(payment.type)}
              </Heading>
              <div style={styles.paymentAmount}>
                {payment.currency.toUpperCase()} {payment.amount.toFixed(2)}
              </div>
              <Text style={styles.paymentType}>
                {getPaymentTypeLabel(payment.type)} Confirmed
              </Text>
            </Section>
            
            {/* Transaction Details */}
            <Section style={styles.transactionDetails}>
              <Heading as="h4" style={styles.sectionHeading}>
                Transaction Details
              </Heading>
              
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.label}>Transaction ID</Text>
                  <Text style={styles.value}>{payment.transactionId}</Text>
                </Column>
                <Column>
                  <Text style={styles.label}>Payment ID</Text>
                  <Text style={styles.value}>{payment.id}</Text>
                </Column>
              </Row>
              
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.label}>Payment Method</Text>
                  <Text style={styles.value}>
                    {getPaymentMethodDisplay(payment.method, payment.last4)}
                  </Text>
                </Column>
                <Column>
                  <Text style={styles.label}>Processed At</Text>
                  <Text style={styles.value}>
                    {format(processedAt, 'dd/MM/yyyy HH:mm')}
                  </Text>
                </Column>
              </Row>
            </Section>
            
            {/* Booking Details */}
            <Section style={styles.bookingDetails}>
              <Heading as="h4" style={styles.sectionHeading}>
                Booking Details
              </Heading>
              
              <Row style={styles.detailRow}>
                <Column>
                  <Text style={styles.label}>Booking Reference</Text>
                  <Text style={styles.value}>{booking.id}</Text>
                </Column>
              </Row>
              
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
            
            {/* Drinks Package Details */}
            {drinksPackage && payment.type === 'drinks_package' && (
              <Section style={styles.packageSection}>
                <Heading as="h3" style={styles.packageHeading}>
                  {drinksPackage.name}
                </Heading>
                <Text style={{ ...styles.value, textAlign: 'center', margin: '15px 0' }}>
                  {drinksPackage.description}
                </Text>
                <Text style={styles.label}>Package Includes:</Text>
                {drinksPackage.items.map((item, index) => (
                  <Text key={index} style={styles.packageItem}>
                    • {item}
                  </Text>
                ))}
              </Section>
            )}
            
            {/* Payment Receipt */}
            <Section style={styles.receipt}>
              <Heading as="h4" style={styles.sectionHeading}>
                Payment Receipt
              </Heading>
              
              <div style={styles.receiptItem}>
                <span style={styles.receiptLabel}>Booking Total</span>
                <span style={styles.receiptAmount}>£{totals.originalAmount.toFixed(2)}</span>
              </div>
              
              {totals.drinksPackageAmount && (
                <div style={styles.receiptItem}>
                  <span style={styles.receiptLabel}>Drinks Package</span>
                  <span style={styles.receiptAmount}>£{totals.drinksPackageAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div style={styles.receiptItem}>
                <span style={styles.receiptLabel}>This Payment ({getPaymentTypeLabel(payment.type)})</span>
                <span style={styles.receiptAmount}>£{payment.amount.toFixed(2)}</span>
              </div>
              
              <Hr style={styles.artDecoSeparator} />
              
              <div style={styles.receiptItem}>
                <span style={styles.receiptLabel}>Total Paid</span>
                <span style={styles.receiptAmount}>£{totals.totalPaid.toFixed(2)}</span>
              </div>
              
              <div style={styles.receiptTotal}>
                <span style={styles.receiptTotalLabel}>Remaining Balance</span>
                <span style={styles.receiptTotalAmount}>£{totals.remainingBalance.toFixed(2)}</span>
              </div>
            </Section>
            
            {/* Balance Information */}
            {totals.remainingBalance > 0 && (
              <Section style={styles.balanceSummary}>
                <Heading as="h4" style={styles.balanceHeading}>
                  Outstanding Balance
                </Heading>
                <Text style={{ ...styles.paymentType, textAlign: 'center' }}>
                  £{totals.remainingBalance.toFixed(2)} remaining due on arrival
                </Text>
                <Text style={{ ...styles.value, textAlign: 'center', fontSize: '14px', margin: '15px 0' }}>
                  You can pay the remaining balance when you arrive at the venue, or complete your payment online.
                </Text>
              </Section>
            )}
            
            {totals.remainingBalance === 0 && (
              <Section style={{ ...styles.paymentSummary, backgroundColor: '#1a3a1a' }}>
                <Heading as="h4" style={styles.paymentHeading}>
                  Payment Complete
                </Heading>
                <Text style={styles.paymentType}>
                  Your booking is fully paid - just arrive and enjoy!
                </Text>
              </Section>
            )}
            
            {/* Action Buttons */}
            <Section style={{ textAlign: 'center', margin: '40px 0' }}>
              <Button 
                href={`https://backroomleeds.com/bookings/${booking.id}`} 
                style={styles.button}
              >
                View Booking
              </Button>
              
              {payment.receiptUrl && (
                <Button 
                  href={payment.receiptUrl} 
                  style={{ ...styles.button, backgroundColor: 'transparent', border: '2px solid #D4AF37', color: '#D4AF37' }}
                >
                  Download Receipt
                </Button>
              )}
              
              {totals.remainingBalance > 0 && (
                <Button 
                  href={`https://backroomleeds.com/bookings/${booking.id}/payment`} 
                  style={styles.button}
                >
                  Complete Payment
                </Button>
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

export default PaymentConfirmationTemplate;