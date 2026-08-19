import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FaUser,
  FaPhoneAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaSignOutAlt,
  FaCalendarAlt,
  FaChevronDown,
  FaChevronUp,
  FaClipboardList,
} from "react-icons/fa";
import Header from "../components/Header";
import PageContainer from "../components/PageContainer";
import { authService, milkService, paymentService } from "../services/api";

const Profile = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear().toString());
  const [month, setMonth] = useState((today.getMonth() + 1).toString()); // 1-indexed
  
  const [summaries, setSummaries] = useState([]);
  const [dailyRecords, setDailyRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Accordion active index state: null | 1 | 2 | 3
  const [expandedCycle, setExpandedCycle] = useState(null);

  const yearsList = [];
  for (let y = today.getFullYear() - 2; y <= today.getFullYear() + 1; y++) {
    yearsList.push(y.toString());
  }

  const monthsList = [
    { value: "1", label: "January (जनवरी)" },
    { value: "2", label: "February (फ़रवरी)" },
    { value: "3", label: "March (मार्च)" },
    { value: "4", label: "April (अप्रैल)" },
    { value: "5", label: "May (मई)" },
    { value: "6", label: "June (जून)" },
    { value: "7", label: "July (जुलाई)" },
    { value: "8", label: "August (अगस्त)" },
    { value: "9", label: "September (सितंबर)" },
    { value: "10", label: "October (अक्टूबर)" },
    { value: "11", label: "November (नवंबर)" },
    { value: "12", label: "December (दिसंबर)" },
  ];

  const fetchProfileData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 1. Fetch 10-day cycle summary
      const summaryData = await paymentService.getCycleSummary(user.id, year, month);
      setSummaries(summaryData);

      // 2. Fetch all daily records of the month
      const y = parseInt(year);
      const m = parseInt(month);
      const monthStr = m.toString().padStart(2, "0");
      const startDateStr = `${y}-${monthStr}-01`;
      
      // get days in month
      const daysInMonth = new Date(y, m, 0).getDate();
      const endDateStr = `${y}-${monthStr}-${daysInMonth}`;

      const recordsData = await milkService.getAll({
        personId: user.id,
        startDate: startDateStr,
        endDate: endDateStr,
      });

      setDailyRecords(recordsData);
    } catch (err) {
      console.error(err);
      toast.error("डेटा लोड करने में त्रुटि।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchProfileData();
  }, [year, month]);

  const handleLogout = () => {
    authService.logout();
    toast.success("लॉगआउट सफल!");
    navigate("/");
  };

  // Helper to get daily records matching a cycle's day range
  const getCycleRecords = (cycleNum) => {
    return dailyRecords.filter((r) => {
      const day = parseInt(r.date.split("-")[2]);
      if (cycleNum === 1) return day >= 1 && day <= 10;
      if (cycleNum === 2) return day >= 11 && day <= 20;
      return day >= 21;
    }).sort((a, b) => a.date.localeCompare(b.date)); // chronological sorting inside cycles
  };

  // Total summary for month
  const monthLiters = summaries.reduce((sum, s) => sum + s.totalQuantity, 0);
  const monthAmount = summaries.reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <>
      <Header />
      <PageContainer>
        <div className="space-y-6">
          
          {/* User Profile Info Card */}
          <div className="bg-gradient-to-tr from-green-700 via-green-600 to-emerald-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10 text-9xl">
              🐄
            </div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 text-xl font-bold">
                    {user?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h2 className="text-xl font-black">{user?.name}</h2>
                    <p className="text-xs text-green-100 flex items-center gap-1 mt-0.5">
                      <FaPhoneAlt className="text-[10px]" /> {user?.phone}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="py-1.5 px-3 bg-white/15 hover:bg-white/25 active:scale-95 rounded-xl border border-white/20 text-xs font-extrabold text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <FaSignOutAlt className="text-xs" />
                  Logout
                </button>
              </div>

              <div className="border-t border-white/20 pt-3 flex justify-between items-center text-xs">
                <div>
                  <span className="opacity-80">खाता प्रकार (Role): </span>
                  <span className="font-bold bg-white/25 px-2 py-0.5 rounded-full capitalize">
                    {user?.role === "supplier" ? "सप्लायर (दूध संकलन)" : "ग्राहक (दूध खरीद)"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Month & Year Selectors */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-150 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-semibold">
              <FaCalendarAlt className="text-green-600 text-base" />
              <span>हिसाब का महीना चुनें:</span>
            </div>

            <div className="flex gap-2">
              <select
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  setExpandedCycle(null);
                }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                {monthsList.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label.split(" ")[0]}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  setExpandedCycle(null);
                }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                {yearsList.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Month Summary Stats */}
          {!loading && summaries.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-gray-150 shadow-sm text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase">महीने का कुल दूध</p>
                <p className="text-lg font-black text-gray-800 mt-1">{monthLiters} L</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-150 shadow-sm text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase">महीने की कुल राशि</p>
                <p className="text-lg font-black text-green-700 mt-1">₹{monthAmount}</p>
              </div>
            </div>
          )}

          {/* Slips and Accordion Ledger */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-xs text-gray-500 font-semibold">गणना की जा रही है...</p>
            </div>
          ) : summaries.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-gray-150 text-center text-gray-400 text-sm">
              इस महीने में आपका कोई दूध रिकॉर्ड नहीं मिला।
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-700 text-sm flex items-center gap-1.5 px-1">
                <FaClipboardList className="text-green-600" />
                10-दिन की पर्चियां (10-Day Bills) &mdash; विवरण के लिए क्लिक करें
              </h3>

              {summaries.map((slip) => {
                const isExpanded = expandedCycle === slip.cycle;
                const slipRecords = getCycleRecords(slip.cycle);

                return (
                  <div
                    key={slip.cycle}
                    className={`bg-white rounded-3xl shadow-sm border transition overflow-hidden ${
                      slip.paymentStatus === "paid" 
                        ? "border-green-200 bg-green-50/5" 
                        : "border-gray-200"
                    }`}
                  >
                    {/* Accordion Header */}
                    <button
                      onClick={() => setExpandedCycle(isExpanded ? null : slip.cycle)}
                      className="w-full p-5 text-left flex justify-between items-center focus:outline-none"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-gray-800 text-sm">चक्र {slip.cycle}: {slip.label}</h4>
                          {slip.paymentStatus === "paid" ? (
                            <span className="flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-200">
                              <FaCheckCircle className="text-[10px]" /> Paid
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full border border-orange-200">
                              <FaExclamationCircle className="text-[10px]" /> Pending
                            </span>
                          )}
                        </div>
                        
                        {/* Short preview stats */}
                        <div className="flex gap-4 text-[10px] text-gray-400 font-bold uppercase pt-1">
                          <span>दूध: <strong className="text-gray-600">{slip.totalQuantity} L</strong></span>
                          <span>दर: <strong className="text-gray-600">₹{slip.avgRate}/L</strong></span>
                          <span>कुल: <strong className="text-green-600">₹{slip.totalAmount}</strong></span>
                        </div>
                      </div>

                      <div className="p-1 bg-gray-50 border border-gray-150 rounded-lg text-gray-500">
                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                    </button>

                    {/* Accordion Body: Daily breakdown list */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-3">
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase border-b border-gray-200 pb-1">
                          दैनिक रिकॉर्ड विवरण (Daily Record Details)
                        </h5>

                        {slipRecords.length === 0 ? (
                          <p className="text-center py-4 text-xs text-gray-400">
                            इस साइकिल में कोई दूध एंट्री दर्ज नहीं की गई है।
                          </p>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {slipRecords.map((r) => (
                              <div key={r.id} className="py-2.5 flex justify-between items-center text-xs">
                                <div>
                                  <p className="font-bold text-gray-800">
                                    {new Date(r.date).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </p>
                                  <p className="text-[10px] text-gray-400 font-semibold capitalize">
                                    {r.shift === "morning" ? "सुबह (AM)" : "शाम (PM)"}
                                    {r.fat > 0 && ` | Fat: ${r.fat}% | SNF: ${r.snf}%`}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className="font-bold text-gray-700">{r.quantity} L</p>
                                  <p className="text-[10px] text-gray-400 font-semibold">
                                    ₹{r.amount} (₹{r.rate}/L)
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Accordion footer with payment note */}
                        {slip.paymentStatus === "paid" && (
                          <div className="bg-green-100/30 border border-green-200 p-2.5 rounded-xl text-[10px] text-green-800 mt-2 font-semibold">
                            ⚠️ भुगतान तिथि: {slip.paymentDate} {slip.notes && ` | टिप्पणी: "${slip.notes}"`}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </PageContainer>
    </>
  );
};

export default Profile;
