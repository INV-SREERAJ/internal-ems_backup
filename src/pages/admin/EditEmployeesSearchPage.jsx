import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function EditEmployeeSearchPage() {
  const [employeeCode, setEmployeeCode] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();

    const code = employeeCode.trim();

    if (!code) {
      setError("Please enter an employee code.");
      return;
    }

    setError("");

    navigate(`/admin/employees/edit/${encodeURIComponent(code)}`);
  };

  return (
    <section className="w-full max-w-[1400px] mx-auto font-sans">
      <div className="mb-6">
        <h1 className="m-0 text-slate-900 text-[28px] font-bold tracking-[-0.5px] max-[767px]:text-2xl">
          Edit Employee
        </h1>
        <p className="mt-1.5 mb-0 text-slate-500 text-sm">
          Enter an employee code to find the employee you want to edit.
        </p>
      </div>

      <div className="max-w-[700px] p-7 bg-white border border-slate-200 rounded-xl shadow-sm max-[767px]:p-5">
        <form onSubmit={handleSearch}>
          <label
            htmlFor="employeeCode"
            className="block mb-2 text-slate-700 text-sm font-semibold"
          >
            Employee Code
          </label>

          <div className="flex gap-3 max-[480px]:flex-col">
            <input
              id="employeeCode"
              type="text"
              value={employeeCode}
              onChange={(e) => {
                setEmployeeCode(e.target.value);
                setError("");
              }}
              placeholder="Enter employee code"
              autoComplete="off"
              className="flex-1 h-[42px] px-3 box-border border border-slate-300 rounded-lg bg-white text-slate-900 font-sans text-sm outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-600/10"
            />

            <button
              type="submit"
              className="h-[42px] px-5 bg-blue-600 text-white border-none rounded-lg font-sans text-sm font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-700 max-[480px]:w-full"
            >
              Search
            </button>
          </div>

          {error && (
            <p className="mt-2 mb-0 text-red-600 text-[13px] font-medium">
              {error}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
