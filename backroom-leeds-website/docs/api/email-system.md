# Email Notification System API Documentation
## The Backroom Leeds - Phase 3, Step 3.6

### Version: 1.0.0
### Base URL: `https://api.backroomleeds.com/v1`

---

## Overview

The Email Notification System API provides comprehensive email management capabilities for The Backroom Leeds, including transactional emails, marketing campaigns, and customer preference management. All endpoints require authentication except for tracking endpoints.

### Authentication

All API endpoints (except tracking) require Bearer token authentication:

```http
Authorization: Bearer <access_token>
```

### Rate Limiting

- **Standard endpoints**: 100 requests per minute
- **Batch endpoints**: 10 requests per minute
- **Tracking endpoints**: 1000 requests per minute

---

## Email Management Endpoints

### Send Email

Send a single email using a template.

**Endpoint:** `POST /api/email/send`

**Request:**
```json
{
  "template": "booking_confirmation",
  "recipient": {
    "email": "customer@example.com",
    "name": "John Doe"
  },
  "data": {
    "bookingId": "book_123456",
    "date": "2024-03-15",
    "timeSlot": "20:00 - 22:00",
    "tableName": "Table 5",
    "partySize": 4
  },
  "priority": "critical",
  "scheduledAt": "2024-03-15T10:00:00Z",
  "metadata": {
    "source": "web_booking",
    "userId": "user_789"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_abc123xyz",
    "status": "queued",
    "provider": "resend",
    "queuedAt": "2024-03-15T09:30:00Z",
    "scheduledAt": "2024-03-15T10:00:00Z",
    "estimatedDelivery": "2024-03-15T10:00:30Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TEMPLATE",
    "message": "Template 'booking_confirmation' not found or inactive",
    "details": {
      "availableTemplates": ["booking_confirmation_v2", "booking_reminder"]
    }
  }
}
```

---

### Batch Send

Send multiple emails efficiently.

**Endpoint:** `POST /api/email/batch`

**Request:**
```json
{
  "template": "event_announcement",
  "recipients": [
    {
      "email": "customer1@example.com",
      "name": "John Doe",
      "data": {
        "vipStatus": true
      }
    },
    {
      "email": "customer2@example.com",
      "name": "Jane Smith",
      "data": {
        "vipStatus": false
      }
    }
  ],
  "baseData": {
    "eventName": "LA FIESTA",
    "eventDate": "2024-03-20",
    "specialOffer": "20% off drinks packages"
  },
  "priority": "normal",
  "stagger": true,
  "staggerDelay": 100
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "batchId": "batch_xyz789",
    "totalRecipients": 2,
    "queued": 2,
    "rejected": 0,
    "status": "processing",
    "estimatedCompletion": "2024-03-15T10:05:00Z"
  }
}
```

---

### Get Email Status

Check the status of a sent email.

**Endpoint:** `GET /api/email/status/{messageId}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_abc123xyz",
    "status": "delivered",
    "recipient": "customer@example.com",
    "template": "booking_confirmation",
    "provider": "resend",
    "timeline": [
      {
        "status": "queued",
        "timestamp": "2024-03-15T10:00:00Z"
      },
      {
        "status": "sent",
        "timestamp": "2024-03-15T10:00:05Z",
        "provider": "resend"
      },
      {
        "status": "delivered",
        "timestamp": "2024-03-15T10:00:08Z"
      },
      {
        "status": "opened",
        "timestamp": "2024-03-15T10:05:30Z",
        "metadata": {
          "emailClient": "Gmail",
          "deviceType": "mobile"
        }
      }
    ],
    "engagement": {
      "opened": true,
      "openCount": 3,
      "clicked": true,
      "clickCount": 1,
      "clickedLinks": ["https://backroomleeds.com/bookings/book_123456"]
    }
  }
}
```

---

### Cancel Scheduled Email

Cancel a scheduled email that hasn't been sent yet.

**Endpoint:** `DELETE /api/email/scheduled/{jobId}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "jobId": "job_456def",
    "status": "cancelled",
    "scheduledAt": "2024-03-15T14:00:00Z",
    "cancelledAt": "2024-03-15T09:45:00Z"
  }
}
```

---

### Retry Failed Email

Retry sending a failed email.

**Endpoint:** `POST /api/email/retry/{jobId}`

**Request:**
```json
{
  "useAlternativeProvider": true,
  "preferredProvider": "postmark"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "jobId": "job_789ghi",
    "newJobId": "job_101112",
    "status": "requeued",
    "attemptNumber": 2,
    "maxAttempts": 3,
    "provider": "postmark"
  }
}
```

---

## Consent Management Endpoints

### Update Consent Preferences

Update customer email consent preferences.

**Endpoint:** `POST /api/consent/preferences`

**Request:**
```json
{
  "customerId": "cust_123456",
  "preferences": {
    "marketing_emails": true,
    "event_announcements": true,
    "special_offers": false,
    "waitlist_notifications": true,
    "feedback_requests": false,
    "birthday_offers": true
  },
  "trackingConsent": {
    "allowOpenTracking": true,
    "allowClickTracking": true,
    "allowAnalytics": false
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "customerId": "cust_123456",
    "preferences": {
      "marketing_emails": true,
      "event_announcements": true,
      "special_offers": false,
      "waitlist_notifications": true,
      "feedback_requests": false,
      "birthday_offers": true,
      "booking_confirmations": true,
      "payment_notifications": true
    },
    "trackingConsent": {
      "allowOpenTracking": true,
      "allowClickTracking": true,
      "allowAnalytics": false
    },
    "updatedAt": "2024-03-15T10:00:00Z",
    "effectiveFrom": "2024-03-15T10:00:00Z"
  }
}
```

---

### Get Consent Status

Retrieve current consent status for a customer.

**Endpoint:** `GET /api/consent/status/{customerId}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "customerId": "cust_123456",
    "email": "customer@example.com",
    "consents": [
      {
        "type": "marketing",
        "given": true,
        "legalBasis": "consent",
        "consentDate": "2024-01-15T14:30:00Z",
        "version": "2.0",
        "expiresAt": null
      },
      {
        "type": "transactional",
        "given": true,
        "legalBasis": "contract",
        "consentDate": "2024-01-10T10:00:00Z",
        "version": "1.0",
        "expiresAt": null
      }
    ],
    "preferences": {
      "emailFrequency": "immediate",
      "timezone": "Europe/London",
      "language": "en",
      "quietHours": {
        "enabled": true,
        "start": "22:00",
        "end": "09:00"
      }
    },
    "suppressionStatus": {
      "isSuppressed": false,
      "reason": null,
      "suppressedAt": null
    }
  }
}
```

---

### Record Consent

Explicitly record customer consent.

**Endpoint:** `POST /api/consent/record`

**Request:**
```json
{
  "customerId": "cust_123456",
  "emailType": "marketing",
  "consent": true,
  "method": "explicit",
  "source": "preference_center",
  "consentText": "I agree to receive marketing emails from The Backroom Leeds",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "consentId": "consent_abc123",
    "customerId": "cust_123456",
    "type": "marketing",
    "status": "active",
    "recordedAt": "2024-03-15T10:00:00Z",
    "legalBasis": "consent",
    "auditId": "audit_xyz789"
  }
}
```

---

### Handle Unsubscribe

Process unsubscribe request via token.

**Endpoint:** `POST /api/consent/unsubscribe`

**Request:**
```json
{
  "token": "unsub_token_abc123xyz",
  "reason": "too_frequent",
  "feedback": "I receive too many emails",
  "unsubscribeTypes": ["marketing", "promotional"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "customerId": "cust_123456",
    "email": "customer@example.com",
    "unsubscribed": ["marketing", "promotional"],
    "retained": ["transactional", "booking_confirmations"],
    "processedAt": "2024-03-15T10:00:00Z",
    "confirmationSent": true
  }
}
```

---

## Analytics Endpoints

### Get Email Analytics

Retrieve email performance analytics.

**Endpoint:** `GET /api/email/analytics`

**Query Parameters:**
- `startDate` (required): ISO date string
- `endDate` (required): ISO date string
- `groupBy`: `day` | `week` | `month` (default: `day`)
- `templateId`: Filter by specific template
- `campaignId`: Filter by specific campaign
- `metrics`: Comma-separated list of metrics

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-03-01T00:00:00Z",
      "end": "2024-03-15T23:59:59Z",
      "groupBy": "day"
    },
    "summary": {
      "totalSent": 1250,
      "totalDelivered": 1235,
      "totalOpened": 892,
      "totalClicked": 456,
      "totalUnsubscribed": 12,
      "totalBounced": 15,
      "deliveryRate": 98.8,
      "openRate": 72.2,
      "clickRate": 36.9,
      "unsubscribeRate": 0.97
    },
    "timeline": [
      {
        "date": "2024-03-01",
        "sent": 85,
        "delivered": 84,
        "opened": 62,
        "clicked": 28,
        "openRate": 73.8,
        "clickRate": 33.3
      }
    ],
    "templatePerformance": [
      {
        "templateId": "booking_confirmation",
        "templateName": "Booking Confirmation",
        "sent": 450,
        "openRate": 95.2,
        "clickRate": 78.5
      }
    ],
    "providerStats": {
      "resend": {
        "sent": 1100,
        "delivered": 1090,
        "failed": 10,
        "avgDeliveryTime": 1.2
      },
      "postmark": {
        "sent": 150,
        "delivered": 145,
        "failed": 5,
        "avgDeliveryTime": 0.8
      }
    }
  }
}
```

---

### Track Email Open

Track when an email is opened (internal endpoint).

**Endpoint:** `GET /api/email/track/open/{token}`

**Response:** 1x1 transparent GIF image

**Side Effects:**
- Records open event in database
- Updates email engagement metrics
- Triggers analytics processing

---

### Track Link Click

Track when a link is clicked and redirect.

**Endpoint:** `GET /api/email/track/click/{token}`

**Query Parameters:**
- `url`: Base64 encoded destination URL

**Response:** 302 redirect to destination URL

**Side Effects:**
- Records click event in database
- Updates click metrics
- Processes link category analytics

---

### Get Provider Statistics

Retrieve email provider performance statistics.

**Endpoint:** `GET /api/email/providers/stats`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "name": "resend",
        "status": "healthy",
        "statistics": {
          "last24Hours": {
            "sent": 450,
            "delivered": 445,
            "failed": 5,
            "successRate": 98.9,
            "avgDeliveryTime": 1.2,
            "cost": 0.11
          },
          "last7Days": {
            "sent": 3150,
            "delivered": 3100,
            "failed": 50,
            "successRate": 98.4,
            "avgDeliveryTime": 1.3,
            "cost": 0.79
          },
          "currentMonth": {
            "sent": 9500,
            "delivered": 9350,
            "failed": 150,
            "successRate": 98.4,
            "avgDeliveryTime": 1.3,
            "cost": 2.38,
            "quotaUsed": 9500,
            "quotaLimit": 10000,
            "quotaRemaining": 500
          }
        },
        "health": {
          "isHealthy": true,
          "lastChecked": "2024-03-15T10:00:00Z",
          "consecutiveFailures": 0,
          "responseTime": 245
        }
      }
    ],
    "summary": {
      "primaryProvider": "resend",
      "failoverEvents": 12,
      "totalCost": 3.45,
      "overallSuccessRate": 98.6
    }
  }
}
```

---

### Get Queue Health

Monitor email queue health and performance.

**Endpoint:** `GET /api/email/queue/health`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "queues": {
      "critical": {
        "waiting": 2,
        "active": 3,
        "completed": 145,
        "failed": 1,
        "delayed": 0,
        "averageWaitTime": 0.5,
        "averageProcessTime": 1.2
      },
      "high": {
        "waiting": 15,
        "active": 5,
        "completed": 892,
        "failed": 8,
        "delayed": 12,
        "averageWaitTime": 2.3,
        "averageProcessTime": 1.8
      },
      "normal": {
        "waiting": 45,
        "active": 3,
        "completed": 2456,
        "failed": 23,
        "delayed": 67,
        "averageWaitTime": 8.5,
        "averageProcessTime": 2.1
      },
      "low": {
        "waiting": 128,
        "active": 1,
        "completed": 3789,
        "failed": 45,
        "delayed": 234,
        "averageWaitTime": 45.2,
        "averageProcessTime": 2.5
      }
    },
    "summary": {
      "totalWaiting": 190,
      "totalActive": 12,
      "totalCompleted": 7282,
      "totalFailed": 77,
      "totalDelayed": 313,
      "systemHealth": "healthy",
      "alerts": []
    },
    "workers": {
      "total": 4,
      "active": 4,
      "idle": 0,
      "cpuUsage": 45.2,
      "memoryUsage": 62.8
    }
  }
}
```

---

## Campaign Management Endpoints

### Create Campaign

Create a new email campaign.

**Endpoint:** `POST /api/email/campaigns`

**Request:**
```json
{
  "name": "LA FIESTA Weekend Special",
  "description": "Special offers for LA FIESTA event",
  "type": "marketing",
  "templateId": "template_123",
  "segmentCriteria": {
    "tags": ["vip", "frequent_visitor"],
    "lastVisit": {
      "after": "2024-02-01"
    },
    "preferences": {
      "event_announcements": true
    }
  },
  "scheduledAt": "2024-03-20T18:00:00Z",
  "abTest": {
    "enabled": true,
    "variants": [
      {
        "templateId": "template_123",
        "weight": 0.5
      },
      {
        "templateId": "template_124",
        "weight": 0.5
      }
    ]
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "campaignId": "camp_abc123",
    "name": "LA FIESTA Weekend Special",
    "status": "scheduled",
    "recipientCount": 450,
    "scheduledAt": "2024-03-20T18:00:00Z",
    "estimatedCost": 0.11,
    "createdAt": "2024-03-15T10:00:00Z"
  }
}
```

---

### Get Campaign Performance

Retrieve campaign performance metrics.

**Endpoint:** `GET /api/email/campaigns/{campaignId}/performance`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "camp_abc123",
      "name": "LA FIESTA Weekend Special",
      "status": "completed"
    },
    "performance": {
      "sent": 450,
      "delivered": 445,
      "opened": 312,
      "clicked": 145,
      "unsubscribed": 3,
      "bounced": 5,
      "openRate": 70.1,
      "clickRate": 32.6,
      "unsubscribeRate": 0.67,
      "bounceRate": 1.11
    },
    "engagement": {
      "uniqueOpens": 298,
      "totalOpens": 892,
      "uniqueClicks": 134,
      "totalClicks": 423,
      "averageOpensPerRecipient": 2.99,
      "averageClicksPerRecipient": 3.16
    },
    "conversion": {
      "bookingsGenerated": 28,
      "conversionRate": 6.29,
      "revenueGenerated": 4760.00,
      "averageOrderValue": 170.00,
      "roi": 4236.36
    },
    "devices": {
      "mobile": 65.2,
      "desktop": 28.4,
      "tablet": 6.4
    },
    "topLinks": [
      {
        "url": "https://backroomleeds.com/events/la-fiesta",
        "clicks": 234,
        "uniqueClicks": 89
      }
    ]
  }
}
```

---

## Webhook Events

The Email System sends webhooks for various events. Configure webhook endpoints in the dashboard.

### Email Delivered

```json
{
  "event": "email.delivered",
  "timestamp": "2024-03-15T10:00:08Z",
  "data": {
    "messageId": "msg_abc123",
    "recipient": "customer@example.com",
    "template": "booking_confirmation",
    "provider": "resend",
    "deliveryTime": 1.2
  }
}
```

### Email Bounced

```json
{
  "event": "email.bounced",
  "timestamp": "2024-03-15T10:00:08Z",
  "data": {
    "messageId": "msg_def456",
    "recipient": "invalid@example.com",
    "bounceType": "hard_bounce",
    "reason": "Mailbox does not exist",
    "provider": "resend"
  }
}
```

### Email Opened

```json
{
  "event": "email.opened",
  "timestamp": "2024-03-15T10:05:30Z",
  "data": {
    "messageId": "msg_abc123",
    "recipient": "customer@example.com",
    "template": "booking_confirmation",
    "openCount": 1,
    "emailClient": "Gmail",
    "deviceType": "mobile"
  }
}
```

### Email Clicked

```json
{
  "event": "email.clicked",
  "timestamp": "2024-03-15T10:06:15Z",
  "data": {
    "messageId": "msg_abc123",
    "recipient": "customer@example.com",
    "clickedUrl": "https://backroomleeds.com/bookings/book_123456",
    "linkCategory": "cta",
    "clickCount": 1
  }
}
```

### Unsubscribe

```json
{
  "event": "email.unsubscribed",
  "timestamp": "2024-03-15T10:10:00Z",
  "data": {
    "recipient": "customer@example.com",
    "customerId": "cust_123456",
    "unsubscribeTypes": ["marketing", "promotional"],
    "reason": "too_frequent",
    "feedback": "Too many emails"
  }
}
```

---

## Error Codes

### Email Errors

| Code | Description | Resolution |
|------|-------------|------------|
| `EMAIL_001` | Invalid template | Check template name and version |
| `EMAIL_002` | Recipient blocked | Recipient is on suppression list |
| `EMAIL_003` | No consent | Customer hasn't consented to this email type |
| `EMAIL_004` | Invalid recipient | Email address is malformed |
| `EMAIL_005` | Quota exceeded | Provider quota limit reached |
| `EMAIL_006` | All providers failed | All email providers are down |
| `EMAIL_007` | Template rendering failed | Check template data |
| `EMAIL_008` | Attachment too large | Max 10MB per attachment |

### Consent Errors

| Code | Description | Resolution |
|------|-------------|------------|
| `CONSENT_001` | Invalid consent type | Use valid consent type |
| `CONSENT_002` | Consent already withdrawn | Cannot re-enable withdrawn consent |
| `CONSENT_003` | Customer not found | Check customer ID |
| `CONSENT_004` | Invalid unsubscribe token | Token expired or invalid |

### Queue Errors

| Code | Description | Resolution |
|------|-------------|------------|
| `QUEUE_001` | Queue full | Wait and retry |
| `QUEUE_002` | Job not found | Check job ID |
| `QUEUE_003` | Job already processed | Cannot retry completed job |
| `QUEUE_004` | Max retries exceeded | Manual intervention required |

---

## Rate Limits

### Per-Endpoint Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/email/send` | 100 | 1 minute |
| `/api/email/batch` | 10 | 1 minute |
| `/api/email/campaigns` | 10 | 1 minute |
| `/api/email/analytics` | 50 | 1 minute |
| `/api/consent/*` | 100 | 1 minute |
| `/api/email/track/*` | 1000 | 1 minute |

### Headers

Rate limit information is included in response headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1710496860
```

---

## Testing

### Test Mode

Include `X-Test-Mode: true` header to use test mode:

- Emails are not actually sent
- Instant "delivered" status
- No charges incurred
- Test data is isolated

### Test Templates

Use these test template IDs:

- `test_booking_confirmation`
- `test_cancellation`
- `test_marketing`

### Test Recipients

These email addresses have special behavior:

- `bounce@test.com` - Always bounces
- `spam@test.com` - Marked as spam
- `success@test.com` - Always succeeds
- `delay@test.com` - 5-second delay

---

## SDKs and Libraries

### Node.js/TypeScript

```typescript
import { EmailClient } from '@backroom/email-sdk';

const client = new EmailClient({
  apiKey: process.env.BACKROOM_API_KEY
});

// Send email
const result = await client.send({
  template: 'booking_confirmation',
  recipient: 'customer@example.com',
  data: { bookingId: 'book_123' }
});

// Check status
const status = await client.getStatus(result.messageId);
```

### React Hook

```typescript
import { useEmailTracking } from '@backroom/email-react';

function BookingConfirmation({ bookingId }) {
  const { trackOpen, trackClick } = useEmailTracking(bookingId);
  
  useEffect(() => {
    trackOpen();
  }, []);
  
  return (
    <a href="/booking" onClick={() => trackClick('booking_link')}>
      View Booking
    </a>
  );
}
```

---

## Support

For API support, contact:
- **Email**: api@backroomleeds.com
- **Documentation**: https://docs.backroomleeds.com/api/email
- **Status Page**: https://status.backroomleeds.com