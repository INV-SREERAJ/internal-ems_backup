import EmployeeTable from "../../components/admin/EmployeeTable";
import EmployeeViewDialog from "../../components/admin/EmployeeViewDialog";

import { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import { RxChevronDown, RxCheck } from "react-icons/rx";

import { Link } from "react-router-dom";

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "admin", label: "Admin" },
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedRole, setSelectedRole] = useState("");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef(null);

  const [sortBy, setSortBy] = useState("");
  const [descending, setDescending] = useState(false);

  // View dialog – holds the employeeCode of the employee being viewed
  const [viewingEmployee, setViewingEmployee] = useState(null);

  // Bumped after a successful delete to force a refetch
  const [refreshKey, setRefreshKey] = useState(0);

  // Click outside to close role dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target)
      ) {
        setRoleDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //debouncing for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageNumber(1);
      setDebouncedSearch(search);
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/admin/employees", {
          params: {
            pageNumber,
            pageSize: 10,
            search: debouncedSearch,
            role: selectedRole || undefined,
            sortBy,
            descending,
          },
        });

        setEmployees(response.data.data);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        setError("Failed to load employees.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [
    pageNumber,
    debouncedSearch,
    selectedRole,
    descending,
    sortBy,
    refreshKey,
  ]);

  const handlePrevious = () => {
    setPageNumber((current) => current - 1);
  };

  const handleNext = () => {
    setPageNumber((current) => current + 1);
  };

  const handleSort = (field) => {
    if (sortBy !== field) {
      setSortBy(field);
      setDescending(false); // click 1: ascending on a new column
    } else if (!descending) {
      setDescending(true); // click 2: descending
    } else {
      setSortBy(""); // click 3: reset — no sort
      setDescending(false);
    }
  };

  // Called when the view dialog successfully deletes an employee
  const handleDeleted = () => {
    // If this was the last row on the current page (and not page 1),
    // step back a page; otherwise just refetch the current page.
    if (employees.length === 1 && pageNumber > 1) {
      setPageNumber((current) => current - 1);
    } else {
      setRefreshKey((key) => key + 1);
    }
  };

  function getPageNumbers(current, total) {
    const delta = 1; // how many pages to show on each side of current
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

    //for pagination
    const withDots = [];
    let prev;
    for (const page of pages) {
      if (prev) {
        if (page - prev === 2) {
          withDots.push(prev + 1); // fill single gaps instead of "..."
        } else if (page - prev > 2) {
          withDots.push("...");
        }
      }
      withDots.push(page);
      prev = page;
    }

    return withDots;
  }

  const currentRoleLabel =
    ROLE_OPTIONS.find((opt) => opt.value === selectedRole)?.label || "All Roles";

  return (
    <section className="w-full max-w-[1400px] mx-auto">
      <div className="mb-6 flex items-center justify-between max-[767px]:mb-[18px]">
        <div>
          <h1 className="m-0 text-slate-900 text-[28px] font-bold tracking-[-0.5px] max-[767px]:text-2xl">
            Employees
          </h1>
          <p className="mt-1.5 mb-0 text-slate-500 text-sm max-[767px]:text-[13px]">
            Manage employees in your organization.
          </p>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-3 max-[767px]:flex-wrap">
        <div className="w-full max-w-[360px] max-[767px]:max-w-none">
          <input
            type="search"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search employees"
            className="w-full box-border px-3.5 py-[11px] bg-white text-slate-900 border border-slate-300 rounded-lg font-sans text-sm outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/15"
          />
        </div>

        {/* Role Filter Dropdown */}
        <div
          className="relative min-w-[160px] max-[767px]:w-full"
          ref={roleDropdownRef}
        >
          <button
            type="button"
            onClick={() => setRoleDropdownOpen((prev) => !prev)}
            aria-expanded={roleDropdownOpen}
            aria-label="Filter employees by role"
            className={`w-full box-border px-3.5 py-[11px] bg-white text-slate-800 border rounded-lg font-sans text-sm font-normal flex items-center justify-between cursor-pointer outline-none transition-[border-color,box-shadow] duration-150 ${
              roleDropdownOpen
                ? "border-blue-600 ring-[3px] ring-blue-600/15"
                : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="text-slate-400 text-xs font-normal">Role:</span>
              <span className="text-slate-800 font-normal">
                {currentRoleLabel}
              </span>
            </div>
            <RxChevronDown
              size={15}
              className={`text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
                roleDropdownOpen ? "rotate-180 text-blue-600" : ""
              }`}
            />
          </button>

          {roleDropdownOpen && (
            <div className="absolute top-[calc(100%+6px)] left-0 w-full min-w-[170px] p-1.5 box-border bg-white border border-slate-200 rounded-xl shadow-[0_10px_25px_-5px_rgba(15,23,42,0.12),0_8px_10px_-6px_rgba(15,23,42,0.08)] z-30 flex flex-col gap-0.5">
              {ROLE_OPTIONS.map((opt) => {
                const isSelected = selectedRole === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedRole(opt.value);
                      setPageNumber(1);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full box-border px-3 py-2 flex items-center justify-between bg-transparent border-none rounded-lg font-sans text-sm font-normal text-left cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <RxCheck
                        size={16}
                        className="text-blue-600 shrink-0 ml-2"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Link
          to="/admin/employees/create-employee"
          className="ml-auto inline-flex items-center justify-center px-4 py-[11px] bg-blue-600 text-white border border-blue-600 rounded-lg font-sans text-sm font-semibold no-underline whitespace-nowrap transition-colors duration-150 hover:bg-blue-700 hover:border-blue-700 max-[767px]:ml-0 max-[767px]:w-full"
        >
          + Add Employee
        </Link>
      </div>

      {loading && (
        <div className="p-6 py-12 bg-white border border-slate-200 rounded-xl text-slate-500 text-center">
          <p className="m-0 text-sm">Loading employees...</p>
        </div>
      )}

      {!loading && error && (
        <div className="p-6 py-12 bg-red-50 border border-red-300 rounded-xl text-red-700 text-center">
          <p className="m-0 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && employees.length === 0 && (
        <div className="p-6 py-12 bg-white border border-slate-200 rounded-xl text-slate-500 text-center">
          <p className="m-0 text-sm">No employees found.</p>
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
          />

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
                ),
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
        </>
      )}

      {/* Employee view/details dialog */}
      <EmployeeViewDialog
        employeeCode={viewingEmployee}
        onClose={() => setViewingEmployee(null)}
        onDeleted={handleDeleted}
      />
    </section>
  );
}