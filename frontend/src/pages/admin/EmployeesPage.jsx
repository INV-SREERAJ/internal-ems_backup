import EmployeeTable from "../../components/admin/EmployeeTable";
import EmployeeViewDialog from "../../components/admin/EmployeeViewDialog";
import "./EmployeePage.css";

import { useEffect, useState } from "react";
import api from "../../api/axios";

import { Link } from "react-router-dom";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [sortBy, setSortBy] = useState("");
  const [descending, setDescending] = useState(false);

  // View dialog – holds the employeeCode of the employee being viewed
  const [viewingEmployee, setViewingEmployee] = useState(null);

  // Bumped after a successful delete to force a refetch
  const [refreshKey, setRefreshKey] = useState(0);

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

  return (
    <section className="employees-page">
      <div className="employees-page-header">
        <div>
          <h1>Employees</h1>
          <p>Manage employees in your organization.</p>
        </div>
      </div>

      <div className="employees-toolbar">
        <div className="employees-search">
          <input
            type="search"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search employees"
          />
        </div>

        

        <Link
          to="/admin/employees/create-employee"
          className="add-employee-btn"
        >
          + Add Employee
        </Link>
      </div>

      {loading && (
        <div className="employees-state">
          <p>Loading employees...</p>
        </div>
      )}

      {!loading && error && (
        <div className="employees-state employees-state-error">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && employees.length === 0 && (
        <div className="employees-state">
          <p>No employees found.</p>
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

          <div className="employees-pagination">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={pageNumber === 1}
              className="employees-pagination-nav"
            >
              ‹ Previous
            </button>

            <div className="employees-pagination-pages">
              {getPageNumbers(pageNumber, totalPages).map((page, index) =>
                page === "..." ? (
                  <span
                    key={`dots-${index}`}
                    className="employees-pagination-ellipsis"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setPageNumber(page)}
                    className={`employees-pagination-page${
                      page === pageNumber
                        ? " employees-pagination-page-active"
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
              className="employees-pagination-nav"
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
