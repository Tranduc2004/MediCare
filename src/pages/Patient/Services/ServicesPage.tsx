import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { serviceApi } from "../../../api/serviceApi";
import * as Lucide from "lucide-react";

type Service = {
  _id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  iconKey?: string;
};

const IconSquare: React.FC<{ iconKey?: string; className?: string }> = ({
  iconKey,
  className = "h-10 w-10",
}) => {
  const IconComp = iconKey && (Lucide as any)[iconKey];
  return (
    <div
      className={`${className} rounded-lg bg-gradient-to-b from-teal-200 to-teal-400 text-white grid place-items-center shadow-sm`}
    >
      {IconComp ? (
        <IconComp className="h-5 w-5" />
      ) : (
        // fallback placeholder
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6l4 2"
          />
          <circle cx="12" cy="12" r="9" />
        </svg>
      )}
    </div>
  );
};

export default function ServicesGridPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const data = await serviceApi.getActiveServices();
      const list: Service[] = (data || []).map((s: any) => ({
        _id: s._id,
        name: s.name,
        description: s.description,
        isActive: s.isActive,
        iconKey: s.iconKey,
      }));
      setServices(list);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setErr("Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () => services.sort((a, b) => a.name.localeCompare(b.name, "vi")),
    [services]
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header đơn giản (không menu) */}
      <div className="mx-auto max-w-6xl px-6 pt-12 pb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
          Các dịch vụ được chúng tôi cung cấp{" "}
        </h1>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-16">
        {/* trạng thái */}
        {err && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            {err}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="h-10 w-10 rounded-lg bg-slate-200" />
                <div className="mt-4 h-4 w-2/3 rounded bg-slate-200" />
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-full rounded bg-slate-100" />
                  <div className="h-3 w-4/5 rounded bg-slate-100" />
                  <div className="h-3 w-3/5 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Chưa có dịch vụ nào.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((s) => (
              <Link
                to={`/services/${s._id}`}
                key={s._id}
                className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-teal-300"
              >
                <IconSquare iconKey={s.iconKey} />

                <h3 className="mt-4 text-base font-semibold text-slate-900 group-hover:text-slate-900">
                  {s.name}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-3">
                  {s.description || "Thông tin đang được cập nhật."}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
