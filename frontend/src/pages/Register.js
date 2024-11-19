import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBitcoin, FaEthereum, FaEnvelope, FaLock, FaCube } from "react-icons/fa";
import api from "../api";

const Register = ({ onRegisterSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Hàm xử lý khi người dùng submit form đăng ký
  const handleSubmit = async (e) => {
    e.preventDefault(); // Ngăn chặn hành động mặc định của form (reload trang)
    setLoading(true); 
    // Kiểm tra nếu mật khẩu và xác nhận mật khẩu không trùng khớp
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match!"); // Cập nhật thông báo lỗi nếu mật khẩu không trùng khớp
      return; // Dừng xử lý đăng ký nếu có lỗi
    }

    try {
      // Gọi API để đăng ký người dùng mới với email và mật khẩu
      const response = await api.registerUser({ email, password });

      // Kiểm tra nếu đăng ký thành công với mã trạng thái 201
      if (response.status === 201) {
        setShowSuccessPopup(true); // Hiển thị thông báo thành công
      } else {
        // Xử lý trường hợp nhận được phản hồi không mong muốn từ máy chủ
        setErrorMessage("Unexpected response from the server. Please try again."); // Thông báo lỗi cho người dùng
      }
    } catch (error) {
      // Kiểm tra mã lỗi 409 (email đã tồn tại)
      if (error.response && error.response.status === 409) {
        setErrorMessage("This email is already registered. Please use a different email.");
      } else {
        setErrorMessage("Error occurred during registration: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý khi đóng popup thông báo thành công
  const handlePopupClose = () => {
    setShowSuccessPopup(false); // Đóng popup thành công
    onRegisterSuccess(); // Gọi callback thông báo đăng ký thành công cho component cha
  };


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="grid grid-cols-8 gap-4 opacity-5 transform rotate-12 scale-150">
          {Array.from({ length: 64 }).map((_, i) => (
            <FaCube key={i} className="text-blue-500 text-2xl animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>

      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-lg relative z-10">
        <div className="flex justify-center space-x-4 mb-8">
          <FaBitcoin className="text-yellow-500 text-4xl animate-float" />
          <FaEthereum className="text-blue-500 text-4xl animate-float-delayed" />
        </div>

        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-2 tracking-tight">Create an Account</h2>
          <p className="text-gray-600 text-sm">Enter your details to start managing your crypto portfolio</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div className="relative">
              <FaEnvelope className="absolute top-3 left-3 text-gray-400" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full pl-10 pr-4 py-4 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-800"
              />
            </div>
            <div className="relative">
              <FaLock className="absolute top-3 left-3 text-gray-400" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full pl-10 pr-4 py-4 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-800"
              />
            </div>
            <div className="relative">
              <FaLock className="absolute top-3 left-3 text-gray-400" />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="block w-full pl-10 pr-4 py-4 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-800"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="text-red-500 text-sm text-center mt-2">{errorMessage}</div> // Hiển thị lỗi nếu có
          )}
          <button
            type="submit"
            className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            {loading ? "Register in..." : "Register new Wallet"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-blue-500 hover:text-blue-400 font-medium transition-colors duration-200"
          >
            Sign in
          </button>
        </p>
      </div>

      {/* Popup Thành Công */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-xs text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Registration Successful!</h3>
            <p className="text-gray-600 mb-6">You have successfully created an account.</p>
            <button
              onClick={handlePopupClose}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 3s ease-in-out infinite;
          animation-delay: 1.5s;
        }
      `}</style>
    </div>
  );
};

export default Register;
