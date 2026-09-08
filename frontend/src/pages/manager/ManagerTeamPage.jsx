import { useEffect, useState } from "react";
import api from "../../api/axios";
import ManagerEmployeeViewDialog from "../../components/manager/ManagerEmployeeViewDialog";
import EmployeeTable from "../../components/common/EmployeeTable";
import Pagination from "../../components/common/Pagination";

export default function ManagerTeamPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [sortBy, setSortBy] = useState("");
  const [descending, setDescending] = useState(false);

  const [viewingEmployee, setViewingEmployee] = useState(null);

  // Debouncing for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageNumber(1);
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchTeam = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/manager/employees", {
          params: {
            pageNumber,
            pageSize: 10,
            search: debouncedSearch,
            sortBy,
            descending,
          },
        });

        setEmployees(response.data.data || []);
        setTotalPages(response.data.totalPages || 0);
        setTotalCount(response.data.totalCount || 0);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load team members.");
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [pageNumber, debouncedSearch, sortBy, descending]);

  const handlePrevious = () => setPageNumber((current) => current - 1);
  const handleNext = () => setPageNumber((current) => current + 1);

  const handleSort = (field) => {
    if (sortBy !== field) {
      setSortBy(field);
      setDescending(false);
    } else if (!descending) {
      setDescending(true);
    } else {
      setSortBy("");
      setDescending(false);
    }
  };



  return (
    <section className="w-full max-w-[1400px] mx-auto">
      <div className="mb-6 flex items-center justify-between max-[767px]:mb-[18px]">
        <div>
          <h1 className="m-0 text-slate-900 text-[28px] font-bold tracking-[-0.5px] max-[767px]:text-2xl">
            My Direct Reports
          </h1>
          <p className="mt-1.5 mb-0 text-slate-500 text-sm max-[767px]:text-[13px]">
            View and manage employees reporting directly to you ({totalCount}{" "}
            total).
          </p>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-3 max-[767px]:flex-wrap">
        <div className="w-full max-w-[380px] max-[767px]:max-w-none">
          <input
            type="search"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search reporting employees"
            className="w-full box-border px-3.5 py-[11px] bg-white text-slate-900 border border-slate-300 rounded-lg font-sans text-sm outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/15"
          />
        </div>
      </div>

      {loading && (
        <div className="p-6 py-12 bg-white border border-slate-200 rounded-xl text-slate-500 text-center">
          <p className="m-0 text-sm">Loading direct reports...</p>
        </div>
      )}

      {!loading && error && (
        <div className="p-6 py-12 bg-red-50 border border-red-300 rounded-xl text-red-700 text-center">
          <p className="m-0 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && employees.length === 0 && (
        <div className="p-6 py-12 bg-white border border-slate-200 rounded-xl text-slate-500 text-center">
          <p className="m-0 text-sm">
            {debouncedSearch
              ? "No reporting employees match your search."
              : "No employees currently report to you."}
          </p>
        </div>
      )}

      {!loading && !error && employees.length > 0 && (
        <>
          <EmployeeTable
            employees={employees}
            onSort={handleSort}
            sortBy={sortBy}
            descending={descending}
            onView={(code) => setViewingEmployee(code)}
            showManager={false}
          />

          {/* Pagination */}
          <Pagination
            pageNumber={pageNumber}
            totalPages={totalPages}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onPageClick={setPageNumber}
          />
        </>
      )}

      {/* View Details Dialog */}
      <ManagerEmployeeViewDialog
        employeeCode={viewingEmployee}
        onClose={() => setViewingEmployee(null)}
      />
    </section>
  );
}
