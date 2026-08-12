import { FaBell, FaUserCircle } from "react-icons/fa";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">

        {/* Left */}
        <div>
          <h1 className="text-xl font-bold text-green-700">
            MilkFlow
          </h1>

          <p className="text-xs text-gray-500">
            Dairy Management System
          </p>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">

          <button className="relative">
            <FaBell className="text-xl text-gray-700" />

            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          <button>
            <FaUserCircle className="text-3xl text-green-700" />
          </button>

        </div>

      </div>
    </header>
  );
};

export default Header;