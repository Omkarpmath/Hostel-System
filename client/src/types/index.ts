// ============================================
// BMSCE Hostel Management — Type Definitions
// ============================================

// User & Auth
export interface User {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  studentProfile?: StudentProfile;
}

export type Role = 'STUDENT' | 'ADMIN' | 'WARDEN' | 'ACCOUNTANT' | 'SECURITY';

export interface StudentProfile {
  id: string;
  userId: string;
  usn: string;
  department: string;
  year: number;
  semester: number;
  guardianName: string;
  guardianPhone: string;
  permanentAddress: string;
  bloodGroup?: string;
  dateOfBirth: string;
  gender: Gender;
  qrCodeToken: string;
  roomAllocations?: RoomAllocation[];
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

// Hostel
export interface Hostel {
  id: string;
  name: string;
  type: HostelType;
  address?: string;
  description?: string;
  wardenId?: string;
  warden?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  isActive: boolean;
  allowedYears: number[];
  blocks?: Block[];
  createdAt: string;
  updatedAt: string;
}

export type HostelType = 'BOYS' | 'GIRLS';

export interface Block {
  id: string;
  hostelId: string;
  name: string;
  description?: string;
  isActive: boolean;
  floors?: Floor[];
}

export interface Floor {
  id: string;
  blockId: string;
  floorNumber: number;
  name: string;
  rooms?: Room[];
}

export interface Room {
  id: string;
  floorId: string;
  roomNumber: string;
  capacity: number;
  occupiedBeds: number;
  type: RoomType;
  status: RoomStatus;
  feePerSemester: number;
  amenities?: string;
  isActive: boolean;
  version: number;
  floor?: Floor & { block?: Block & { hostel?: Hostel } };
  allocations?: RoomAllocation[];
}

export type RoomType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'DORMITORY';
export type RoomStatus = 'AVAILABLE' | 'PARTIALLY_OCCUPIED' | 'FULL' | 'MAINTENANCE' | 'RESERVED';

// Allocation
export interface RoomAllocation {
  id: string;
  studentId: string;
  roomId: string;
  bedNumber: number;
  status: AllocationStatus;
  allocatedFrom: string;
  allocatedTo?: string;
  student?: StudentProfile & { user?: User };
  room?: Room;
}

export type AllocationStatus = 'ACTIVE' | 'VACATED' | 'TRANSFERRED';

export interface Reservation {
  id: string;
  studentId: string;
  roomId: string;
  status: ReservationStatus;
  expiresAt: string;
}

export type ReservationStatus = 'PENDING' | 'EXPIRED' | 'CONVERTED';

// Fee
export interface Fee {
  id: string;
  studentId: string;
  allocationId?: string;
  amount: number;
  type: FeeType;
  status: PaymentStatus;
  transactionId?: string;
  paymentMethod?: string;
  receiptNumber?: string;
  screenshotUrl?: string;
  paidAt?: string;
  dueDate: string;
  student?: StudentProfile;
}

export type FeeType = 'HOSTEL_FEE' | 'MESS_FEE' | 'DEPOSIT' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

// Leave
export interface LeaveRequest {
  id: string;
  studentId: string;
  type: LeaveType;
  reason: string;
  fromDate: string;
  toDate: string;
  status: LeaveStatus;
  approvedBy?: string;
  rejectionReason?: string;
  approvedAt?: string;
  student?: StudentProfile & { user?: User };
}

export type LeaveType = 'HOME_LEAVE' | 'MEDICAL' | 'EMERGENCY' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

// Complaint
export interface Complaint {
  id: string;
  studentId: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: string;
  images?: ComplaintImage[];
  student?: StudentProfile & { user?: User };
}

export type ComplaintCategory = 'ELECTRICAL' | 'PLUMBING' | 'FURNITURE' | 'CLEANING' | 'NETWORK' | 'OTHER';
export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface ComplaintImage {
  id: string;
  complaintId: string;
  imageUrl: string;
}

// Visitor
export interface Visitor {
  id: string;
  studentId: string;
  visitorName: string;
  visitorPhone: string;
  relationship: string;
  purpose: string;
  idProofType?: string;
  idProofNumber?: string;
  status: VisitorStatus;
  approvedBy?: string;
  checkInTime?: string;
  checkOutTime?: string;
  student?: StudentProfile & { user?: User };
}

export type VisitorStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHECKED_IN' | 'CHECKED_OUT';

// Dashboard
export interface DashboardStats {
  totalStudents: number;
  totalHostels: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  pendingLeaves: number;
  openComplaints: number;
  pendingFees: number;
  occupancyRate: number;
  recentAllocations: RoomAllocation[];
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
