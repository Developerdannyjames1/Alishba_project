export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "organizer" | "exhibitor" | "attendee";
  company?: string;
  phone?: string;
  description?: string;
  productsServices?: string;
  avatar?: string;
  isApproved?: boolean;
}

export interface Expo {
  _id: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  location: string;
  theme?: string;
  status: string;
  organizerId?: User;
  maxBooths?: number;
  maxAttendees?: number;
}

export interface Booth {
  _id: string;
  boothNumber: string;
  expoId: string;
  exhibitorId?: User;
  status: "available" | "reserved" | "occupied";
  size?: string;
  price?: number;
  description?: string;
  productsServices?: string;
  staffInfo?: string;
}

export interface Session {
  _id: string;
  title: string;
  description?: string;
  speaker: string;
  speakerBio?: string;
  expoId: string;
  timeSlot: string;
  duration?: number;
  location?: string;
  maxAttendees?: number;
  type?: string;
}
