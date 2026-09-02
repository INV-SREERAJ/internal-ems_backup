import { useEffect, useState } from "react";
import api from "../../api/axios";
import ManagerEmployeeViewDialog from "../../components/manager/ManagerEmployeeViewDialog";
import {
  STATUS_LABEL,
  STATUS_CLASS,
} from "../../utils/constants";
import { HiOutlineEye } from "react-icons/hi2";

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

  function getPageNumbers(current, total) {
    const delta = 1;
    const pages = [];

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        pages.push(i);
      }
    }

    const withDots = [];
    let prev;
    for (const page of pages) {
      if (prev) {
        if (page - prev === 2) {
          withDots.push(prev + 1);
        } else if (page - prev > 2) {
          withDots.push("...");
        }
      }
      withDots.push(page);
      prev = page;
    }

    return withDots;
  }

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
          <div className="w-full overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.06),0_2px_4px_-2px_rgba(0,0,0,0.05)]">
            <table className="w-full min-w-[750px] border-collapse text-sm">
              <thead>
                <tr>
                  <th
                    className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold text-left whitespace-nowrap cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort("EmployeeCode")}
                  >
                    Employee Code {sortBy === "EmployeeCode" && (descending ? "↓" : "↑")}
                  </th>
                  <th
                    className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold text-left whitespace-nowrap cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort("FirstName")}
                  >
                    Name {sortBy === "FirstName" && (descending ? "↓" : "↑")}
                  </th>
                  <th className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold text-left whitespace-nowrap">
                    Email
                  </th>
                  <th className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold text-left whitespace-nowrap">
                    Phone Number
                  </th>
                  <th className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold text-left whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold text-center whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="[&>tr:last-child>td]:border-b-0">
                {employees.map((emp) => (
                  <tr
                    key={emp.employeeCode}
                    className="hover:bg-slate-50/80 transition-colors duration-150"
                  >
                    <td className="px-6 py-3.5 border-b border-slate-100 font-medium text-slate-900 whitespace-nowrap">
                      {emp.employeeCode}
                    </td>
                    <td className="px-6 py-3.5 border-b border-slate-100 text-slate-700 whitespace-nowrap font-medium">
                      {emp.firstName} {emp.lastName}
                    </td>
                    <td className="px-6 py-3.5 border-b border-slate-100 text-slate-600 whitespace-nowrap">
                      {emp.email}
                    </td>
                    <td className="px-6 py-3.5 border-b border-slate-100 text-slate-600 whitespace-nowrap">
                      {emp.phoneNumber || "—"}
                    </td>
                    <td className="px-6 py-3.5 border-b border-slate-100 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-[3px] rounded-full text-xs font-semibold ${
                          STATUS_CLASS[Number(emp.status)] ||
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {STATUS_LABEL[emp.status] || emp.status || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 border-b border-slate-100 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setViewingEmployee(emp.employeeCode)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                      >
                        <HiOutlineEye size={15} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-2 max-[767px]:flex-wrap">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={pageNumber === 1}
                className="px-4 py-[9px] bg-white text-blue-600 border border-slate-300 rounded-lg font-sans text-[13px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed max-[767px]:px-3 max-[767px]:py-2"
              >
                ‹ Previous
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers(pageNumber, totalPages).map((page, index) =>
                  page === "..." ? (
                    <span
                      key={`dots-${index}`}
                      className="min-w-5 inline-flex items-center justify-center text-slate-400 text-[13px]"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setPageNumber(page)}
                      className={`min-w-[34px] h-[34px] px-1.5 inline-flex items-center justify-center bg-white text-slate-600 border border-slate-200 rounded-lg font-sans text-[13px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 max-[767px]:px-3 max-[767px]:py-2${
                        page === pageNumber
                          ? " !bg-blue-600 !text-white !border-blue-600"
                          : ""
                      }`}
                      aria-current={page === pageNumber ? "page" : undefined}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={pageNumber === totalPages}
                className="px-4 py-[9px] bg-white text-blue-600 border border-slate-300 rounded-lg font-sans text-[13px] font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed max-[767px]:px-3 max-[767px]:py-2"
              >
                Next ›
              </button>
            </div>
          )}
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
