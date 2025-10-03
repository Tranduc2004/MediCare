import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { specialtyApi } from "../../../api/specialtyApi";

interface Specialty {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
}

const SpecialtyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [specialty, setSpecialty] = useState<Specialty | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpecialtyDetail = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await specialtyApi.getSpecialtyById(id);
        setSpecialty({
          _id: data._id,
          name: data.name,
          description: data.description,
          isActive: data.isActive,
        });
        setError(null);
      } catch (err) {
        console.error("Error fetching specialty details:", err);
        setError("Không thể tải thông tin chuyên khoa. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialtyDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  if (error || !specialty) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">
            {error || "Không tìm thấy chuyên khoa"}
          </span>
        </div>
        <div className="mt-4">
          <Link to="/specialties" className="text-teal-500 hover:underline">
            &larr; Quay lại danh sách chuyên khoa
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link to="/specialties" className="text-teal-500 hover:underline">
          &larr; Quay lại danh sách chuyên khoa
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          {specialty.name}
        </h1>

        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            Mô tả chuyên khoa
          </h2>
          <div className="prose max-w-none text-gray-600">
            <p>{specialty.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialtyDetailPage;
