export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface Schedule {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status?: string;
  isBooked?: boolean;
  doctorId?: string;
}

export interface Appointment {
  _id: string;
  patientId: string;
  doctorId: string;
  scheduleId: string;
  status: string;
  symptoms?: string;
  note?: string;
  appointmentTime?: string;
}
