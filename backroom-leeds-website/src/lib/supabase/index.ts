/**
 * Supabase Module Exports
 * 
 * This file provides convenient exports for all Supabase-related functionality
 * including clients, types, and utility functions.
 */

// Client exports
export { createClient as createServerClient, createServiceRoleClient } from './server'
export { createClient as createBrowserClient, supabase, getSession, getUser } from './client'

// Type exports
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from '@/types/database.types'

// Import types for local usage
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from '@/types/database.types'

// Convenience type aliases for easier usage
export type AdminUser = Tables<'admin_users'>
export type VenueTable = Tables<'venue_tables'>
export type Booking = Tables<'bookings'>
export type Event = Tables<'events'>
export type WaitlistEntry = Tables<'waitlist'>
export type AuditLog = Tables<'audit_log'>
export type EmailNotification = Tables<'email_notifications'>
export type ReportRecipient = Tables<'report_recipients'>
export type ScheduledJob = Tables<'scheduled_jobs'>

export type AdminUserInsert = TablesInsert<'admin_users'>
export type VenueTableInsert = TablesInsert<'venue_tables'>
export type BookingInsert = TablesInsert<'bookings'>
export type EventInsert = TablesInsert<'events'>
export type WaitlistInsert = TablesInsert<'waitlist'>
export type AuditLogInsert = TablesInsert<'audit_log'>
export type EmailNotificationInsert = TablesInsert<'email_notifications'>
export type ReportRecipientInsert = TablesInsert<'report_recipients'>
export type ScheduledJobInsert = TablesInsert<'scheduled_jobs'>

export type AdminUserUpdate = TablesUpdate<'admin_users'>
export type VenueTableUpdate = TablesUpdate<'venue_tables'>
export type BookingUpdate = TablesUpdate<'bookings'>
export type EventUpdate = TablesUpdate<'events'>
export type WaitlistUpdate = TablesUpdate<'waitlist'>
export type AuditLogUpdate = TablesUpdate<'audit_log'>
export type EmailNotificationUpdate = TablesUpdate<'email_notifications'>
export type ReportRecipientUpdate = TablesUpdate<'report_recipients'>
export type ScheduledJobUpdate = TablesUpdate<'scheduled_jobs'>

export type BookingStatus = Enums<'booking_status'>
export type UserRole = Enums<'user_role'>
export type FloorType = Enums<'floor_type'>
export type NotificationStatus = Enums<'notification_status'>
export type NotificationType = Enums<'notification_type'>
export type JobStatus = Enums<'job_status'>

// Legacy type aliases for backward compatibility
export type InsertTables<T extends keyof Database['public']['Tables']> = TablesInsert<T>
export type UpdateTables<T extends keyof Database['public']['Tables']> = TablesUpdate<T>

// Utility functions for common database operations
export const BOOKING_STATUSES = {
  PENDING: 'pending' as const,
  CONFIRMED: 'confirmed' as const,
  CANCELLED: 'cancelled' as const,
  ARRIVED: 'arrived' as const,
  NO_SHOW: 'no_show' as const,
} as const

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin' as const,
  MANAGER: 'manager' as const,
  DOOR_STAFF: 'door_staff' as const,
} as const

export const FLOOR_TYPES = {
  UPSTAIRS: 'upstairs' as const,
  DOWNSTAIRS: 'downstairs' as const,
} as const

/**
 * Helper function to check if a user has admin permissions
 */
export function isAdmin(role: string): boolean {
  return role === USER_ROLES.SUPER_ADMIN || role === USER_ROLES.MANAGER
}

/**
 * Helper function to check if a user can manage other users
 */
export function canManageUsers(role: string): boolean {
  return role === USER_ROLES.SUPER_ADMIN
}

/**
 * Helper function to format booking reference
 */
export function formatBookingRef(ref: string): string {
  return ref.toUpperCase()
}

/**
 * Helper function to calculate remaining balance
 */
export function calculateRemainingBalance(packageAmount: number = 0, depositAmount: number = 50): number {
  return Math.max(0, packageAmount - depositAmount)
}

/**
 * Helper function to check if a booking is refund eligible (48-hour rule)
 */
export function isRefundEligible(bookingDate: string, arrivalTime: string, cancelledAt?: string): boolean {
  if (!cancelledAt) return true
  
  const bookingDateTime = new Date(`${bookingDate}T${arrivalTime}`)
  const cancelledDateTime = new Date(cancelledAt)
  const hoursDifference = (bookingDateTime.getTime() - cancelledDateTime.getTime()) / (1000 * 60 * 60)
  
  return hoursDifference >= 48
}