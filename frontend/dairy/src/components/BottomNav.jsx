import { NavLink, useNavigate } from "react-router-dom";
import {
  FaChartBar,
  FaGlassWhiskey,
  FaUsers,
  FaMoneyBillWave,
  FaSignOutAlt,
  FaUser,
} from "react-icons/fa";
import { authService } from "../services/api";

const BottomNav = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  if (!user) return null;

  const handleLogout = () => {
    authService.logout();
    navigate("/");
  };

  const ownerLinks = [
    { to: "/dashboard", label: "Dashboard", icon: <FaChartBar className="text-xl" /> },
    { to: "/milk", label: "Milk", icon: <FaGlassWhiskey className="text-xl" /> },
    { to: "/people", label: "People", icon: <FaUsers className="text-xl" /> },
    { to: "/billing", label: "Hisaab", icon: <FaMoneyBillWave className="text-xl" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {user.role === "owner" ? (
          ownerLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors ${
                  isActive ? "text-green-600 font-semibold scale-105" : "text-gray-500 hover:text-gray-700"
                }`
              }
            >
              <div className="mb-1">{link.icon}</div>
              <span>{link.label}</span>
            </NavLink>
          ))
        ) : (
          <>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors ${
                  isActive ? "text-green-600 font-semibold" : "text-gray-500 hover:text-gray-700"
                }`
              }
            >
              <FaUser className="text-xl mb-1" />
              <span>My Profile</span>
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center flex-1 h-full text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
            >
              <FaSignOutAlt className="text-xl mb-1" />
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default BottomNav;
