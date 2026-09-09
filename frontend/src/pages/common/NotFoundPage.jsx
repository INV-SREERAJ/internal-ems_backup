import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { getDefaultRoute } from "../../App";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

export default function NotFoundPage() {
  const { user } = useAuth();
  const defaultRoute = getDefaultRoute(user);

  return (
    <section className="w-full max-w-[600px] mx-auto pt-20 font-sans text-center">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex flex-col items-center">
        <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-6">
          <HiOutlineMagnifyingGlass size={40} />
        </div>
        <h1 className="m-0 text-slate-900 text-[28px] font-bold tracking-tight mb-3">
          404 - Page Not Found
        </h1>
        <p className="text-slate-500 text-[15px] leading-relaxed mb-8 max-w-[400px]">
          We couldn't find the page you were looking for. It might have been moved, deleted, or perhaps it never existed!
        </p>
        <Link
          to={defaultRoute}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-sans text-sm font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-700 active:bg-blue-800 no-underline"
        >
          Go to Dashboard
        </Link>
      </div>
    </section>
  );
}
