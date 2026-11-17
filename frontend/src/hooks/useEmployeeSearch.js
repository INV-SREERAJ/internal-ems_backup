import { useState, useEffect } from "react";
import api from "../api/axios";

/**
 * Custom hook to search all employees with debouncing and abort controller.
 * Mirrors the structure of useManagerSearch but searches all employees across roles.
 */
export function useEmployeeSearch(searchQuery) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    const trimmedSearch = debouncedSearch?.trim() || "";

    if (trimmedSearch.length < 2) {
      setEmployees([]);
      setLoading(false);
      setError(null);
      return;
    }

    const abortController = new AbortController();

    const fetchEmployees = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/admin/employees", {
          params: {
            pageNumber: 1,
            pageSize: 20,
            search: trimmedSearch,
          },
          signal: abortController.signal,
        });

        if (!abortController.signal.aborted) {
          setEmployees(response.data?.data || []);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error("Failed to fetch employees:", err);
          setError("Failed to load employees.");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchEmployees();

    return () => {
      abortController.abort();
    };
  }, [debouncedSearch]);

  return { employees, loading, error };
}

