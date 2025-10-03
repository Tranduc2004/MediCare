export enum AppointmentStatus {
  BOOKED = "booked",
  DOCTOR_APPROVED = "doctor_approved",
  DOCTOR_REJECTED = "doctor_rejected",
  DOCTOR_RESCHEDULE = "doctor_reschedule",
  AWAIT_PAYMENT = "await_payment",
  PAID = "paid",
  CONFIRMED = "confirmed",
  IN_CONSULT = "in_consult",
  PRESCRIPTION_ISSUED = "prescription_issued",
  READY_TO_DISCHARGE = "ready_to_discharge",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  CLOSED = "closed",
  PAYMENT_OVERDUE = "payment_overdue",
}

export enum PaymentStatus {
  PENDING = "pending",
  AUTHORIZED = "authorized",
  CAPTURED = "captured",
  REFUNDED = "refunded",
  FAILED = "failed",
}

export enum PaymentType {
  CONSULTATION_FEE = "consultation_fee",
  DEPOSIT = "deposit",
  ADDITIONAL_SERVICES = "additional_services",
  MEDICATION = "medication",
  FINAL_SETTLEMENT = "final_settlement",
}

export enum InsuranceCoverage {
  NO_COVERAGE = "no_coverage",
  PARTIAL_COVERAGE = "partial_coverage",
  FULL_COVERAGE = "full_coverage",
}

export interface Payment {
  _id: string;
  appointmentId: string;
  amount: number;
  status: PaymentStatus;
  type: PaymentType;
  insuranceCoverage: number;
  patientAmount: number;
  createdAt: string;
  paidAt?: string;
  refundedAt?: string;
  refundAmount?: number;
}

export interface PaymentItem {
  type: PaymentType;
  description: string;
  amount: number;
  insuranceCoverage: InsuranceCoverage;
  insuranceAmount?: number;
  patientAmount: number;
}

export interface Invoice {
  _id: string;
  appointmentId: string;
  type: "consultation" | "final_settlement";
  items: PaymentItem[];
  subtotal: number;
  insuranceCoverage: number;
  patientAmount: number;
  status: PaymentStatus;
  dueDate?: string;
  paidAt?: string;
}

export interface Appointment {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  patientInfo?: {
    name: string;
    phone: string;
    email: string;
  };
  doctorId: {
    _id: string;
    name: string;
    specialty: string;
  };
  scheduleId: string;
  status: AppointmentStatus;
  type: string;
  symptoms?: string[];
  diagnosis?: string;
  prescription?: string[];
  consultationFee: number;
  depositAmount?: number;
  totalAmount: number;
  insuranceCoverage: number;
  patientAmount: number;
  paymentStatus?: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
}
