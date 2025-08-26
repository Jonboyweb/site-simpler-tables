'use client';

import { useState } from 'react';
import { Button, Text } from '@/components/atoms';
import { Card, Modal, Select } from '@/components/molecules';
import { createClient } from '@/lib/supabase/client';

interface BulkOperationsProps {
  selectedBookings: string[];
  onComplete: () => void;
}

export function BulkOperations({ selectedBookings, onComplete }: BulkOperationsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [operation, setOperation] = useState<string>('');
  const [operationData, setOperationData] = useState<any>({});
  
  const supabase = createClient();

  const bulkOperations = [
    { value: 'confirm', label: 'Confirm Bookings', description: 'Mark selected bookings as confirmed' },
    { value: 'cancel', label: 'Cancel Bookings', description: 'Cancel selected bookings with reason' },
    { value: 'no_show', label: 'Mark No-Show', description: 'Mark selected bookings as no-show' },
    { value: 'export', label: 'Export Data', description: 'Export selected bookings to CSV' },
    { value: 'email', label: 'Send Email', description: 'Send bulk email to customers' },
    { value: 'notes', label: 'Add Notes', description: 'Add internal notes to selected bookings' }
  ];

  const handleOperationSelect = (operationType: string) => {
    setOperation(operationType);
    
    // Set up operation-specific data
    switch (operationType) {
      case 'cancel':
        setOperationData({ reason: '', refund_amount: 0 });
        break;
      case 'email':
        setOperationData({ subject: '', message: '', template: '' });
        break;
      case 'notes':
        setOperationData({ note: '' });
        break;
      default:
        setOperationData({});
    }
    
    setShowConfirmModal(true);
  };

  const executeOperation = async () => {
    try {
      setIsProcessing(true);

      switch (operation) {
        case 'confirm':
          await bulkConfirmBookings();
          break;
        case 'cancel':
          await bulkCancelBookings();
          break;
        case 'no_show':
          await bulkMarkNoShow();
          break;
        case 'export':
          await exportBookings();
          break;
        case 'email':
          await sendBulkEmail();
          break;
        case 'notes':
          await addBulkNotes();
          break;
      }

      setShowConfirmModal(false);
      onComplete();
    } catch (error) {
      console.error('Bulk operation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const bulkConfirmBookings = async () => {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .in('id', selectedBookings);

    if (error) throw error;
  };

  const bulkCancelBookings = async () => {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        cancellation_reason: operationData.reason,
        refund_amount: operationData.refund_amount,
        updated_at: new Date().toISOString()
      })
      .in('id', selectedBookings);

    if (error) throw error;
  };

  const bulkMarkNoShow = async () => {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'no_show',
        updated_at: new Date().toISOString()
      })
      .in('id', selectedBookings);

    if (error) throw error;
  };

  const addBulkNotes = async () => {
    // Get existing bookings to append notes
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, notes')
      .in('id', selectedBookings);

    if (fetchError) throw fetchError;

    // Update each booking with appended note
    for (const booking of bookings) {
      const existingNotes = booking.notes || '';
      const newNote = `[${new Date().toLocaleDateString()}] ${operationData.note}`;
      const updatedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;

      const { error } = await supabase
        .from('bookings')
        .update({ 
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (error) throw error;
    }
  };

  const exportBookings = async () => {
    // Fetch booking data for export
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        booking_ref, customer_name, customer_email, customer_phone,
        party_size, booking_date, arrival_time, status, table_ids,
        total_amount, deposit_amount, special_requests, created_at
      `)
      .in('id', selectedBookings);

    if (error) throw error;

    // Convert to CSV
    const csvContent = convertToCSV(bookings);
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const sendBulkEmail = async () => {
    // This would integrate with your email service
    // For now, we'll just log the operation
    console.log('Sending bulk email to', selectedBookings.length, 'customers');
    console.log('Subject:', operationData.subject);
    console.log('Message:', operationData.message);
    
    // In a real implementation, you would:
    // 1. Fetch customer emails
    // 2. Send via email service (SendGrid, etc.)
    // 3. Log the activity
  };

  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        `"${String(value).replace(/"/g, '""')}"`
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  };

  const getOperationDetails = () => {
    const op = bulkOperations.find(o => o.value === operation);
    return op || { label: '', description: '' };
  };

  return (
    <>
      <Card className="p-4 bg-gradient-to-r from-speakeasy-gold/10 to-speakeasy-copper/10 border-speakeasy-gold/20">
        <div className="flex items-center justify-between">
          <div>
            <Text className="text-speakeasy-gold font-medium">
              Bulk Operations
            </Text>
            <Text variant="caption" className="text-speakeasy-champagne/70">
              {selectedBookings.length} booking{selectedBookings.length !== 1 ? 's' : ''} selected
            </Text>
          </div>
          
          <div className="flex gap-2">
            {bulkOperations.map((op) => (
              <Button
                key={op.value}
                variant="ghost"
                size="sm"
                onClick={() => handleOperationSelect(op.value)}
                className="text-speakeasy-champagne hover:text-speakeasy-gold"
              >
                {op.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={`Confirm ${getOperationDetails().label}`}
      >
        <div className="space-y-6">
          <div>
            <Text className="text-speakeasy-champagne/70 mb-4">
              {getOperationDetails().description}
            </Text>
            <Text className="text-speakeasy-gold">
              This will affect {selectedBookings.length} booking{selectedBookings.length !== 1 ? 's' : ''}.
            </Text>
          </div>

          {/* Operation-specific inputs */}
          {operation === 'cancel' && (
            <div className="space-y-4">
              <div>
                <label className="block text-speakeasy-copper text-sm mb-2">
                  Cancellation Reason
                </label>
                <Select
                  value={operationData.reason}
                  onValueChange={(value) => setOperationData(prev => ({ ...prev, reason: value }))}
                  options={[
                    { value: 'customer_request', label: 'Customer Request' },
                    { value: 'venue_closure', label: 'Venue Closure' },
                    { value: 'event_cancellation', label: 'Event Cancellation' },
                    { value: 'other', label: 'Other' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-speakeasy-copper text-sm mb-2">
                  Refund Amount (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={operationData.refund_amount}
                  onChange={(e) => setOperationData(prev => ({ 
                    ...prev, 
                    refund_amount: parseFloat(e.target.value) || 0 
                  }))}
                  className="w-full px-3 py-2 bg-speakeasy-noir border border-speakeasy-gold/20 rounded text-speakeasy-champagne"
                />
              </div>
            </div>
          )}

          {operation === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-speakeasy-copper text-sm mb-2">
                  Email Template
                </label>
                <Select
                  value={operationData.template}
                  onValueChange={(value) => setOperationData(prev => ({ ...prev, template: value }))}
                  options={[
                    { value: 'confirmation', label: 'Booking Confirmation' },
                    { value: 'reminder', label: 'Booking Reminder' },
                    { value: 'update', label: 'Booking Update' },
                    { value: 'custom', label: 'Custom Message' }
                  ]}
                />
              </div>
              {operationData.template === 'custom' && (
                <>
                  <div>
                    <label className="block text-speakeasy-copper text-sm mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={operationData.subject}
                      onChange={(e) => setOperationData(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 bg-speakeasy-noir border border-speakeasy-gold/20 rounded text-speakeasy-champagne"
                      placeholder="Email subject..."
                    />
                  </div>
                  <div>
                    <label className="block text-speakeasy-copper text-sm mb-2">
                      Message
                    </label>
                    <textarea
                      value={operationData.message}
                      onChange={(e) => setOperationData(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 bg-speakeasy-noir border border-speakeasy-gold/20 rounded text-speakeasy-champagne"
                      placeholder="Email message..."
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {operation === 'notes' && (
            <div>
              <label className="block text-speakeasy-copper text-sm mb-2">
                Note to Add
              </label>
              <textarea
                value={operationData.note}
                onChange={(e) => setOperationData(prev => ({ ...prev, note: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 bg-speakeasy-noir border border-speakeasy-gold/20 rounded text-speakeasy-champagne"
                placeholder="Internal note..."
              />
            </div>
          )}

          {operation === 'export' && (
            <div className="bg-speakeasy-burgundy/20 p-4 rounded border border-speakeasy-gold/20">
              <Text className="text-speakeasy-champagne/70 text-sm">
                The following data will be exported:
              </Text>
              <ul className="text-speakeasy-champagne/60 text-xs mt-2 space-y-1">
                <li>• Booking reference and customer details</li>
                <li>• Party size, date, and time information</li>
                <li>• Status, table assignments, and amounts</li>
                <li>• Special requests and creation date</li>
              </ul>
            </div>
          )}

          {/* Confirmation Buttons */}
          <div className="flex gap-3 pt-4 border-t border-speakeasy-gold/20">
            <Button
              variant="primary"
              onClick={executeOperation}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : `Confirm ${getOperationDetails().label}`}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowConfirmModal(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}