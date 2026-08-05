import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    ADMIN: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    WARDEN: 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300',
    STUDENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    ACCOUNTANT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    SECURITY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    PARTIALLY_OCCUPIED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    FULL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    MAINTENANCE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    RESERVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    CHECKED_IN: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    CHECKED_OUT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    VERIFIED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    DENIED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getDashboardPath(role: string): string {
  const paths: Record<string, string> = {
    ADMIN: '/admin/dashboard',
    WARDEN: '/warden/dashboard',
    STUDENT: '/student/dashboard',
    ACCOUNTANT: '/accountant/dashboard',
    SECURITY: '/security/dashboard',
  };
  return paths[role] || '/login';
}
