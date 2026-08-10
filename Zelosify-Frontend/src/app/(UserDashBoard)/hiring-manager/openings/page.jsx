"use client";
import { useState, useEffect } from "react";
import { Search, FileText, MapPin, Briefcase, Users } from "lucide-react";
import axiosInstance from "@/utils/Axios/AxiosInstance";

const statusColors = {
  OPEN: "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-400",
  CLOSED: "bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-400",
  ON_HOLD: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400",
};

export default function ManagerOpeningsLayout() {
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOpenings();
  }, [currentPage]);

  const fetchOpenings = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/hiring-manager/openings?page=${currentPage}&limit=10`
      );
      setOpenings(response.data.openings);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching openings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOpenings = openings.filter(
    (opening) =>
      (opening.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opening.location || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-background px-2">
      <div className="flex-1 overflow-y-auto transition-all duration-300">
        <div className="p-4">
          <div className="flex justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">
              Contract Openings
            </h1>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="text"
                placeholder="Search openings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring w-full"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredOpenings.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">
                No openings found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No contract openings match your search criteria.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredOpenings.map((opening) => (
                <a
                  key={opening.id}
                  href={`/hiring-manager/openings/${opening.id}`}
                  className="block p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {opening.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {opening.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {opening.location}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Briefcase className="w-4 h-4" />
                          {opening.contractType}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          statusColors[opening.status] ||
                          "bg-gray-50 text-gray-700"
                        }`}
                      >
                        {opening.status}
                      </span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {opening.stats.totalProfiles} profiles
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="text-green-600">
                          {opening.stats.shortlisted} shortlisted
                        </span>
                        <span className="text-red-600">
                          {opening.stats.rejected} rejected
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-border rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-border rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
