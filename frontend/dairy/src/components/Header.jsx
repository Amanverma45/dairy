import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaUserCircle, FaSignOutAlt, FaMapMarkerAlt, FaUser } from "react-icons/fa";
import { authService } from "../services/api";

const Header = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    setIsOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3.5">

        {/* Left Brand Area */}
        <div>
          <h1 className="text-lg md:text-xl font-extrabold text-slate-800 flex items-center gap-1.5">
            🥛 <span className="bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">बालाजी दूध डेयरी</span>
          </h1>

          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider pl-6">
            स्मार्ट डेयरी प्रबंधन प्रणाली
          </p>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-4 relative">

          <button className="relative p-2 hover:bg-slate-100 rounded-full transition-all">
            <FaBell className="text-lg text-slate-600" />
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white"></span>
          </button>

          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
            title="Profile Menu"
          >
            <FaUserCircle className="text-2xl text-blue-600" />
          </button>

          {/* Profile Dropdown Overlay */}
          {isOpen && user && (
            <div className="absolute right-0 top-12 w-64 bg-white border border-slate-150 rounded-2xl shadow-xl p-4 z-[100] transition-all space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* User Info Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="font-extrabold text-sm text-slate-800 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{user.phone}</p>
                </div>
              </div>

              {/* Profile Info Fields */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <FaUser className="text-slate-400 text-xs" />
                  <span>भूमिका: <strong>{user.role === "owner" ? "डेयरी मालिक (Owner)" : user.role === "supplier" ? "सप्लायर (Supplier)" : "ग्राहक (Customer)"}</strong></span>
                </div>
                {user.village && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <FaMapMarkerAlt className="text-rose-500 text-xs" />
                    <span>गाँव: <strong>{user.village}</strong></span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition cursor-pointer active:scale-98"
              >
                <FaSignOutAlt className="text-xs" />
                लॉगआउट करें (Logout)
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};

export default Header;