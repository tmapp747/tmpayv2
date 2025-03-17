import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge class names with tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(amount: number | string, currency = "₱"): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${currency} ${numAmount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Format date
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Calculate time remaining from a date
export function getTimeRemaining(expiryDate: Date | string): string {
  const expiry = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate;
  const now = new Date();
  
  // If the date is in the past, return expired
  if (expiry <= now) {
    return "Expired";
  }
  
  const diffMs = expiry.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor((diffMs % 60000) / 1000);
  
  return `${diffMins}:${diffSecs < 10 ? '0' : ''}${diffSecs}`;
}

// Generate a random transaction reference
export function generateTransactionReference(): string {
  return `TXN-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

// Get status color with more UI flexibility
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-500/10 text-green-500 border border-green-500/20";
    case "pending":
      return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20";
    case "failed":
      return "bg-red-500/10 text-red-500 border border-red-500/20";
    case "expired":
      return "bg-muted/10 text-muted-foreground border border-muted/20";
    case "approved":
      return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
    case "rejected":
      return "bg-red-600/10 text-red-600 border border-red-600/20";
    default:
      return "bg-muted/10 text-muted-foreground border border-muted/20";
  }
}

// Get transaction type icon - updated for Lucide icons
export function getTransactionTypeIcon(type: string): string {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes('deposit')) {
    return "wallet";
  } else if (normalizedType.includes('withdraw')) {
    return "arrow-up";
  } else if (normalizedType.includes('transfer')) {
    return "arrow-left-right";
  } else if (normalizedType.includes('casino')) {
    return "dices";
  } else {
    return "circle-help";
  }
}

// Get transaction method icon - updated for Lucide icons
export function getTransactionMethodIcon(method: string): string {
  const normalizedMethod = method.toLowerCase();
  if (normalizedMethod.includes('gcash') || normalizedMethod.includes('qr')) {
    return "qr-code";
  } else if (normalizedMethod.includes('bank') || normalizedMethod.includes('transfer')) {
    return "building-bank";
  } else if (normalizedMethod.includes('crypto')) {
    return "bitcoin";
  } else if (normalizedMethod.includes('casino')) {
    return "cards";
  } else {
    return "credit-card";
  }
}

// Get transaction color based on type
export function getTransactionTypeColor(type: string): string {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes('deposit')) {
    return "text-green-500 bg-green-500/10";
  } else if (normalizedType.includes('withdraw')) {
    return "text-red-500 bg-red-500/10";
  } else if (normalizedType.includes('transfer')) {
    return "text-blue-500 bg-blue-500/10";
  } else if (normalizedType.includes('casino')) {
    return "text-purple-500 bg-purple-500/10";
  } else {
    return "text-muted-foreground bg-muted/10";
  }
}

// Check if a valid amount
export function isValidAmount(amount: number, min: number, max: number): boolean {
  return !isNaN(amount) && amount >= min && amount <= max;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map(part => part.charAt(0))
    .join("")
    .toUpperCase();
}

// Check if we're in development mode
export function isDevelopmentMode(): boolean {
  return import.meta.env.DEV === true || 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1';
}

// Get relative time (e.g., "5 minutes ago")
export function getTimeAgo(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  
  // Convert to seconds, minutes, hours
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return diffSecs <= 5 ? 'just now' : `${diffSecs} seconds ago`;
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return dateObj.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
