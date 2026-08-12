import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FaCheckCircle, FaExclamationCircle, FaUndo, FaRupeeSign, FaCalendarAlt } from "react-icons/fa";
import Header from "../components/Header";
import PageContainer from "../components/PageContainer";
import { authService, userService, paymentService } from "../services/api";

const Billing = () => {
  const [users, setUsers] = useState([]);
  const [personId, setPersonId] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Date settings
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear().toString());
  const [month, setMonth] = useState((today.getMonth() + 1).toString()); // 1-indexed

  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const currentUser = authService.getCurrentUser();

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

  // Load users list
  useEffect(() => {
    if (!currentUser || currentUser.role !== "owner") {
      toast.error("अनधिकृत पहुंच!");
      window.location.href = "/";
      return;
    }

    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const data = await userService.getAll();
        setUsers(data);
      } catch (err) {
        console.error(err);
        toast.error("यूजर लिस्ट लोड करने में विफल।");
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  // Fetch cycles summary
  const fetchCycleSummary = async () => {
    if (!personId) {
      setSummaries([]);
      return;
    }
    
    setLoading(true);
    try {
      const data = await paymentService.getCycleSummary(personId, year, month);
      setSummaries(data);
    } catch (err) {
      console.error(err);
      toast.error("बिलिंग सारांश लोड करने में त्रुटि।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCycleSummary();
  }, [personId, year, month]);

  const handleUserChange = (id) => {
    setPersonId(id);
    const user = users.find((u) => u.id === id);
    setSelectedUser(user || null);
  };

  const handlePay = async (cycleNum, totalAmt) => {
    const notes = window.prompt("भुगतान के लिए कोई टिप्पणी (टिप्पणी वैकल्पिक है):", "Paid in full");
    if (notes === null) return; // User cancelled prompt

    try {
      await paymentService.payCycle({
        personId,
        year: parseInt(year),
        month: parseInt(month),
        cycle: cycleNum,
        amount: totalAmt,
        notes,
      });
      toast.success(`साइकिल ${cycleNum} भुगतान चिह्नित किया गया!`);
      fetchCycleSummary();
    } catch (err) {
      console.error(err);
      toast.error("भुगतान दर्ज करने में त्रुटि।");
    }
  };

  const handleUnpay = async (cycleNum) => {
    if (window.confirm(`क्या आप साइकिल ${cycleNum} के भुगतान को रद्द कर 'Pending' करना चाहते हैं?`)) {
      try {
        await paymentService.unpayCycle({
          personId,
          year: parseInt(year),
          month: parseInt(month),
          cycle: cycleNum,
        });
        toast.success("भुगतान सफलतापूर्वक हटा दिया गया है।");
        fetchCycleSummary();
      } catch (err) {
        console.error(err);
        toast.error("भुगतान स्थिति रीसेट करने में त्रुटि।");
      }
    }
  };

  // Grand totals calculations
  const totalLiters = summaries.reduce((sum, s) => sum + s.totalQuantity, 0);
  const totalAmount = summaries.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalPaid = summaries
    .filter((s) => s.paymentStatus === "paid")
    .reduce((sum, s) => sum + s.totalAmount, 0);
  const totalPending = summaries
    .filter((s) => s.paymentStatus === "pending")
    .reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <>
      <Header />
      <PageContainer>
        <div className="space-y-6">
          
          {/* Title */}
          <div>
            <h2 className="text-xl font-bold text-gray-800">10-दिन का दूध हिसाब (10-Day Billing)</h2>
            <p className="text-xs text-gray-500">10-10 दिन के साइकिल का हिसाब और भुगतान स्थिति देखें</p>
          </div>

          {/* Selector Card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-150 space-y-4">
            <h3 className="font-bold text-gray-700 text-sm border-b border-gray-100 pb-2 flex items-center gap-1.5">
              🔍 फिल्टर करें
            </h3>
            
            {/* Person selector */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                यूजर चुनें (Choose Person)
              </label>
              {loadingUsers ? (
                <div className="h-10 bg-gray-100 animate-pulse rounded-xl"></div>
              ) : (
                <select
                  value={personId}
                  onChange={(e) => handleUserChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 text-sm text-gray-700"
                >
                  <option value="">-- यूजर चुनें --</option>
                  <optgroup label="🐄 दूध देने वाले (Suppliers)">
                    {users
                      .filter((u) => u.role === "supplier")
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.phone})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="🛒 दूध लेने वाले (Customers)">
                    {users
                      .filter((u) => u.role === "customer")
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.phone})
                        </option>
                      ))}
                  </optgroup>
                </select>
              )}
            </div>

            {/* Month and Year */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  महीना (Month)
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-700"
                >
                  {monthsList.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  वर्ष (Year)
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-700"
                >
                  {yearsList.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Month Summary Statistics Cards (Only show if person selected) */}
          {personId && selectedUser && !loading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 border border-gray-150 rounded-2xl shadow-sm text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase">कुल दूध (Total Milk)</p>
                <p className="text-lg font-black text-gray-800 mt-1">{totalLiters} L</p>
              </div>
              <div className="bg-white p-3.5 border border-gray-150 rounded-2xl shadow-sm text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase">कुल हिसाब (Total Amt)</p>
                <p className="text-lg font-black text-gray-800 mt-1">₹{totalAmount}</p>
              </div>
              <div className="bg-green-50 p-3.5 border border-green-200 rounded-2xl shadow-sm text-center text-green-800">
                <p className="text-[10px] text-green-500 font-bold uppercase">भुगतान किया (Paid)</p>
                <p className="text-lg font-black mt-1">₹{totalPaid}</p>
              </div>
              <div className="bg-orange-50 p-3.5 border border-orange-200 rounded-2xl shadow-sm text-center text-orange-800">
                <p className="text-[10px] text-orange-500 font-bold uppercase">बाकी हिसाब (Pending)</p>
                <p className="text-lg font-black mt-1">₹{totalPending}</p>
              </div>
            </div>
          )}

          {/* Cycle Slips View */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-xs text-gray-500 font-semibold">गणना की जा रही है...</p>
            </div>
          ) : !personId ? (
            <div className="bg-white rounded-3xl p-10 border border-gray-150 text-center text-gray-400 text-sm">
              हिसाब देखने के लिए ऊपर किसी यूजर का नाम चुनें।
            </div>
          ) : summaries.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-gray-150 text-center text-gray-400 text-sm">
              इस महीने में कोई एंट्री दर्ज नहीं है।
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-700 text-sm flex items-center gap-1.5 px-1">
                📅 10-दिवसीय बिलिंग पर्चियां (10-Day Cycle Summaries)
              </h3>

              {summaries.map((slip) => (
                <div
                  key={slip.cycle}
                  className={`bg-white rounded-3xl shadow-sm border p-5 space-y-4 transition ${
                    slip.paymentStatus === "paid" 
                      ? "border-green-200 hover:border-green-300 bg-green-50/10" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {/* Slip Header */}
                  <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                    <div>
                      <h4 className="font-black text-gray-800 text-base">चक्र {slip.cycle}: {slip.label}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        कुल प्रविष्टियां (Total logs): {slip.recordsCount}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {slip.paymentStatus === "paid" ? (
                        <span className="flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">
                          <FaCheckCircle className="text-[11px]" />
                          भुगतान किया (Paid)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full border border-orange-200">
                          <FaExclamationCircle className="text-[11px]" />
                          बाकी (Pending)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Slip Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-150">
                      <p className="text-[9px] text-gray-400 font-bold uppercase">कुल दूध (Milk)</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{slip.totalQuantity} L</p>
                    </div>

                    {selectedUser.milkRateType === "fat" ? (
                      <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-150">
                        <p className="text-[9px] text-gray-400 font-bold uppercase">औसत फैट (Avg Fat)</p>
                        <p className="text-sm font-bold text-gray-800 mt-0.5">{slip.avgFat}%</p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-150">
                        <p className="text-[9px] text-gray-400 font-bold uppercase">दर प्रति L</p>
                        <p className="text-sm font-bold text-gray-800 mt-0.5">₹{slip.avgRate}</p>
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-150">
                      <p className="text-[9px] text-gray-400 font-bold uppercase">शुद्ध दर (Avg Rate)</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">₹{slip.avgRate}</p>
                    </div>
                  </div>

                  {/* Slip Total and Actions */}
                  <div className="flex justify-between items-center border-t border-gray-100 pt-3.5">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">कुल देय राशि (Total Amount)</p>
                      <p className="text-xl font-black text-green-700 flex items-center">
                        ₹{slip.totalAmount}
                      </p>
                    </div>

                    <div>
                      {slip.totalQuantity === 0 ? (
                        <p className="text-[10px] text-gray-400 font-medium">कोई दूध नहीं है</p>
                      ) : slip.paymentStatus === "paid" ? (
                        <div className="flex flex-col items-end gap-1.5">
                          {slip.notes && (
                            <span className="text-[10px] text-gray-400 italic">"{slip.notes}"</span>
                          )}
                          <button
                            onClick={() => handleUnpay(slip.cycle)}
                            className="flex items-center gap-1 py-1.5 px-3 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                          >
                            <FaUndo />
                            Pending करें
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handlePay(slip.cycle, slip.totalAmount)}
                          className="flex items-center gap-1.5 py-2 px-4 bg-green-600 text-white rounded-lg text-xs font-extrabold hover:bg-green-700 shadow-sm transition active:scale-95"
                        >
                          💸 भुगतान दर्ज करें
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </PageContainer>
    </>
  );
};

export default Billing;
