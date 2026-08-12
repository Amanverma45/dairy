import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaPhoneAlt, FaLock, FaKey, FaSignInAlt } from "react-icons/fa";
import { authService } from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  
  // Tab states: 'owner' | 'client'
  const [activeTab, setActiveTab] = useState("owner");
  
  // Form states
  const [phone, setPhone] = useState("");
  const [passcode, setPasscode] = useState("");
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
      const data = await authService.ownerLogin(phone, passcode);
      toast.success(`स्वागत है, ${data.user.name}!`);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "लॉगिन विफल रहा। कृपया विवरण जांचें।");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone) {
      toast.error("कृपया मोबाइल नंबर दर्ज करें।");
      return;
    }
    if (phone.length < 10) {
      toast.error("कृपया वैध 10-अंकीय मोबाइल नंबर दर्ज करें।");
      return;
    }

    setLoading(true);
    try {
      const data = await authService.requestOtp(phone);
      setOtpSent(true);
      setMockOtp(data.otp);
      toast.success("OTP सफलतापूर्वक भेज दिया गया है!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "OTP भेजने में विफल।");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!phone || !otp) {
      toast.error("कृपया OTP दर्ज करें।");
      return;
    }

    setLoading(true);
    try {
      const data = await authService.verifyOtp(phone, otp);
      toast.success(`लॉगिन सफल! स्वागत है, ${data.user.name}`);
      navigate("/profile");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "गलत OTP दर्ज किया गया है।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-tr from-green-800 via-green-700 to-emerald-600 px-4">
      {/* Brand Header */}
      <div className="mb-8 text-center text-white">
        <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-md flex items-center justify-center gap-2">
          🥛 MilkFlow
        </h1>
        <p className="text-sm mt-2 font-medium opacity-90">
          डेयरी प्रबंधन एवं 10-दिन दूध का हिसाब
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-green-100 transition-all duration-300">
        
        {/* Navigation Tabs */}
        <div className="flex bg-gray-50 border-b border-gray-150">
          <button
            onClick={() => {
              setActiveTab("owner");
              setOtpSent(false);
              setPhone("");
              setPasscode("");
              setOtp("");
              setMockOtp("");
            }}
            className={`flex-1 py-4 text-center text-sm font-semibold transition-all duration-200 ${
              activeTab === "owner"
                ? "bg-white text-green-700 border-b-2 border-green-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🏢 Owner (डेयरी मालिक)
          </button>
          
          <button
            onClick={() => {
              setActiveTab("client");
              setPhone("");
              setPasscode("");
              setOtp("");
              setMockOtp("");
            }}
            className={`flex-1 py-4 text-center text-sm font-semibold transition-all duration-200 ${
              activeTab === "client"
                ? "bg-white text-green-700 border-b-2 border-green-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🐄 Client (किसान / ग्राहक)
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8">
          {activeTab === "owner" ? (
            /* OWNER PASSCODE LOGIN */
            <form onSubmit={handleOwnerLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Owner Mobile
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaPhoneAlt className="text-gray-400 text-sm" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9999999999"
                    maxLength={10}
                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Passcode (पासकोड)
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400 text-sm" />
                  </div>
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="******"
                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl font-bold shadow-lg shadow-green-200 hover:shadow-xl hover:from-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {loading ? "लॉगिन हो रहा है..." : "लॉगिन करें (Login)"}
                <FaSignInAlt />
              </button>
              
              <div className="text-center mt-4">
                <p className="text-xs text-gray-400">
                  Default: 9999999999 / 123456
                </p>
              </div>
            </form>
          ) : (
            /* CLIENT OTP LOGIN */
            <div className="space-y-5">
              {!otpSent ? (
                /* STEP 1: REQUEST OTP */
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Registered Mobile Number
                    </label>
                    <div className="relative rounded-2xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaPhoneAlt className="text-gray-400 text-sm" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="दर्ज करें (e.g. 8888888888)"
                        maxLength={10}
                        className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      सप्लायर या ग्राहक का रजिस्टर्ड नंबर डालें।
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl font-bold shadow-lg hover:from-green-700 hover:to-green-600 focus:outline-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? "भेज रहे हैं..." : "OTP प्राप्त करें (Get OTP)"}
                    <FaKey />
                  </button>
                  
                  <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-150">
                    <p className="text-xs text-gray-500">
                      Testing Numbers: 8888888888 (सप्लायर), 6666666666 (ग्राहक)
                    </p>
                  </div>
                </form>
              ) : (
                /* STEP 2: VERIFY OTP */
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-center">
                    <p className="text-sm font-semibold text-green-800">
                      OTP Sent to {phone}
                    </p>
                    {mockOtp && (
                      <div className="mt-2 text-xs bg-white py-1 px-3 border border-green-300 rounded-lg inline-block font-mono text-green-700 font-bold">
                        DEV OTP: {mockOtp}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Enter 4-Digit OTP
                    </label>
                    <div className="relative rounded-2xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaKey className="text-gray-400 text-sm" />
                      </div>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="1234"
                        maxLength={4}
                        className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all tracking-[0.5em] text-center font-bold font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                        setMockOtp("");
                      }}
                      className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all text-sm text-center"
                    >
                      पीछे जाएं (Back)
                    </button>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-[2] py-3.5 px-6 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:from-green-700 hover:to-green-600 focus:outline-none active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      {loading ? "सत्यापित हो रहा है..." : "सत्यापित करें (Verify)"}
                      <FaSignInAlt />
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Login;
