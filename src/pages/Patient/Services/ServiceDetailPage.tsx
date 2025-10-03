import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { serviceApi } from "../../../api/serviceApi";

interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  isActive: boolean;
}

const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceDetail = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await serviceApi.getServiceById(id);
        setService({
          _id: data._id,
          name: data.name,
          description: data.description,
          price: data.price,
          duration: data.duration ?? 30,
          isActive: data.isActive,
        });
        setError(null);
      } catch (err) {
        console.error("Error fetching service details:", err);
        setError("Không thể tải thông tin dịch vụ. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetail();
  }, [id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">
            {error || "Không tìm thấy dịch vụ"}
          </span>
        </div>
        <div className="mt-4">
          <Link to="/services" className="text-teal-500 hover:underline">
            &larr; Quay lại danh sách dịch vụ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link to="/services" className="text-teal-500 hover:underline">
          &larr; Quay lại danh sách dịch vụ
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          {service.name}
        </h1>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="bg-teal-50 text-teal-700 px-4 py-2 rounded-full">
            <span className="font-semibold">Giá:</span>{" "}
            {formatPrice(service.price)}
          </div>
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full">
            <span className="font-semibold">Thời gian:</span> {service.duration}{" "}
            phút
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            Mô tả dịch vụ
          </h2>
          <div className="prose max-w-none text-gray-600">
            <p>{service.description}</p>
          </div>
        </div>

        <div className="mt-8">
          <Link
            to="/appointment"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-400 text-white rounded-md hover:opacity-90 transition duration-200"
          >
            Đặt lịch khám với dịch vụ này
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;
