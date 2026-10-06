export const PAYMENT_METHODS = ["Cash", "Venmo", "Zelle", "Apple Pay", "Card", "Check", "PayPal", "Trade"] as const;

// Grouped so they line up with Schedule C lines at tax time.
export const EXPENSE_CATEGORIES = [
  "Supplies (color, product)",
  "Tools & Equipment",
  "Booth / Salon Rent",
  "Advertising",
  "Software & Subscriptions",
  "Phone & Internet",
  "Education & Classes",
  "Meals & Entertainment",
  "Travel & Mileage",
  "Licenses & Fees",
  "Insurance",
  "Repairs & Maintenance",
  "Office Expense",
  "Other",
] as const;

export const APPOINTMENT_STATUSES = ["Booked", "Paid", "Cancelled", "No-show"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const DURATION_PRESETS = [30, 45, 60, 90, 120, 150, 180, 240];
