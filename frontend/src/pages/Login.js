import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBitcoin, FaEthereum, FaLock, FaEnvelope, FaCube } from "react-icons/fa";
import api from "../api";

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // Thêm trạng thái cho lỗi

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(""); // Xóa thông báo lỗi trước khi bắt đầu đăng nhập
    try {
      const response = await api.loginUser({ email, password });
      if (response.status === 200) {
        onLoginSuccess();
        navigate("/dashboard");
      } else {
        setErrorMessage(response.data.message || "Unexpected error occurred. Please try again.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setErrorMessage("Invalid email or password"); // Hiển thị lỗi nếu đăng nhập thất bại
    } finally {
      setLoading(false);
    }
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

      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl border border-gray-200 shadow-lg backdrop-blur-md relative z-10">
        <div className="flex justify-center space-x-4 mb-8">
          <FaBitcoin className="text-yellow-500 text-4xl animate-float" />
          <FaEthereum className="text-blue-500 text-4xl animate-float-delayed" />
        </div>

        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-2 tracking-tight">Welcome Back</h2>
          <p className="text-gray-600 text-sm">Enter your credentials to access your crypto wallet</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div className="group">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-0 transition-all duration-200 text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="group">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-0 transition-all duration-200 text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="text-red-500 text-sm text-center mt-2">{errorMessage}</div> // Hiển thị thông báo lỗi
          )}

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-400 text-blue-500 focus:ring-blue-500 bg-gray-50"
              />
              <label htmlFor="remember-me" className="ml-3 text-gray-600">
                Remember me
              </label>
            </div>
            <button type="button" className="text-blue-500 hover:text-blue-400 font-medium transition-colors duration-200">
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium text-sm hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50 transform hover:-translate-y-0.5 transition-all duration-200"
          >
            {loading ? "Signing in..." : "Sign in to Wallet"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <button type="button"
              onClick={() => navigate("/register")}
              className="text-blue-500 hover:text-blue-400 font-medium transition-colors duration-200">
              Create wallet
            </button>
          </p>
        </form>
      </div>

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

export default Login;
