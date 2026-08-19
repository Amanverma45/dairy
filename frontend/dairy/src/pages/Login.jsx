import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaPhoneAlt, FaLock, FaKey, FaSignInAlt, FaAward, FaEye, FaEyeSlash } from "react-icons/fa";
import { authService } from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  
  // Tab states: 'owner' | 'client'
  const [activeTab, setActiveTab] = useState("owner");
  
  // Form states
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [otp, setOtp] = useState("");
  
  // OTP flow states
  const [otpSent, setOtpSent] = useState(false);
  const [mockOtp, setMockOtp] = useState(""); // For showing generated OTP on screen
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      if (user.role === "owner") {
        navigate("/dashboard");
      } else {
        navigate("/profile");
      }
    }
  }, [navigate]);

  const handleOwnerLogin = async (e) => {
    e.preventDefault();
    if (!phone || !passcode) {
      toast.error("कृपया मोबाइल नंबर और पासकोड दर्ज करें।");
      return;
    }

    setLoading(true);
    try {
      const data = await authService.ownerLogin(ownerName, phone, passcode);
      toast.success(`स्वागत है, ${data.user.name}!`);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "लॉगिन विफल रहा। कृपया विवरण जांचें।");
    } finally {
      setLoading(false);
    }
  };

  const handleClientLogin = async (e) => {
    e.preventDefault();
    if (!phone || !passcode) {
      toast.error("कृपया मोबाइल नंबर और पासकोड दर्ज करें।");
      return;
    }

    setLoading(true);
    try {
      const data = await authService.clientLogin(phone, passcode);
      toast.success(`लॉगिन सफल! स्वागत है, ${data.user.name}`);
      navigate("/profile");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "लॉगिन विफल रहा। कृपया विवरण जांचें।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-tr from-slate-900 via-indigo-900 to-blue-800 px-4 py-12 overflow-hidden">
      
      {/* Decorative floating blurred background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-blue-500/20 blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-indigo-500/20 blur-[80px] pointer-events-none"></div>

      {/* Brand Header */}
      <div className="mb-10 text-center text-white z-10">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-xs font-semibold tracking-wider text-blue-200 mb-4 animate-pulse">
          <FaAward /> शुद्धता और विश्वास का प्रतीक
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-md flex items-center justify-center gap-3">
          🥛 बालाजी दूध डेयरी
        </h1>
        <p className="text-sm mt-3 font-medium text-slate-300 max-w-sm mx-auto">
          स्मार्ट डेयरी प्रबंधन एवं 10-दिन दूध का डिजिटल हिसाब-किताब
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[32px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] overflow-hidden border border-white/20 transition-all duration-300 z-10">
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-50/50 p-2 gap-2 border-b border-slate-100">
          <button
            onClick={() => {
              setActiveTab("owner");
              setOtpSent(false);
              setPhone("");
              setPasscode("");
              setShowPasscode(false);
              setOtp("");
              setMockOtp("");
            }}
            className={`flex-1 py-3 text-center text-xs md:text-sm font-bold rounded-2xl transition-all duration-300 ${
              activeTab === "owner"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
          >
            🏢 Owner (डेयरी मालिक)
          </button>
          
          <button
            onClick={() => {
              setActiveTab("client");
              setPhone("");
              setPasscode("");
              setShowPasscode(false);
              setOtp("");
              setMockOtp("");
            }}
            className={`flex-1 py-3 text-center text-xs md:text-sm font-bold rounded-2xl transition-all duration-300 ${
              activeTab === "client"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
          >
            🐄 Client (किसान / ग्राहक)
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8">
          {activeTab === "owner" ? (
            /* OWNER PASSCODE LOGIN */
            <form onSubmit={handleOwnerLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Owner Name (पूरा नाम)
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-sm font-bold">👤</span>
                  </div>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="अपना नाम दर्ज करें (e.g. राजेश जी)"
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Owner Mobile (मोबाइल नंबर)
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaPhoneAlt className="text-slate-400 text-sm" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="मोबाइल नंबर दर्ज करें"
                    maxLength={10}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Passcode (पासकोड)
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaLock className="text-slate-400 text-sm" />
                  </div>
                  <input
                    type={showPasscode ? "text" : "password"}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="पासकोड दर्ज करें"
                    className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPasscode ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 focus:outline-none active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? "लॉगिन हो रहा है..." : "लॉगिन करें (Login)"}
                <FaSignInAlt />
              </button>
            </form>
          ) : (
            /* CLIENT PASSCODE LOGIN */
            <form onSubmit={handleClientLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Client Mobile (मोबाइल नंबर)
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaPhoneAlt className="text-slate-400 text-sm" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="जैसे: 9876543210"
                    maxLength={10}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Login Passcode (पासकोड)
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaLock className="text-slate-400 text-sm" />
                  </div>
                  <input
                    type={showPasscode ? "text" : "password"}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="दर्ज करें (जैसे: 1234)"
                    className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPasscode ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 pl-1">
                  डेयरी मालिक द्वारा दिए गए मोबाइल और पासकोड से लॉगिन करें।
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? "लॉगिन हो रहा है..." : "लॉगिन करें (Login)"}
                <FaSignInAlt />
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default Login;
