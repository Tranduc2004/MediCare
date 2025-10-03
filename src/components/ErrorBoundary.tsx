import React from "react";

type State = {
  hasError: boolean;
  error?: Error | null;
  info?: React.ErrorInfo | null;
};

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary:", error, info);
    this.setState({ error, info });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#E8F7F5] px-4">
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
          {/* Header: teal → emerald (đồng bộ toàn site) */}
          <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-6">
            <div className="flex items-start gap-3">
              {/* icon nhỏ tông trắng */}
              <svg
                className="h-6 w-6 shrink-0 text-white/95"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86l-7.4 12.84A2 2 0 004.53 20h14.94a2 2 0 001.64-3.14L13.7 3.86a2 2 0 00-3.41 0z"
                />
              </svg>
              <div>
                <h2 className="text-xl font-semibold">Có lỗi xảy ra</h2>
                <p className="mt-1 text-white/90">
                  Rất tiếc vì sự cố. Vui lòng tải lại trang để tiếp tục sử dụng.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* nút hành động */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={this.handleReload}
                className="group inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3
                           font-semibold text-white shadow-lg
                           bg-emerald-600 hover:bg-emerald-700
                           focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2"
              >
                <svg
                  className="h-5 w-5 transition-transform group-hover:rotate-180"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                  <polyline points="21 3 21 9 15 9" />
                </svg>
                Tải lại trang
              </button>

              <a
                href="/"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3
                           font-semibold text-emerald-700
                           ring-1 ring-emerald-600 hover:bg-emerald-50
                           focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2"
              >
                Về trang chủ
              </a>
            </div>

            {/* chi tiết lỗi (ẩn mặc định) */}
            {(this.state.error || this.state.info) && (
              <details className="mt-6 rounded-xl bg-slate-50 p-4 text-slate-700 open:ring-1 open:ring-slate-200">
                <summary className="cursor-pointer select-none text-sm font-medium text-slate-800">
                  Xem chi tiết kỹ thuật
                </summary>
                {this.state.error && (
                  <pre className="mt-3 overflow-auto rounded-lg bg-white p-3 text-xs leading-5 ring-1 ring-slate-200">
                    {String(this.state.error)}
                  </pre>
                )}
                {this.state.info?.componentStack && (
                  <pre className="mt-3 overflow-auto rounded-lg bg-white p-3 text-xs leading-5 ring-1 ring-slate-200">
                    {this.state.info.componentStack}
                  </pre>
                )}
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
