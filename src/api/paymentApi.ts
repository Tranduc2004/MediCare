import api from "./axiosConfig";

export const paymentApi = {
  getHistory: async () => {
    const response = await api.get("/patient/payments");
    // Ensure we always return an array
    return Array.isArray(response.data) ? response.data : [];
  },

  // appointmentId is expected here; server exposes a status endpoint which
  // returns appointment + invoices. We reuse it to get invoice details for UI.
  getDetails: async (appointmentId: string) => {
    const response = await api.get(`/patient/payments/status/${appointmentId}`);
    return response.data;
  },

  createPayment: async (data: {
    appointmentId: string;
    amount: number;
    paymentMethod: string;
  }) => {
    const response = await api.post("/patient/payments", data);
    return response.data;
  },

  // Process a payment by invoiceId. Server expects POST /patient/payments/process
  // with body { appointmentId, invoiceId, paymentMethod, transactionId }.
  // Accept optional appointmentId so callers that have it can pass it.
  processPayment: async (
    invoiceId: string,
    paymentMethod: string,
    appointmentId?: string
  ) => {
    const body: {
      invoiceId: string;
      paymentMethod: string;
      transactionId: string;
      appointmentId?: string;
    } = {
      invoiceId,
      paymentMethod,
      transactionId: Date.now().toString(),
    };
    if (appointmentId) body.appointmentId = appointmentId;
    const response = await api.post(`/patient/payments/process`, body);
    return response.data;
  },

  requestRefund: async (
    paymentId: string,
    reason: string,
    refundAmount: number
  ) => {
    const response = await api.post(`/patient/payments/refund`, {
      paymentId,
      reason,
      refundAmount,
    });
    return response.data;
  },

  // Create consultation invoice (helper)
  createConsultationInvoice: async (
    appointmentId: string,
    body?: {
      consultationFee?: number;
      depositAmount?: number;
      insuranceCoverage?: number;
    }
  ) => {
    const response = await api.post(
      `/patient/payments/consultation-invoice/${appointmentId}`,
      body || {}
    );
    return response.data;
  },
};
