/* eslint-disable react-refresh/only-export-components */

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { toast } from "react-toastify";
import { paymentApi } from "../api/paymentApi";

interface PaymentItem {
  type:
    | "consultation_fee"
    | "deposit"
    | "additional_services"
    | "medication"
    | "final_settlement";
  description: string;
  amount: number;
  insuranceCoverage?: string;
  insuranceAmount?: number;
  patientAmount: number;
}

interface Invoice {
  _id: string;
  appointmentId: string;
  type: "consultation" | "final_settlement";
  items: PaymentItem[];
  subtotal: number;
  insuranceCoverage: number;
  patientAmount: number;
  status: "pending" | "authorized" | "captured" | "refunded" | "failed";
  dueDate?: string;
  paidAt?: string;
}

interface PaymentContextType {
  currentInvoice: Invoice | null;
  isLoading: boolean;
  error: string | null;
  loadPaymentDetails: (appointmentId: string) => Promise<void>;
  processPayment: (
    invoiceId: string,
    paymentMethod: string,
    appointmentId?: string
  ) => Promise<void>;
  clearPaymentState: () => void;
}

export const PaymentContext = createContext<PaymentContextType | undefined>(
  undefined
);

export const PaymentProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // track inflight request to avoid duplicate/parallel requests
  const inflight = React.useRef<{
    appointmentId?: string;
    controller?: AbortController;
  }>({});

  const loadPaymentDetails = useCallback(async (appointmentId: string) => {
    if (inflight.current.appointmentId === appointmentId) return;

    // abort previous request
    if (inflight.current.controller) inflight.current.controller.abort();

    const controller = new AbortController();
    inflight.current = { appointmentId, controller };
    setIsLoading(true);
    setError(null);

    try {
      const resp = await paymentApi.getDetails(appointmentId);
      const invoices: Invoice[] = Array.isArray(resp.invoices)
        ? resp.invoices
        : [];
      const pending = invoices.find((inv) => inv.status === "pending") || null;
      setCurrentInvoice(pending);
      if (!pending) setError("Không tìm thấy hóa đơn cần thanh toán");
    } catch (err: unknown) {
      type ErrLike = {
        response?: { data?: { message?: string } };
        code?: string;
        name?: string;
        message?: string;
      };
      const e = err as ErrLike;
      if (e?.code === "ERR_CANCELED" || e?.name === "AbortError") return;
      const msg =
        (e?.response?.data?.message as string) ||
        "Lỗi tải thông tin thanh toán";
      setError(msg);
      console.error("Load payment details error:", e?.response?.data || e);
    } finally {
      if (inflight.current.appointmentId === appointmentId)
        inflight.current = {};
      setIsLoading(false);
    }
  }, []);

  const processPayment = useCallback(
    async (
      invoiceId: string,
      paymentMethod: string,
      appointmentId?: string
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await paymentApi.processPayment(
          invoiceId,
          paymentMethod,
          appointmentId
        );
        if (resp && resp.payment) {
          toast.success("Thanh toán thành công!");
          setCurrentInvoice((prev) =>
            prev?._id === invoiceId ? { ...prev, status: "captured" } : prev
          );
        } else {
          throw new Error(resp?.message || "Thanh toán thất bại");
        }
      } catch (err: unknown) {
        type ErrLike = {
          response?: { data?: { message?: string } };
          message?: string;
        };
        const e = err as ErrLike;
        const msg =
          (e?.response?.data?.message as string) ||
          (e?.message as string) ||
          "Lỗi xử lý thanh toán";
        setError(msg);
        toast.error(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearPaymentState = () => {
    setCurrentInvoice(null);
    setError(null);
    setIsLoading(false);
  };

  useEffect(() => {
    return () => {
      if (inflight.current.controller) inflight.current.controller.abort();
      clearPaymentState();
    };
  }, []);

  return (
    <PaymentContext.Provider
      value={{
        currentInvoice,
        isLoading,
        error,
        loadPaymentDetails,
        processPayment,
        clearPaymentState,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (context === undefined)
    throw new Error("usePayment must be used within a PaymentProvider");
  return context;
};

export default PaymentProvider;
