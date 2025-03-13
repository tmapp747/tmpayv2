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

// Get status color
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-500";
    case "pending":
      return "bg-yellow-500";
    case "failed":
      return "bg-red-500";
    case "expired":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
}

// Get transaction type icon
export function getTransactionTypeIcon(type: string): string {
  switch (type.toLowerCase()) {
    case "deposit":
      return "arrow-down";
    case "withdraw":
      return "arrow-up";
    case "transfer":
      return "exchange-alt";
    default:
      return "question-circle";
  }
}

// Get transaction method icon
export function getTransactionMethodIcon(method: string): string {
  switch (method.toLowerCase()) {
    case "gcash_qr":
      return "qrcode";
    case "bank_transfer":
      return "university";
    case "crypto":
      return "coins";
    default:
      return "money-bill";
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
