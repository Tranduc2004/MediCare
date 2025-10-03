import { lazy } from "react";

// Using lazy loading for payment components
const Payment = lazy(() => import("./Payment"));
const PaymentHistory = lazy(() => import("./PaymentHistory"));

export { Payment, PaymentHistory };
