import { useNavigate } from "react-router-dom";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="login-gradient-bg min-h-screen font-sans">
      {/* Brand Navbar */}
      <nav className="absolute top-0 inset-x-0 w-full max-w-[1280px] mx-auto px-8 py-6 flex justify-between items-center z-20">
        <div className="text-white text-[22px] font-bold tracking-[-0.5px]">
          WorkForce <span className="text-blue-500">OS</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="w-full min-h-screen pt-[100px] px-6 pb-10 flex items-center justify-center relative z-10">
        <div className="opacity-0 [animation:fadeInUp_0.5s_ease-out_forwards] w-full max-w-[440px] box-border p-10 flex flex-col items-center bg-white border border-slate-200 rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.2),0_8px_10px_-6px_rgba(0,0,0,0.1)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_25px_30px_-5px_rgba(0,0,0,0.25)] text-center">
          
          <div className="text-[72px] leading-none mb-5 select-none">
            🛑
          </div>
          
          <h1 className="m-0 text-[22px] font-bold text-slate-900 mb-3 tracking-tight">
            Whoa there, partner!
          </h1>
          
          <p className="mt-1 mb-8 text-slate-500 text-[15px] leading-relaxed">
            You are not authorized to access this page. It's strictly off-limits unless you know the secret handshake! :( <br /><br />
            Let's get you back to familiar territory before the alarms go off.
          </p>

          <button
            onClick={() => navigate(-1)}
            className="w-full px-5 py-3 bg-blue-600 text-white rounded-lg font-sans text-sm font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-700 active:bg-blue-800"
          >
            Go Back
          </button>
        </div>
      </main>
    </div>
  );
}
