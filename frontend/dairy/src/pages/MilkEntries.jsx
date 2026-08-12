import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FaTrash, FaPlus, FaFilter, FaCalendarAlt } from "react-icons/fa";
import Header from "../components/Header";
import PageContainer from "../components/PageContainer";
import { authService, userService, milkService } from "../services/api";

const MilkEntries = () => {
  const [users, setUsers] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Date filter for entries list
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);

  // Form states
  const [personId, setPersonId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  
  // Set default shift based on current time (Morning before 12pm, Evening after 12pm)
  const [shift, setShift] = useState(() => {
    const hours = new Date().getHours();
    return hours < 12 ? "morning" : "evening";
  });
  
  const [quantity, setQuantity] = useState("");
  const [fat, setFat] = useState("");
  const [snf, setSnf] = useState("8.5"); // default standard SNF
  const [selectedUser, setSelectedUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const currentUser = authService.getCurrentUser();

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch users
      const usersData = await userService.getAll();
      setUsers(usersData);

      // Fetch milk records for the selected filterDate
      const recordsData = await milkService.getAll({ startDate: filterDate, endDate: filterDate });
      setRecords(recordsData);
    } catch (err) {
      console.error(err);
      toast.error("डेटा लोड करने में असमर्थ।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== "owner") {
      toast.error("अनधिकृत पहुंच!");
      window.location.href = "/";
      return;
    }
    loadData();
  }, [filterDate]);

  // Handle user change to show pricing estimate
  const handleUserChange = (id) => {
    setPersonId(id);
    const user = users.find((u) => u.id === id);
    setSelectedUser(user || null);
    
    // Autofill fat if fixed rate to avoid prompt confusion
    if (user && user.milkRateType === "fixed") {
      setFat("");
      setSnf("");
    } else {
      setFat("6.5");
      setSnf("8.5");
    }
  };

  // Live Calculations for UI display
  const getCalculatedRateAndAmount = () => {
    if (!selectedUser || !quantity) return { rate: 0, amount: 0 };
    
    let rate = 0;
    const qty = Number(quantity);

    if (selectedUser.milkRateType === "fat") {
      const fatVal = Number(fat) || 0;
      rate = fatVal * (selectedUser.fatRate || 0);
    } else {
      rate = selectedUser.fixedRate || 0;
    }

    rate = Math.round(rate * 100) / 100;
    const amount = Math.round(qty * rate * 100) / 100;

    return { rate, amount };
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!personId || !quantity) {
      toast.error("कृपया सभी आवश्यक फ़ील्ड भरें।");
      return;
    }

    const { rate, amount } = getCalculatedRateAndAmount();

    setFormLoading(true);
    try {
      await milkService.create({
        personId,
        date,
        shift,
        quantity: Number(quantity),
        fat: selectedUser?.milkRateType === "fat" ? Number(fat) : 0,
        snf: selectedUser?.milkRateType === "fat" ? Number(snf) : 0,
      });

      toast.success("दूध प्रविष्टि सफलतापूर्वक सहेजी गई!");
      
      // Clear form
      setQuantity("");
      if (selectedUser?.milkRateType === "fat") {
        setFat("6.5");
        setSnf("8.5");
      }
      
      // Refresh list
      const recordsData = await milkService.getAll({ startDate: filterDate, endDate: filterDate });
      setRecords(recordsData);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "एंट्री दर्ज करने में त्रुटि आई।");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (window.confirm("क्या आप सचमुच इस एंट्री को डिलीट करना चाहते हैं?")) {
      try {
        await milkService.delete(id);
        toast.success("एंट्री डिलीट हो गई।");
        // Refresh records
        const recordsData = await milkService.getAll({ startDate: filterDate, endDate: filterDate });
        setRecords(recordsData);
      } catch (err) {
        console.error(err);
        toast.error("डिलीट करने में विफल।");
      }
    }
  };

  const { rate: estRate, amount: estAmount } = getCalculatedRateAndAmount();

  return (
    <>
      <Header />
      <PageContainer>
        <div className="space-y-6">
          
          {/* Section title */}
          <div>
            <h2 className="text-xl font-bold text-gray-800">रोजाना दूध एंट्री (Daily Entries)</h2>
            <p className="text-xs text-gray-500">सुबह-शाम दूध संकलन या बिक्री का रिकॉर्ड दर्ज करें</p>
          </div>

          {/* Quick Entry Form Card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-150">
            <h3 className="font-bold text-gray-700 text-sm mb-4 border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
              नई एंट्री दर्ज करें (New Entry)
            </h3>

            <form onSubmit={handleAddEntry} className="space-y-4">
              {/* Select Supplier/Customer */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                  नाम चुनें (Select Person)
                </label>
                <select
                  required
                  value={personId}
                  onChange={(e) => handleUserChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 text-sm text-gray-700"
                >
                  <option value="">-- नाम चुनें --</option>
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
              </div>

              {/* Date and Shift */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                    तारीख (Date)
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                    शिफ्ट (Shift)
                  </label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="morning">सुबह (AM)</option>
                    <option value="evening">शाम (PM)</option>
                  </select>
                </div>
              </div>

              {/* Quantity and Fat / SNF */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                    दूध (Liters)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Liters"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>

                {selectedUser?.milkRateType === "fat" ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                        फैट %
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={fat}
                        onChange={(e) => setFat(e.target.value)}
                        placeholder="Fat"
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                        SNF %
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={snf}
                        onChange={(e) => setSnf(e.target.value)}
                        placeholder="SNF"
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 bg-gray-50 rounded-xl p-3 border border-gray-150 flex items-center justify-center text-center">
                    <p className="text-xs text-gray-400 font-semibold">
                      {selectedUser 
                        ? `दर निर्धारण: फिक्स्ड (₹${selectedUser.fixedRate}/L)` 
                        : "यूजर चुनें - फिक्स्ड/फैट दर अपने आप दिखेगी।"}
                    </p>
                  </div>
                )}
              </div>

              {/* Estimate Details */}
              {selectedUser && quantity && (
                <div className="bg-green-50 rounded-2xl p-4 border border-green-200 flex justify-between items-center text-green-800">
                  <div>
                    <p className="text-xs font-bold opacity-80">अनुमानित दर (Estimated Rate)</p>
                    <p className="text-xl font-bold">₹{estRate}/Liter</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold opacity-80">कुल मूल्य (Estimated Total)</p>
                    <p className="text-2xl font-black text-green-700">₹{estAmount}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-bold shadow hover:from-green-700 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 text-sm"
              >
                <FaPlus className="text-xs" />
                {formLoading ? "सहेजा जा रहा है..." : "एंट्री सुरक्षित करें (Save Entry)"}
              </button>
            </form>
          </div>

          {/* Records Ledger List */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-150">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <div>
                <h3 className="font-bold text-gray-700 text-sm">प्रविष्टियों का खाता (Daily Ledger)</h3>
                <p className="text-xs text-gray-400">चुनी हुई तारीख का दूध रिकॉर्ड</p>
              </div>

              {/* Date Filter */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                  <FaCalendarAlt className="text-xs" />
                </span>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-green-500 text-gray-600"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-xs text-gray-400 font-semibold">लोड हो रहा है...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                इस तारीख ({filterDate}) को कोई दूध एंट्री दर्ज नहीं है।
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold">
                      <th className="py-2.5">विवरण (Name / Shift)</th>
                      <th className="py-2.5 text-center">दूध (L)</th>
                      <th className="py-2.5 text-center">फैट (F)</th>
                      <th className="py-2.5 text-right">दर/मूल्य (Amt)</th>
                      <th className="py-2.5 text-right">कार्य</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50/50">
                        <td className="py-3">
                          <div className="font-semibold text-gray-800">{record.personName}</div>
                          <div className="text-[10px] text-gray-400 font-semibold flex items-center gap-1.5 mt-0.5">
                            <span className="capitalize">{record.shift === "morning" ? "सुबह" : "शाम"}</span>
                            <span className="h-1 w-1 bg-gray-300 rounded-full"></span>
                            <span className={`font-bold ${
                              record.type === "supply" ? "text-green-600" : "text-blue-600"
                            }`}>
                              {record.type === "supply" ? "संकलन" : "बिक्री"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-center font-bold text-gray-700">{record.quantity}</td>
                        <td className="py-3 text-center text-gray-500 font-mono">
                          {record.fat > 0 ? `${record.fat}%` : "-"}
                        </td>
                        <td className="py-3 text-right">
                          <div className="font-bold text-gray-700">₹{record.amount}</div>
                          <div className="text-[10px] text-gray-400 font-semibold mt-0.5">₹{record.rate}/L</div>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDeleteEntry(record.id)}
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition active:scale-95 border border-red-100"
                            title="Delete Entry"
                          >
                            <FaTrash className="text-[10px]" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </PageContainer>
    </>
  );
};

export default MilkEntries;
