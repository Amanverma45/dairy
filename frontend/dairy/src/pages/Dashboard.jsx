import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FaGlassWhiskey,
  FaUsers,
  FaUserFriends,
  FaRupeeSign,
  FaUserPlus,
  FaSignOutAlt,
  FaClipboardList,
} from "react-icons/fa";
import Header from "../components/Header";
import PageContainer from "../components/PageContainer";
import SummaryCard from "../components/dashboard/SummaryCard";
import QuickActionCard from "../components/dashboard/QuickActionCard";
import { authService, userService, milkService } from "../services/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    suppliers: 0,
    customers: 0,
    todayMilk: 0,
    monthlyIncome: 0,
  });
  const [recentEntries, setRecentEntries] = useState([]);

  const user = authService.getCurrentUser();

  useEffect(() => {
    // Redirect if not logged in or if role is client
    if (!user) {
      navigate("/");
      return;
    }
    if (user.role !== "owner") {
      navigate("/profile");
      return;
    }

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Users
        const users = await userService.getAll();
        const suppliers = users.filter((u) => u.role === "supplier");
        const customers = users.filter((u) => u.role === "customer");

        // 2. Fetch today's milk entries
        const todayStr = new Date().toISOString().split("T")[0];
        const todayRecords = await milkService.getAll({ startDate: todayStr, endDate: todayStr });
        const todayQty = todayRecords
          .filter((r) => r.type === "supply")
          .reduce((sum, r) => sum + r.quantity, 0);

        // 3. Fetch this month's milk entries (to compute sales/income)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const startOfMonthStr = startOfMonth.toISOString().split("T")[0];
        
        const monthlyRecords = await milkService.getAll({ startDate: startOfMonthStr });
        // Income is amount generated from milk buyers/customers
        const monthlySales = monthlyRecords
          .filter((r) => r.type === "buy")
          .reduce((sum, r) => sum + r.amount, 0);

        // Fetch recent 5 entries (from all records)
        const allRecords = await milkService.getAll();
        setRecentEntries(allRecords.slice(0, 5));

        setStats({
          suppliers: suppliers.length,
          customers: customers.length,
          todayMilk: todayQty,
          monthlyIncome: Math.round(monthlySales * 100) / 100,
        });
      } catch (err) {
        console.error(err);
        toast.error("डैशबोर्ड डेटा लोड करने में त्रुटि।");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [navigate, user?.id, user?.role]);

  const handleLogout = () => {
    authService.logout();
    toast.success("लॉगआउट सफल!");
    navigate("/");
  };

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <Header />
      <PageContainer>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500 font-medium">डेटा लोड हो रहा है...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 text-9xl">
                🥛
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider">
                      Owner Dashboard
                    </span>
                    <h2 className="text-2xl font-bold mt-3">नमस्ते, {user?.name || "राजेश जी"}</h2>
                    <p className="text-green-50 text-xs mt-1">डेयरी: MilkFlow</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white active:scale-95"
                    title="Log Out"
                  >
                    <FaSignOutAlt className="text-lg" />
                  </button>
                </div>

                <div className="mt-6 pt-4 border-t border-white/20 flex justify-between items-end">
                  <div>
                    <p className="text-xs text-green-100 font-medium">आज का कुल दूध संकलन (Today's Collection)</p>
                    <h3 className="text-3xl font-extrabold mt-1">{stats.todayMilk} <span className="text-lg font-normal">Liters</span></h3>
                  </div>
                  <p className="text-xs text-green-100 font-medium font-mono">{todayLabel}</p>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <SummaryCard
                title="कुल सप्लायर"
                value={stats.suppliers}
                icon={<FaUserFriends className="text-green-600" />}
              />
              <SummaryCard
                title="कुल ग्राहक"
                value={stats.customers}
                icon={<FaUsers className="text-blue-600" />}
              />
              <SummaryCard
                title="आज संकलित"
                value={`${stats.todayMilk} L`}
                icon={<FaGlassWhiskey className="text-emerald-600" />}
              />
              <SummaryCard
                title="महीने की बिक्री"
                value={`₹${stats.monthlyIncome}`}
                icon={<FaRupeeSign className="text-purple-600" />}
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-150">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">त्वरित विकल्प (Quick Actions)</h3>
              <div className="grid grid-cols-3 gap-3">
                <QuickActionCard
                  title="दूध एंट्री"
                  icon="🥛"
                  onClick={() => navigate("/milk")}
                />
                <QuickActionCard
                  title="सप्लायर/ग्राहक"
                  icon="👥"
                  onClick={() => navigate("/people")}
                />
                <QuickActionCard
                  title="हिसाब किताब"
                  icon="💸"
                  onClick={() => navigate("/billing")}
                />
              </div>
            </div>

            {/* Recent Entries */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-150">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">हाल ही की प्रविष्टियां (Recent entries)</h3>
                <button
                  onClick={() => navigate("/milk")}
                  className="text-xs font-semibold text-green-600 hover:text-green-700"
                >
                  सभी देखें
                </button>
              </div>

              {recentEntries.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  आज कोई दूध एंट्री नहीं की गई है।
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentEntries.map((record) => (
                    <div key={record.id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{record.personName}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                          <span>{record.date}</span>
                          <span className="h-1 w-1 bg-gray-300 rounded-full"></span>
                          <span className="capitalize">{record.shift === "morning" ? "सुबह" : "शाम"}</span>
                          <span className="h-1 w-1 bg-gray-300 rounded-full"></span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            record.type === "supply" 
                              ? "bg-green-50 text-green-700" 
                              : "bg-blue-50 text-blue-700"
                          }`}>
                            {record.type === "supply" ? "संकलन" : "बिक्री"}
                          </span>
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-gray-800 text-sm">{record.quantity} L</p>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">₹{record.amount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </PageContainer>
    </>
  );
};

export default Dashboard;