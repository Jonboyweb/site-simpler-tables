# UK GDPR Compliance Implementation for Booking Systems

## Executive Summary

UK GDPR compliance for nightclub booking systems requires comprehensive data protection strategies, including automated right-to-erasure handling, consent management, data retention policies, and audit trails. The Data (Use and Access) Act coming into effect June 19, 2025, introduces additional considerations for venue management platforms handling customer booking data.

## Legislative Framework Updates (2025)

### Data (Use and Access) Act 2025

**Key Changes Effective June 19, 2025:**
- Enhanced data subject rights enforcement
- Stricter consent management requirements  
- Automated decision-making transparency requirements
- Cross-border data sharing restrictions post-Brexit

**Compliance Timeline:**
```typescript
// Compliance roadmap tracking
interface ComplianceDeadline {
  requirement: string;
  effectiveDate: Date;
  implementationStatus: 'pending' | 'in_progress' | 'completed';
  riskLevel: 'low' | 'medium' | 'high';
}

const compliance2025Roadmap: ComplianceDeadline[] = [
  {
    requirement: 'Data Use and Access Act implementation',
    effectiveDate: new Date('2025-06-19'),
    implementationStatus: 'pending',
    riskLevel: 'high'
  },
  {
    requirement: 'Enhanced consent mechanisms',
    effectiveDate: new Date('2025-06-19'),
    implementationStatus: 'in_progress',
    riskLevel: 'medium'
  },
  {
    requirement: 'Automated erasure processes',
    effectiveDate: new Date('2025-01-01'),
    implementationStatus: 'completed',
    riskLevel: 'low'
  }
];
```

## Right to Erasure Implementation

### Automated Deletion System

**Comprehensive Data Erasure:**
```typescript
// Automated right-to-erasure implementation
class DataErasureService {
  private readonly ERASURE_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
  
  async processErasureRequest(
    userId: string, 
    requestType: 'full' | 'partial',
    specificData?: string[]
  ): Promise<ErasureResult> {
    
    // Validate erasure request
    const validationResult = await this.validateErasureRequest(userId, requestType);
    if (!validationResult.isValid) {
      throw new ErasureValidationError(validationResult.reason);
    }

    // Create audit trail
    await this.logErasureRequest(userId, requestType, specificData);

    try {
      // Execute erasure across all systems
      const results = await Promise.allSettled([
        this.eraseBookingData(userId, specificData),
        this.erasePaymentData(userId),
        this.eraseMarketingData(userId),
        this.eraseAnalyticsData(userId),
        this.eraseBackupData(userId),
        this.eraseThirdPartyData(userId)
      ]);

      // Process results and handle failures
      const failedDeletions = results
        .filter(result => result.status === 'rejected')
        .map((result, index) => ({ 
          system: this.getSystemName(index), 
          error: (result as PromiseRejectedResult).reason 
        }));

      if (failedDeletions.length > 0) {
        await this.scheduleRetryDeletion(userId, failedDeletions);
      }

      return {
        success: failedDeletions.length === 0,
        partialSuccess: results.some(r => r.status === 'fulfilled'),
        failedSystems: failedDeletions,
        completedAt: new Date()
      };

    } catch (error) {
      await this.logErasureFailure(userId, error);
      throw error;
    }
  }

  private async eraseBookingData(userId: string, specificData?: string[]): Promise<void> {
    const { error: bookingError } = await supabase
      .from('table_bookings')
      .delete()
      .eq('user_id', userId);

    if (bookingError) throw bookingError;

    // Anonymize audit logs instead of deleting for legal compliance
    const { error: auditError } = await supabase
      .from('booking_audit_log')
      .update({ 
        user_id: null, 
        anonymized_at: new Date().toISOString(),
        original_user_hash: this.hashUserId(userId)
      })
      .eq('user_id', userId);

    if (auditError) throw auditError;
  }

  private async erasePaymentData(userId: string): Promise<void> {
    // Stripe data handling - coordinate with Stripe's data retention
    const stripeCustomers = await stripe.customers.list({
      email: await this.getUserEmail(userId)
    });

    for (const customer of stripeCustomers.data) {
      // Request deletion from Stripe
      await stripe.customers.del(customer.id);
    }

    // Local payment records
    const { error } = await supabase
      .from('payment_records')
      .update({
        customer_data: null,
        anonymized_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Handle backup system erasure
  private async eraseBackupData(userId: string): Promise<void> {
    // Schedule backup deletion job
    await this.scheduleBackupErasure(userId);
    
    // Verify deletion after backup cycle
    setTimeout(async () => {
      await this.verifyBackupErasure(userId);
    }, 7 * 24 * 60 * 60 * 1000); // 7 days
  }
}
```

### Erasure Request Validation

**Legal Exemption Handling:**
```typescript
// Validate erasure requests against legal requirements
interface ErasureValidationResult {
  isValid: boolean;
  reason?: string;
  exemptions: LegalExemption[];
  retentionPeriod?: number;
}

class ErasureValidator {
  async validateErasureRequest(
    userId: string, 
    requestType: 'full' | 'partial'
  ): Promise<ErasureValidationResult> {
    
    const exemptions = await this.checkLegalExemptions(userId);
    
    // Check for active legal obligations
    const hasActiveLegalClaims = await this.checkActiveLegalClaims(userId);
    const hasFinancialObligations = await this.checkFinancialObligations(userId);
    const hasRegulatoryRetention = await this.checkRegulatoryRetention(userId);

    if (hasActiveLegalClaims) {
      return {
        isValid: false,
        reason: 'Active legal proceedings require data retention',
        exemptions: [{ type: 'legal_claims', retentionPeriod: 2555 }] // 7 years
      };
    }

    if (hasFinancialObligations) {
      return {
        isValid: false,
        reason: 'Financial records must be retained for tax purposes',
        exemptions: [{ type: 'financial_records', retentionPeriod: 2555 }] // 7 years HMRC requirement
      };
    }

    return {
      isValid: true,
      exemptions: exemptions.filter(e => !e.expired)
    };
  }

  private async checkActiveLegalClaims(userId: string): Promise<boolean> {
    // Check for disputes, chargebacks, or legal proceedings
    const { data: disputes } = await supabase
      .from('payment_disputes')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    return (disputes?.length || 0) > 0;
  }

  private async checkFinancialObligations(userId: string): Promise<boolean> {
    // HMRC requires 7-year retention for VAT records
    const sevenYearsAgo = new Date();
    sevenYearsAgo.setFullYear(sevenYearsAgo.getFullYear() - 7);

    const { data: recentBookings } = await supabase
      .from('table_bookings')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', sevenYearsAgo.toISOString());

    return (recentBookings?.length || 0) > 0;
  }
}
```

## Consent Management System

### Granular Consent Controls

**Dynamic Consent Management:**
```typescript
// Comprehensive consent management
interface ConsentRecord {
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  timestamp: Date;
  version: string;
  ipAddress: string;
  userAgent: string;
  withdrawalDate?: Date;
}

enum ConsentType {
  ESSENTIAL = 'essential',           // Required for service
  MARKETING = 'marketing',           // Email marketing
  ANALYTICS = 'analytics',           // Usage analytics
  PERSONALIZATION = 'personalization', // Tailored experience
  THIRD_PARTY = 'third_party'        // Data sharing with partners
}

class ConsentManager {
  async recordConsent(
    userId: string,
    consents: Record<ConsentType, boolean>,
    context: ConsentContext
  ): Promise<void> {
    const consentRecords: ConsentRecord[] = Object.entries(consents).map(([type, granted]) => ({
      userId,
      consentType: type as ConsentType,
      granted,
      timestamp: new Date(),
      version: this.getCurrentPolicyVersion(),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    }));

    const { error } = await supabase
      .from('consent_records')
      .insert(consentRecords);

    if (error) throw error;

    // Update user preferences
    await this.updateUserPreferences(userId, consents);
    
    // Trigger consent change webhooks
    await this.notifyConsentChanges(userId, consents);
  }

  async withdrawConsent(
    userId: string,
    consentTypes: ConsentType[],
    context: ConsentContext
  ): Promise<void> {
    
    for (const consentType of consentTypes) {
      // Record withdrawal
      const { error } = await supabase
        .from('consent_records')
        .update({
          granted: false,
          withdrawalDate: new Date().toISOString(),
          withdrawalIpAddress: context.ipAddress,
          withdrawalUserAgent: context.userAgent
        })
        .eq('user_id', userId)
        .eq('consent_type', consentType)
        .eq('granted', true);

      if (error) throw error;

      // Trigger data cleanup based on withdrawn consent
      await this.processConsentWithdrawal(userId, consentType);
    }
  }

  private async processConsentWithdrawal(
    userId: string,
    consentType: ConsentType
  ): Promise<void> {
    switch (consentType) {
      case ConsentType.MARKETING:
        await this.removeFromMarketingLists(userId);
        await this.deleteMarketingProfileData(userId);
        break;
        
      case ConsentType.ANALYTICS:
        await this.anonymizeAnalyticsData(userId);
        break;
        
      case ConsentType.PERSONALIZATION:
        await this.clearPersonalizationData(userId);
        break;
        
      case ConsentType.THIRD_PARTY:
        await this.requestThirdPartyDataDeletion(userId);
        break;
    }
  }

  async getConsentStatus(userId: string): Promise<Record<ConsentType, boolean>> {
    const { data: consents } = await supabase
      .from('consent_records')
      .select('consent_type, granted')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    // Get latest consent for each type
    const latestConsents: Record<ConsentType, boolean> = {} as any;
    
    for (const consent of consents || []) {
      if (!(consent.consent_type in latestConsents)) {
        latestConsents[consent.consent_type as ConsentType] = consent.granted;
      }
    }

    return latestConsents;
  }
}
```

### Consent Banner Implementation

**GDPR-Compliant Consent Interface:**
```typescript
// React component for GDPR consent management
function GDPRConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consents, setConsents] = useState<Record<ConsentType, boolean>>({
    [ConsentType.ESSENTIAL]: true, // Always true, cannot be changed
    [ConsentType.MARKETING]: false,
    [ConsentType.ANALYTICS]: false,
    [ConsentType.PERSONALIZATION]: false,
    [ConsentType.THIRD_PARTY]: false
  });

  const consentManager = new ConsentManager();

  useEffect(() => {
    // Check if user has already provided consent
    const hasConsented = localStorage.getItem('gdpr-consent-given');
    if (!hasConsented) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = async () => {
    const allConsents = Object.keys(consents).reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), {} as Record<ConsentType, boolean>);

    await saveConsents(allConsents);
  };

  const handleRejectOptional = async () => {
    const essentialOnly = {
      ...consents,
      [ConsentType.ESSENTIAL]: true
    };

    await saveConsents(essentialOnly);
  };

  const saveConsents = async (finalConsents: Record<ConsentType, boolean>) => {
    try {
      const context = {
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent,
        timestamp: new Date()
      };

      await consentManager.recordConsent(
        getCurrentUserId(),
        finalConsents,
        context
      );

      localStorage.setItem('gdpr-consent-given', 'true');
      localStorage.setItem('consent-timestamp', new Date().toISOString());
      setShowBanner(false);

    } catch (error) {
      console.error('Failed to save consent:', error);
      // Show error message to user
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Your Privacy Matters</h3>
            <p className="text-sm text-gray-300">
              We use cookies and similar technologies to enhance your booking experience, 
              analyze site usage, and assist with marketing. By clicking "Accept All", 
              you consent to our use of cookies.
            </p>
            
            {showDetails && (
              <div className="mt-4 space-y-3">
                <ConsentOption
                  title="Essential"
                  description="Required for the booking system to function"
                  checked={consents[ConsentType.ESSENTIAL]}
                  disabled={true}
                  onChange={() => {}} // Cannot be changed
                />
                <ConsentOption
                  title="Marketing"
                  description="Personalized offers and event notifications"
                  checked={consents[ConsentType.MARKETING]}
                  onChange={(checked) => 
                    setConsents(prev => ({ ...prev, [ConsentType.MARKETING]: checked }))
                  }
                />
                <ConsentOption
                  title="Analytics"
                  description="Help us improve by analyzing usage patterns"
                  checked={consents[ConsentType.ANALYTICS]}
                  onChange={(checked) => 
                    setConsents(prev => ({ ...prev, [ConsentType.ANALYTICS]: checked }))
                  }
                />
                <ConsentOption
                  title="Personalization"
                  description="Customize your experience based on preferences"
                  checked={consents[ConsentType.PERSONALIZATION]}
                  onChange={(checked) => 
                    setConsents(prev => ({ ...prev, [ConsentType.PERSONALIZATION]: checked }))
                  }
                />
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {!showDetails ? (
              <>
                <button
                  onClick={() => setShowDetails(true)}
                  className="px-4 py-2 text-sm border border-gray-600 rounded hover:bg-gray-800"
                >
                  Customize
                </button>
                <button
                  onClick={handleRejectOptional}
                  className="px-4 py-2 text-sm border border-gray-600 rounded hover:bg-gray-800"
                >
                  Essential Only
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Accept All
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => saveConsents(consents)}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Save Preferences
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Data Retention Policies

### Automated Retention Management

**Retention Schedule Implementation:**
```typescript
// Comprehensive data retention policy
interface RetentionPolicy {
  dataType: string;
  retentionPeriod: number; // in days
  deletionMethod: 'hard_delete' | 'anonymize' | 'archive';
  legalBasis: string;
  exceptions: RetentionException[];
}

const RETENTION_POLICIES: RetentionPolicy[] = [
  {
    dataType: 'booking_records',
    retentionPeriod: 2555, // 7 years for HMRC compliance
    deletionMethod: 'archive',
    legalBasis: 'Legal obligation (tax records)',
    exceptions: [
      { condition: 'active_dispute', extensionPeriod: 365 },
      { condition: 'regulatory_investigation', extensionPeriod: 1095 }
    ]
  },
  {
    dataType: 'marketing_data',
    retentionPeriod: 1095, // 3 years or until consent withdrawn
    deletionMethod: 'hard_delete',
    legalBasis: 'Consent',
    exceptions: [
      { condition: 'consent_withdrawn', immediateDeletion: true }
    ]
  },
  {
    dataType: 'analytics_data',
    retentionPeriod: 730, // 2 years
    deletionMethod: 'anonymize',
    legalBasis: 'Legitimate interest',
    exceptions: []
  },
  {
    dataType: 'payment_data',
    retentionPeriod: 2555, // 7 years for financial regulations
    deletionMethod: 'anonymize',
    legalBasis: 'Legal obligation',
    exceptions: [
      { condition: 'chargeback_claim', extensionPeriod: 545 }
    ]
  }
];

class DataRetentionService {
  private scheduler: RetentionScheduler;

  constructor() {
    this.scheduler = new RetentionScheduler();
    this.setupAutomatedDeletion();
  }

  private setupAutomatedDeletion(): void {
    // Run daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.executeRetentionPolicies();
    });
  }

  async executeRetentionPolicies(): Promise<RetentionExecutionResult> {
    const results: PolicyExecutionResult[] = [];

    for (const policy of RETENTION_POLICIES) {
      try {
        const result = await this.executePolicyForDataType(policy);
        results.push(result);
        
        await this.logRetentionExecution(policy, result);
      } catch (error) {
        await this.logRetentionError(policy, error);
        results.push({
          dataType: policy.dataType,
          success: false,
          error: error.message,
          recordsProcessed: 0
        });
      }
    }

    return {
      totalPolicies: RETENTION_POLICIES.length,
      successfulPolicies: results.filter(r => r.success).length,
      results
    };
  }

  private async executePolicyForDataType(
    policy: RetentionPolicy
  ): Promise<PolicyExecutionResult> {
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriod);

    // Find records eligible for deletion
    const eligibleRecords = await this.findEligibleRecords(
      policy.dataType,
      cutoffDate,
      policy.exceptions
    );

    let processedCount = 0;

    for (const record of eligibleRecords) {
      await this.processRecord(record, policy.deletionMethod);
      processedCount++;
    }

    return {
      dataType: policy.dataType,
      success: true,
      recordsProcessed: processedCount,
      cutoffDate
    };
  }

  private async processRecord(
    record: DataRecord,
    deletionMethod: 'hard_delete' | 'anonymize' | 'archive'
  ): Promise<void> {
    
    switch (deletionMethod) {
      case 'hard_delete':
        await this.hardDeleteRecord(record);
        break;
        
      case 'anonymize':
        await this.anonymizeRecord(record);
        break;
        
      case 'archive':
        await this.archiveRecord(record);
        break;
    }

    // Log the action
    await this.auditDataDeletion(record, deletionMethod);
  }

  private async anonymizeRecord(record: DataRecord): Promise<void> {
    const anonymizedData = {
      ...record,
      // Remove personally identifiable information
      user_id: null,
      email: null,
      phone: null,
      name: null,
      ip_address: null,
      user_agent: null,
      
      // Keep aggregatable data
      booking_date: record.booking_date,
      table_type: record.table_type,
      guest_count: record.guest_count,
      deposit_amount: record.deposit_amount,
      
      // Mark as anonymized
      anonymized_at: new Date().toISOString(),
      original_record_hash: this.hashRecord(record)
    };

    const { error } = await supabase
      .from(record.table_name)
      .update(anonymizedData)
      .eq('id', record.id);

    if (error) throw error;
  }

  private async archiveRecord(record: DataRecord): Promise<void> {
    // Move to archive table
    const { error: insertError } = await supabase
      .from(`${record.table_name}_archive`)
      .insert({
        ...record,
        archived_at: new Date().toISOString(),
        archive_reason: 'retention_policy'
      });

    if (insertError) throw insertError;

    // Remove from active table
    const { error: deleteError } = await supabase
      .from(record.table_name)
      .delete()
      .eq('id', record.id);

    if (deleteError) throw deleteError;
  }
}
```

## Audit Trail and Compliance Monitoring

### Comprehensive Audit Logging

**GDPR Compliance Audit System:**
```typescript
// Audit trail for GDPR compliance activities
interface ComplianceAuditLog {
  id: string;
  userId?: string;
  action: ComplianceAction;
  dataTypes: string[];
  legalBasis: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details: Record<string, any>;
  retentionPeriod: number;
}

enum ComplianceAction {
  CONSENT_GRANTED = 'consent_granted',
  CONSENT_WITHDRAWN = 'consent_withdrawn',
  DATA_ERASURE_REQUESTED = 'data_erasure_requested',
  DATA_ERASURE_COMPLETED = 'data_erasure_completed',
  DATA_ACCESS_REQUESTED = 'data_access_requested',
  DATA_PORTABILITY_REQUESTED = 'data_portability_requested',
  RETENTION_POLICY_EXECUTED = 'retention_policy_executed',
  BREACH_DETECTED = 'breach_detected',
  BREACH_NOTIFIED = 'breach_notified'
}

class ComplianceAuditor {
  async logComplianceAction(
    action: ComplianceAction,
    context: ComplianceContext
  ): Promise<void> {
    
    const auditEntry: ComplianceAuditLog = {
      id: generateUuid(),
      userId: context.userId,
      action,
      dataTypes: context.dataTypes || [],
      legalBasis: context.legalBasis || 'Not specified',
      timestamp: new Date(),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      success: context.success,
      details: context.details || {},
      retentionPeriod: this.calculateAuditRetention(action)
    };

    const { error } = await supabase
      .from('compliance_audit_log')
      .insert(auditEntry);

    if (error) {
      // Critical: audit logging failure needs immediate attention
      await this.escalateAuditFailure(auditEntry, error);
      throw new AuditLoggingError('Failed to log compliance action', error);
    }

    // Send to external compliance monitoring if required
    if (this.requiresExternalReporting(action)) {
      await this.reportToExternalSystem(auditEntry);
    }
  }

  private calculateAuditRetention(action: ComplianceAction): number {
    // ICO recommends 3-year retention for compliance records
    const baseRetention = 1095; // 3 years
    
    switch (action) {
      case ComplianceAction.BREACH_DETECTED:
      case ComplianceAction.BREACH_NOTIFIED:
        return 2555; // 7 years for security incidents
        
      case ComplianceAction.DATA_ERASURE_COMPLETED:
        return 2555; // 7 years to prove compliance with erasure requests
        
      default:
        return baseRetention;
    }
  }

  async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    
    const { data: auditLogs } = await supabase
      .from('compliance_audit_log')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    return {
      reportPeriod: { startDate, endDate },
      totalActions: auditLogs?.length || 0,
      actionBreakdown: this.categorizeActions(auditLogs || []),
      consentMetrics: this.analyzeConsentPatterns(auditLogs || []),
      erasureMetrics: this.analyzeErasureRequests(auditLogs || []),
      breachIncidents: this.analyzeBreachIncidents(auditLogs || []),
      complianceScore: this.calculateComplianceScore(auditLogs || [])
    };
  }

  private analyzeConsentPatterns(logs: ComplianceAuditLog[]): ConsentMetrics {
    const consentLogs = logs.filter(log => 
      log.action === ComplianceAction.CONSENT_GRANTED || 
      log.action === ComplianceAction.CONSENT_WITHDRAWN
    );

    return {
      totalConsentActions: consentLogs.length,
      consentGranted: consentLogs.filter(log => 
        log.action === ComplianceAction.CONSENT_GRANTED
      ).length,
      consentWithdrawn: consentLogs.filter(log => 
        log.action === ComplianceAction.CONSENT_WITHDRAWN
      ).length,
      averageConsentDuration: this.calculateAverageConsentDuration(consentLogs)
    };
  }
}
```

### Breach Detection and Notification

**Automated Breach Response System:**
```typescript
// GDPR breach detection and notification
interface DataBreach {
  id: string;
  detectedAt: Date;
  breachType: BreachType;
  affectedRecords: number;
  affectedUsers: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  containmentStatus: 'detecting' | 'contained' | 'investigating' | 'resolved';
  notificationRequired: boolean;
  icoNotified: boolean;
  usersNotified: boolean;
  details: BreachDetails;
}

enum BreachType {
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_LOSS = 'data_loss',
  DATA_THEFT = 'data_theft',
  SYSTEM_COMPROMISE = 'system_compromise',
  THIRD_PARTY_BREACH = 'third_party_breach'
}

class BreachResponseService {
  private readonly ICO_NOTIFICATION_DEADLINE = 72 * 60 * 60 * 1000; // 72 hours
  private readonly USER_NOTIFICATION_DEADLINE = 30 * 24 * 60 * 60 * 1000; // 30 days

  async detectAndProcessBreach(
    breachIndicators: BreachIndicator[]
  ): Promise<DataBreach> {
    
    // Analyze breach severity
    const severity = await this.assessBreachSeverity(breachIndicators);
    
    // Create breach record
    const breach: DataBreach = {
      id: generateUuid(),
      detectedAt: new Date(),
      breachType: this.classifyBreachType(breachIndicators),
      affectedRecords: await this.countAffectedRecords(breachIndicators),
      affectedUsers: await this.identifyAffectedUsers(breachIndicators),
      severity,
      containmentStatus: 'detecting',
      notificationRequired: this.requiresNotification(severity),
      icoNotified: false,
      usersNotified: false,
      details: await this.compileBreachDetails(breachIndicators)
    };

    // Save breach record
    await this.recordBreach(breach);

    // Immediate containment actions
    await this.initiateContainment(breach);

    // Schedule notifications if required
    if (breach.notificationRequired) {
      await this.scheduleNotifications(breach);
    }

    return breach;
  }

  private async scheduleNotifications(breach: DataBreach): Promise<void> {
    // ICO notification (72 hours)
    const icoDeadline = new Date(breach.detectedAt.getTime() + this.ICO_NOTIFICATION_DEADLINE);
    await this.scheduleICONotification(breach, icoDeadline);

    // User notification (without undue delay, typically within 30 days)
    if (breach.severity === 'high' || breach.severity === 'critical') {
      const userDeadline = new Date(breach.detectedAt.getTime() + this.USER_NOTIFICATION_DEADLINE);
      await this.scheduleUserNotifications(breach, userDeadline);
    }
  }

  private async notifyICO(breach: DataBreach): Promise<void> {
    const notification = {
      organisationName: 'The Backroom Leeds Ltd',
      breachId: breach.id,
      breachDate: breach.detectedAt,
      breachType: breach.breachType,
      affectedDataTypes: this.getAffectedDataTypes(breach),
      affectedIndividuals: breach.affectedUsers.length,
      likelyConsequences: this.assessConsequences(breach),
      containmentMeasures: this.getContainmentMeasures(breach),
      contactDetails: {
        dpo: 'dpo@thebackroomleeds.com',
        phone: '+44 113 XXX XXXX'
      }
    };

    // Submit to ICO reporting system
    const response = await fetch('https://ico.org.uk/api/breach-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ICO_API_KEY}`
      },
      body: JSON.stringify(notification)
    });

    if (!response.ok) {
      throw new Error(`ICO notification failed: ${response.statusText}`);
    }

    // Update breach record
    await supabase
      .from('data_breaches')
      .update({ 
        ico_notified: true,
        ico_notification_date: new Date().toISOString()
      })
      .eq('id', breach.id);
  }

  private async notifyAffectedUsers(breach: DataBreach): Promise<void> {
    const notifications = breach.affectedUsers.map(userId => ({
      userId,
      breachId: breach.id,
      notificationType: 'data_breach',
      severity: breach.severity,
      message: this.generateUserNotificationMessage(breach),
      sentAt: new Date().toISOString()
    }));

    // Send email notifications
    for (const notification of notifications) {
      await this.sendBreachNotificationEmail(notification);
    }

    // Update breach record
    await supabase
      .from('data_breaches')
      .update({ 
        users_notified: true,
        user_notification_date: new Date().toISOString()
      })
      .eq('id', breach.id);
  }
}
```

## Data Subject Rights Portal

### Self-Service Rights Management

**Customer Data Rights Interface:**
```typescript
// Self-service data rights portal
function DataRightsPortal() {
  const [activeRequest, setActiveRequest] = useState<DataRightsRequest | null>(null);
  const [requestHistory, setRequestHistory] = useState<DataRightsRequest[]>([]);

  const availableRights = [
    {
      right: 'access',
      title: 'Access My Data',
      description: 'Download all personal data we hold about you',
      estimatedTime: '5-10 business days'
    },
    {
      right: 'rectification',
      title: 'Correct My Data',
      description: 'Update incorrect or incomplete information',
      estimatedTime: '1-3 business days'
    },
    {
      right: 'erasure',
      title: 'Delete My Data',
      description: 'Request deletion of your personal data',
      estimatedTime: '1-30 days'
    },
    {
      right: 'portability',
      title: 'Export My Data',
      description: 'Receive your data in a structured format',
      estimatedTime: '5-10 business days'
    },
    {
      right: 'objection',
      title: 'Object to Processing',
      description: 'Object to how we process your data',
      estimatedTime: '1-10 business days'
    }
  ];

  const handleSubmitRequest = async (right: DataSubjectRight, details: string) => {
    try {
      const request = await submitDataRightsRequest({
        userId: getCurrentUserId(),
        requestType: right,
        details,
        submittedAt: new Date()
      });

      setActiveRequest(request);
      
      // Show confirmation
      toast.success(`${right} request submitted successfully. 
        Reference: ${request.referenceNumber}`);
        
    } catch (error) {
      toast.error('Failed to submit request. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Your Data Rights</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {availableRights.map((right) => (
          <DataRightCard
            key={right.right}
            right={right}
            onSubmit={(details) => handleSubmitRequest(right.right as DataSubjectRight, details)}
          />
        ))}
      </div>

      {activeRequest && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold">Active Request</h3>
          <p>Type: {activeRequest.requestType}</p>
          <p>Reference: {activeRequest.referenceNumber}</p>
          <p>Status: {activeRequest.status}</p>
          <p>Estimated completion: {activeRequest.estimatedCompletion}</p>
        </div>
      )}

      <RequestHistory requests={requestHistory} />
    </div>
  );
}

// Automated request processing
class DataRightsProcessor {
  async processAccessRequest(userId: string): Promise<DataExport> {
    const userData = await this.aggregateUserData(userId);
    const exportFile = await this.createDataExport(userData);
    
    return {
      format: 'JSON',
      size: exportFile.size,
      downloadUrl: exportFile.url,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      includedData: Object.keys(userData)
    };
  }

  private async aggregateUserData(userId: string): Promise<UserDataExport> {
    const [
      profile,
      bookings,
      payments,
      consents,
      preferences
    ] = await Promise.all([
      this.getUserProfile(userId),
      this.getUserBookings(userId),
      this.getUserPayments(userId),
      this.getUserConsents(userId),
      this.getUserPreferences(userId)
    ]);

    return {
      personal_information: profile,
      booking_history: bookings,
      payment_records: payments,
      consent_records: consents,
      preferences: preferences,
      export_date: new Date().toISOString(),
      data_retention_info: this.getRetentionInfo()
    };
  }
}
```

---

*Research conducted: August 2025*
*Sources: UK ICO guidance, GDPR regulations, Data (Use and Access) Act 2025 briefings*