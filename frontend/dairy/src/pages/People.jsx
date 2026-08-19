import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaUserPlus, FaSearch, FaEdit, FaTrash, FaPhoneAlt, FaTimes } from "react-icons/fa";
import Header from "../components/Header";
import PageContainer from "../components/PageContainer";
import { authService, userService } from "../services/api";

const People = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("supplier"); // 'supplier' | 'customer'
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive'
  
  // Drawer / Form state
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    milkRateType: "fixed",
    fixedRate: "",
    fatRate: "",
    passcode: "",
    village: "",
    sno: "",
  });

  const currentUser = authService.getCurrentUser();
  const formatSno = (sno) => sno ? sno.toString().padStart(3, '0') : '';

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast.error("यूजर लिस्ट लोड करने में त्रुटि।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      window.location.href = "/";
      return;
    }
    fetchUsers();
  }, []);

  // Auto-generate passcode on name and phone changes (only for new members)
  useEffect(() => {
    if (!editingId && formData.name && formData.phone) {
      const firstName = formData.name.trim().split(" ")[0].toLowerCase().replace(/[^a-z]/g, "");
      const lastFour = formData.phone.slice(-4);
      if (firstName && lastFour.length === 4) {
        setFormData((prev) => ({
          ...prev,
          passcode: `${firstName}${lastFour}`,
        }));
      }
    }
  }, [formData.name, formData.phone, editingId]);

  const handleOpenAdd = () => {
    // Find next sequential S.No.
    const maxSno = users.reduce((max, u) => (u.sno && u.sno > max ? u.sno : max), 0);
    setEditingId(null);
    setFormData({
      name: "",
      phone: "",
      milkRateType: "fixed",
      fixedRate: "50",
      fatRate: "8.5",
      passcode: "", // Auto-generate effect will prefill this
      village: "",
      sno: (maxSno + 1).toString(),
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      phone: user.phone,
      milkRateType: user.milkRateType || "fixed",
      fixedRate: user.fixedRate?.toString() || "0",
      fatRate: user.fatRate?.toString() || "0",
      passcode: user.passcode || "1234",
      village: user.village || "",
      sno: user.sno?.toString() || "",
    });
    setIsOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`क्या आप सचमुच ${name} को डिलीट करना चाहते हैं? इससे उनका सारा रिकॉर्ड भी डिलीट हो जाएगा!`)) {
      try {
        await userService.delete(id);
        toast.success(`${name} डिलीट हो गया।`);
        fetchUsers();
      } catch (err) {
        console.error(err);
        toast.error("डिलीट करने में विफल।");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, phone, milkRateType, fixedRate, fatRate, passcode, village, sno } = formData;

    if (!name || !phone) {
      toast.error("कृपया नाम और मोबाइल नंबर दर्ज करें।");
      return;
    }
    if (phone.length < 10) {
      toast.error("वैध 10-अंकीय मोबाइल नंबर दर्ज करें।");
      return;
    }

    // Validate alphanumeric passcode (min 6 characters, must contain letters and numbers)
    const passcodeRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$/;
    if (passcode && !passcodeRegex.test(passcode)) {
      toast.error("पासकोड कम से कम 6 अक्षरों का होना चाहिए और उसमें अक्षर (A-Z) और अंक (0-9) दोनों होने चाहिए। (जैसे: aman6067)");
      return;
    }

    const payload = {
      name,
      phone,
      role: activeTab,
      milkRateType,
      fixedRate: milkRateType === "fixed" ? Number(fixedRate) : 0,
      fatRate: milkRateType === "fat" ? Number(fatRate) : 0,
      passcode: passcode || "1234",
      village: village ? village.trim() : "",
      sno: sno ? Number(sno) : null,
    };

    try {
      if (editingId) {
        await userService.update(editingId, payload);
        toast.success("विवरण सफलतापूर्वक अपडेट हुआ!");
      } else {
        await userService.create(payload);
        toast.success("नया यूजर सफलतापूर्वक जोड़ा गया!");
      }
      setIsOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "बचाने में त्रुटि आई।");
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesTab = u.role === activeTab;
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.phone.includes(searchTerm);
    
    let matchesStatus = true;
    if (statusFilter === "active") matchesStatus = u.status === "active";
    if (statusFilter === "inactive") matchesStatus = u.status === "inactive";
    
    return matchesTab && matchesSearch && matchesStatus;
  });

  return (
    <>
      <Header />
      <PageContainer>
        <div className="space-y-4">
          
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {activeTab === "supplier" ? "Suppliers" : "Customers"}
              </h2>
              <p className="text-xs text-gray-500">Member List</p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 py-2.5 px-4 bg-green-600 text-white rounded-xl font-bold text-sm shadow hover:bg-green-700 active:scale-95 transition-all cursor-pointer"
            >
              <FaUserPlus />
              Add New
            </button>
          </div>

          {/* Search and Tabs */}
          <div className="space-y-3">
            <div className="flex bg-gray-200 p-1 rounded-xl">
              <button
                onClick={() => {
                  setActiveTab("supplier");
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "supplier" ? "bg-white text-green-700 shadow-sm" : "text-gray-600"
                }`}
              >
                🥛 Suppliers
              </button>
              
              <button
                onClick={() => {
                  setActiveTab("customer");
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "customer" ? "bg-white text-green-700 shadow-sm" : "text-gray-600"
                }`}
              >
                🛒 Customers
              </button>
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <FaSearch className="text-sm" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or phone (नाम या मोबाइल से खोजें)..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Status filters in English only */}
            <div className="flex gap-2 p-1 bg-gray-100/80 rounded-xl border border-gray-200/50">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`flex-1 py-2 text-center text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={`flex-1 py-2 text-center text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  statusFilter === "active"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Active
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("inactive")}
                className={`flex-1 py-2 text-center text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  statusFilter === "inactive"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          {/* User List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-xs text-gray-500 font-semibold">Loading (लोड हो रहा है)...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {statusFilter === "inactive" && filteredUsers.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700 font-bold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>पिछले 5 दिन या उससे पहले का दूध बंद है</span>
                </div>
              )}

              {filteredUsers.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm border border-gray-150 font-semibold">
                  No {activeTab === "supplier" ? "Suppliers" : "Customers"} found.
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-150 hover:border-green-200 transition-all flex justify-between items-center"
                    >
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-800 flex items-center flex-wrap gap-1.5">
                          {user.sno && (
                            <span className="text-blue-700 font-extrabold bg-blue-50 px-2 py-0.5 rounded-lg text-[10px] border border-blue-150 font-mono">
                              #{formatSno(user.sno)}
                            </span>
                          )}
                          <span>{user.name}</span>
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                          <FaPhoneAlt className="text-[10px]" /> {user.phone}
                        </p>
                        <div className="pt-1 flex flex-wrap gap-2">
                          {user.village && (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-150">
                              📍 {user.village}
                            </span>
                          )}
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-100">
                            {user.milkRateType === "fat" 
                              ? `Rate (फैट रेट): ₹${user.fatRate}/Fat` 
                              : `Rate (फिक्स रेट): ₹${user.fixedRate}/L`}
                          </span>
                          {user.status === "active" ? (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full border border-teal-200">
                              Active
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-700 rounded-full border border-red-200" title={user.lastActiveDate ? `आखिरी बार: ${user.lastActiveDate}` : "कभी नहीं आए"}>
                              Inactive (पिछले 5 दिन या उससे पहले का दूध बंद है)
                            </span>
                          )}
                        </div>
                      </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="p-2.5 bg-gray-50 text-blue-600 rounded-xl hover:bg-blue-50 transition active:scale-95 border border-gray-200 cursor-pointer"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
                      className="p-2.5 bg-gray-50 text-red-600 rounded-xl hover:bg-red-50 transition active:scale-95 border border-gray-200 cursor-pointer"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
                </div>
              )}
            </div>
          )}

          {/* Form Bottom Drawer / Sheet */}
          {isOpen && (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-end transition-opacity duration-300">
              <div className="bg-white w-full rounded-t-3xl p-6 pb-28 space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up shadow-2xl border-t border-gray-200">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h3 className="font-bold text-gray-800 text-lg">
                    {editingId ? "Edit Info (विवरण बदलें)" : `Add New ${activeTab === "supplier" ? "Supplier" : "Customer"}`}
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 cursor-pointer"
                  >
                    <FaTimes />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* S.No. / Serial Number */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                      Serial Number (S.No. / क्रमांक)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.sno}
                      onChange={(e) => setFormData({ ...formData, sno: e.target.value.replace(/\D/g, "") })}
                      placeholder="e.g. 1"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 font-bold"
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                      Full Name (पूरा नाम)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter name (नाम लिखें)"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                      Phone Number (मोबाइल नंबर)
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      placeholder="Enter 10-digit number (मोबाइल नंबर)"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-255 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>

                  {/* Village Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                      Village Name (गाँव का नाम)
                    </label>
                    <input
                      type="text"
                      value={formData.village}
                      onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                      placeholder="e.g. रामपुर (गाँव का नाम लिखें)"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>

                  {/* Passcode */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                      Login Passcode (लॉगिन पासकोड)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={20}
                      value={formData.passcode}
                      onChange={(e) => setFormData({ ...formData, passcode: e.target.value })}
                      placeholder="e.g. aman6067"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-255 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 font-mono font-bold text-slate-700"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      पासकोड कम से कम 6 अक्षरों का होना चाहिए और उसमें अक्षर (A-Z) और अंक (0-9) दोनों होने चाहिए (जैसे: aman6067)।
                    </p>
                  </div>

                  {/* Rate Type Switch */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      Rate Model (दूध का भाव मॉडल)
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, milkRateType: "fixed" })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          formData.milkRateType === "fixed"
                            ? "bg-green-50 border-green-500 text-green-700"
                            : "bg-white border-gray-200 text-gray-600"
                        }`}
                      >
                        Fixed Price (फिक्स रेट)
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, milkRateType: "fat" })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          formData.milkRateType === "fat"
                            ? "bg-green-50 border-green-500 text-green-700"
                            : "bg-white border-gray-200 text-gray-600"
                        }`}
                      >
                        Fat Rate (फैट आधारित)
                      </button>
                    </div>
                  </div>

                  {/* Conditional rate input */}
                  {formData.milkRateType === "fixed" ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                        Fixed Price per Liter (फिक्स रेट प्रति लीटर - ₹)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={formData.fixedRate}
                        onChange={(e) => setFormData({ ...formData, fixedRate: e.target.value })}
                        placeholder="e.g. 50 (जैसे: 50)"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-260 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                        Fat Rate per Unit (फैट रेट - ₹ प्रति फैट)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={formData.fatRate}
                        onChange={(e) => setFormData({ ...formData, fatRate: e.target.value })}
                        placeholder="e.g. 8.5 (जैसे: 8.5)"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-260 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        Rate = Fat % × Rate (e.g. 6.0 Fat × ₹8.5 = ₹51/L)
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-bold hover:from-green-700 transition cursor-pointer shadow-md"
                  >
                    Save (सहेजें)
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </PageContainer>
    </>
  );
};

export default People;
