import { useEffect, useState } from "react";
import api from "../../api/axios";
import { HiOutlineUserGroup, HiOutlineEnvelope, HiOutlinePhone, HiOutlineUser } from "react-icons/hi2";

export default function EmployeeDashboard() {
  const [manager, setManager] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchManager = async () => {
      try {
        setLoading(true);
        // Using the new endpoint created by the user
        const response = await api.get("/profile/my-manager");
        setManager(response.data);
        setError(null);
      } catch (err) {
        // If 404, it might mean no manager is assigned
        if (err.response?.status === 404) {
          setManager(null);
          setError("No reporting manager is currently assigned to you.");
        } else {
          setError(err.response?.data?.message || "Failed to load manager details.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchManager();
  }, []);

  return (
    <section className="w-full max-w-[1400px] mx-auto min-h-[calc(100vh-120px)] flex flex-col items-center pt-8">
      <div className="mb-8 text-center w-full">
        <h1 className="m-0 text-slate-900 text-[28px] font-bold tracking-[-0.5px] max-[767px]:text-2xl">
          Dashboard
        </h1>
        <p className="mt-1.5 mb-0 text-slate-500 text-sm max-[767px]:text-[13px]">
          Welcome to the Employee Portal.
        </p>
      </div>

      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-center">
          <h2 className="m-0 text-slate-800 text-[15px] font-semibold text-center">
            My Reporting Manager
          </h2>
        </div>

        <div className="p-6 md:p-8">
          {loading ? (
            <div className="flex flex-col items-center gap-4 animate-pulse py-4">
              <div className="w-20 h-20 rounded-full bg-slate-100" />
              <div className="space-y-3 flex flex-col items-center">
                <div className="h-4 w-32 bg-slate-100 rounded" />
                <div className="h-3 w-24 bg-slate-100 rounded" />
              </div>
            </div>
          ) : error && !manager ? (
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <HiOutlineUserGroup size={24} className="text-slate-400" />
              </div>
              <p className="m-0 text-sm text-slate-500 max-w-[250px]">
                {error}
              </p>
            </div>
          ) : manager ? (
            <div className="flex flex-col items-center text-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mb-4 shrink-0 overflow-hidden leading-none aspect-square bg-blue-50"
              >
                <HiOutlineUser size={40} className="text-blue-600" />
              </div>
              
              <h3 className="m-0 text-slate-900 font-bold text-xl mb-1">
                {manager.managerName}
              </h3>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600 mb-6 inline-block tracking-wide">
                {manager.managerEmployeeCode}
              </span>

              <div className="w-full flex flex-col gap-3 pt-6 border-t border-slate-100">
                {manager.managerEmail && (
                  <a
                    href={`mailto:${manager.managerEmail}`}
                    className="flex items-center justify-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <HiOutlineEnvelope size={18} className="shrink-0 text-slate-400" />
                    <span className="truncate">{manager.managerEmail}</span>
                  </a>
                )}
                {manager.managerPhonenumber && (
                  <a
                    href={`tel:${manager.managerPhonenumber}`}
                    className="flex items-center justify-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <HiOutlinePhone size={18} className="shrink-0 text-slate-400" />
                    {manager.managerPhonenumber}
                  </a>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
