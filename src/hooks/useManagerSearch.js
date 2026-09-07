import { useState, useEffect } from "react";
import api from "../api/axios";

export function useManagerSearch(searchQuery) {
  const [managers, setManagers] = useState([]);
  const [managerLoading, setManagerLoading] = useState(false);
  const [managerError, setManagerError] = useState(null);
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
      setManagers([]);
      setManagerLoading(false);
      setManagerError(null);
      return;
    }

    const abortController = new AbortController();

    const fetchManagers = async () => {
      setManagerLoading(true);
      setManagerError(null);

      try {
        const [adminRes, managerRes] = await Promise.all([
          api.get("/admin/employees", {
            params: {
              pageNumber: 1,
              pageSize: 50,
              role: "admin",
              search: trimmedSearch,
            },
            signal: abortController.signal,
          }),
          api.get("/admin/employees", {
            params: {
              pageNumber: 1,
              pageSize: 50,
              role: "manager",
              search: trimmedSearch,
            },
            signal: abortController.signal,
          }),
        ]);

        const combined = [...adminRes.data.data, ...managerRes.data.data];

        // Deduplicate in case a user is somehow returned in both (unlikely since role is specific)
        const uniqueManagers = Array.from(
          new Map(combined.map((m) => [m.employeeCode, m])).values()
        );

        if (!abortController.signal.aborted) {
          setManagers(uniqueManagers);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Failed to fetch managers:", error);
          setManagerError("Failed to load managers.");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setManagerLoading(false);
        }
      }
    };

    fetchManagers();

    return () => {
      abortController.abort();
    };
  }, [debouncedSearch]);

  return { managers, managerLoading, managerError };
}
