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
  
  // Drawer / Form state
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    milkRateType: "fixed",
    fixedRate: "",
    fatRate: "",
  });

  const currentUser = authService.getCurrentUser();

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
    if (!currentUser || currentUser.role !== "owner") {
      toast.error("अनधिकृत पहुंच!");
      window.location.href = "/";
      return;
    }
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: "",
      phone: "",
      milkRateType: "fixed",
      fixedRate: "50",
      fatRate: "8.5",
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
    const { name, phone, milkRateType, fixedRate, fatRate } = formData;

    if (!name || !phone) {
      toast.error("कृपया नाम और मोबाइल नंबर दर्ज करें।");
      return;
    }
    if (phone.length < 10) {
      toast.error("वैध 10-अंकीय मोबाइल नंबर दर्ज करें।");
      return;
    }

    const payload = {
      name,
      phone,
      role: activeTab,
      milkRateType,
      fixedRate: milkRateType === "fixed" ? Number(fixedRate) : 0,
      fatRate: milkRateType === "fat" ? Number(fatRate) : 0,
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
    return matchesTab && matchesSearch;
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
                {activeTab === "supplier" ? "सप्लायर प्रबंधन" : "ग्राहक प्रबंधन"}
              </h2>
              <p className="text-xs text-gray-500">डेयरी से जुड़े सभी लोगों की सूची</p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 py-2.5 px-4 bg-green-600 text-white rounded-xl font-bold text-sm shadow hover:bg-green-700 active:scale-95 transition-all"
            >
              <FaUserPlus />
              नया जोड़ें
            </button>
          </div>

          {/* Search and Tabs */}
          <div className="space-y-3">
            <div className="flex bg-gray-200 p-1 rounded-xl">
              <button
                onClick={() => {
                  setActiveTab("supplier");
                  setSearchTerm("");
                }}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                  activeTab === "supplier" ? "bg-white text-green-700 shadow-sm" : "text-gray-600"
                }`}
              >
                🥛 दूध देने वाले (Suppliers)
              </button>
              
              <button
                onClick={() => {
                  setActiveTab("customer");
                  setSearchTerm("");
                }}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                  activeTab === "customer" ? "bg-white text-green-700 shadow-sm" : "text-gray-600"
                }`}
              >
                🛒 दूध लेने वाले (Customers)
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
                placeholder="नाम या मोबाइल से खोजें..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* User List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-xs text-gray-500">लोड हो रहा है...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm border border-gray-150">
              कोई {activeTab === "supplier" ? "सप्लायर" : "ग्राहक"} नहीं मिला।
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-150 hover:border-green-200 transition-all flex justify-between items-center"
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-800">{user.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <FaPhoneAlt className="text-[10px]" /> {user.phone}
                    </p>
                    <div className="pt-1">
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-100">
                        {user.milkRateType === "fat" 
                          ? `फैट रेट: ₹${user.fatRate}/फैट` 
                          : `फिक्स्ड रेट: ₹${user.fixedRate}/L`}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="p-2.5 bg-gray-50 text-blue-600 rounded-xl hover:bg-blue-50 transition active:scale-95 border border-gray-200"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
                      className="p-2.5 bg-gray-50 text-red-600 rounded-xl hover:bg-red-50 transition active:scale-95 border border-gray-200"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form Bottom Drawer / Sheet */}
          {isOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end transition-opacity duration-300">
              <div className="bg-white w-full rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up shadow-2xl border-t border-gray-200">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h3 className="font-bold text-gray-800 text-lg">
                    {editingId ? "विवरण संपादित करें" : `नया ${activeTab === "supplier" ? "सप्लायर" : "ग्राहक"} जोड़ें`}
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500"
                  >
                    <FaTimes />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                      पूरा नाम (Name)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="नाम लिखें (e.g. हरीश शर्मा)"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                      मोबाइल नंबर (Phone)
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      placeholder="10 अंकों का मोबाइल नंबर"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-255 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>

                  {/* Rate Type Switch */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      दूध का भाव मॉडल (Rate Model)
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, milkRateType: "fixed" })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                          formData.milkRateType === "fixed"
                            ? "bg-green-50 border-green-500 text-green-700"
                            : "bg-white border-gray-200 text-gray-600"
                        }`}
                      >
                        फिक्स्ड रेट (Fixed Price)
                      </button>

                      {/* Suppliers can have fat rate, Customers generally have fixed rate, but allow both for flexibility */}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, milkRateType: "fat" })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                          formData.milkRateType === "fat"
                            ? "bg-green-50 border-green-500 text-green-700"
                            : "bg-white border-gray-200 text-gray-600"
                        }`}
                      >
                        फैट आधारित (Fat rate)
                      </button>
                    </div>
                  </div>

                  {/* Conditional rate input */}
                  {formData.milkRateType === "fixed" ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                        फिक्स्ड रेट प्रति लीटर (₹)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={formData.fixedRate}
                        onChange={(e) => setFormData({ ...formData, fixedRate: e.target.value })}
                        placeholder="जैसे: 50"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-260 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                        फैट रेट मल्टीप्लायर (₹ प्रति फैट यूनिट)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={formData.fatRate}
                        onChange={(e) => setFormData({ ...formData, fatRate: e.target.value })}
                        placeholder="जैसे: 8.5"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-260 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        दर = फैट % × रेट (e.g. 6.0 फैट × ₹8.5 = ₹51 प्रति लीटर)
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-bold hover:from-green-700 transition"
                  >
                    सहेजें (Save Person)
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
