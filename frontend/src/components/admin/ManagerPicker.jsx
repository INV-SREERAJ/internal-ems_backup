import { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import { EMPLOYEE_STATUS } from "../../utils/constants";

export default function ManagerPicker({
  value,
  onChange,
  excludeEmployeeCode,
  disabled = false,
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const wrapperRef = useRef(null);

  // Guards against out-of-order responses: only the response matching the
  // most recently fired request is applied to state.
  const latestRequestId = useRef(0);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Search Managers and Admins
  useEffect(() => {
    const searchManagers = async () => {
      const searchTerm = debouncedQuery.trim();

      if (searchTerm.length < 2) {
        setResults([]);
        setSearchError("");
        setIsLoading(false);
        return;
      }

      const requestId = ++latestRequestId.current;

      try {
        setIsLoading(true);
        setSearchError("");

        const [mgrRes, adminRes] = await Promise.allSettled([
          api.get("/admin/employees", {
            params: {
              search: searchTerm,
              role: "Manager",
              status: EMPLOYEE_STATUS.Active,
              pageSize: 10,
            },
          }),
          api.get("/admin/employees", {
            params: {
              search: searchTerm,
              role: "Admin",
              status: EMPLOYEE_STATUS.Active,
              pageSize: 10,
            },
          }),
        ]);

        // Ignore this response if a newer search has since been fired.
        if (requestId !== latestRequestId.current) {
          return;
        }

        const managerResults =
          mgrRes.status === "fulfilled" ? (mgrRes.value.data?.data ?? []) : [];
        const adminResults =
          adminRes.status === "fulfilled"
            ? (adminRes.value.data?.data ?? [])
            : [];

        if (mgrRes.status === "rejected" && adminRes.status === "rejected") {
          setResults([]);
          setSearchError(
            mgrRes.reason?.response?.data?.message ||
              "Failed to search for managers.",
          );
          return;
        }

        const candidates = [...managerResults, ...adminResults].filter(
          (candidate) => candidate.employeeCode !== excludeEmployeeCode,
        );

        setResults(candidates);
      } catch (error) {
        if (requestId !== latestRequestId.current) {
          return;
        }
        setResults([]);
        setSearchError(
          error.response?.data?.message || "Failed to search for managers.",
        );
      } finally {
        if (requestId === latestRequestId.current) {
          setIsLoading(false);
        }
      }
    };

    searchManagers();
  }, [debouncedQuery, excludeEmployeeCode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleQueryChange = (event) => {
    const newQuery = event.target.value;

    setQuery(newQuery);
    setIsOpen(true);

    if (!newQuery.trim()) {
      setResults([]);
      setSearchError("");
    }
  };

  const handleSelect = (manager) => {
    onChange(manager.employeeCode, manager.fullName);

    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  if (disabled) {
    return (
      <div className="manager-picker manager-picker-disabled">
        <input type="text" value="Not applicable for Admin" disabled />
      </div>
    );
  }

  return (
    <div className="manager-picker" ref={wrapperRef}>
      {value?.managerName && (
        <div className="manager-picker-current">
          Currently reporting to: {value.managerName} (
          {value.managerEmployeeCode})
        </div>
      )}

      <input
        type="text"
        value={query}
        onChange={handleQueryChange}
        onFocus={() => setIsOpen(true)}
        placeholder="Search by name or employee code"
      />

      {isOpen && (
        <div className="manager-picker-dropdown">
          {query.trim().length > 0 && query.trim().length < 2 && (
            <div className="manager-picker-message">
              Type at least 2 characters.
            </div>
          )}

          {isLoading && (
            <div className="manager-picker-message">Searching...</div>
          )}

          {!isLoading && searchError && (
            <div className="manager-picker-error">{searchError}</div>
          )}

          {!isLoading &&
            !searchError &&
            query.trim().length >= 2 &&
            results.length === 0 && (
              <div className="manager-picker-message">No managers found.</div>
            )}

          {!isLoading &&
            !searchError &&
            results.map((manager) => (
              <button
                key={manager.employeeCode}
                type="button"
                className="manager-picker-option"
                onClick={() => handleSelect(manager)}
              >
                {manager.fullName} ({manager.employeeCode})
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
