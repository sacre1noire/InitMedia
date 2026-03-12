import React, { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { searchCandidates } from "@/services/employerService";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";

const CandidateSearchPage: React.FC = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const data = await searchCandidates(search);
      setCandidates(data);
    } catch (error) {
      console.error("Failed to search candidates", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Поиск кандидатов
        </h1>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Поиск по имени или навыкам..."
            className="input-field flex-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="submit"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            <Search size={20} />
          </button>
        </form>

        {loading ? (
          <div className="text-center py-10">Загрузка...</div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Кандидатов не найдено.
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map((candidate) => (
              <Link
                to={`/employer/candidates/${candidate.id}`}
                key={candidate.id}
                className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-primary-600">
                      {candidate.full_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {candidate.specialization || "Специализация не указана"}
                    </p>
                  </div>
                  <div className="text-sm text-gray-400">{candidate.email}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CandidateSearchPage;
