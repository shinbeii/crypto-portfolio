// export default Dashboard;
import React, { useState, useEffect } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";
import { fetchMarketData } from '../services/api_service';
import { formatPrice } from '../utils/format';
import { Line } from "react-chartjs-2";
import api from "../api";


// Đăng ký các thành phần cần thiết
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const Dashboard = () => {
  const [portfolioData, setPortfolioData] = useState([]);
  const [watchedCoins, setWatchedCoins] = useState([]);
  const [marketData, setMarketData] = useState([]);

  // useEffect để lấy dữ liệu danh mục đầu tư khi component được render lần đầu
  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        // Gọi API lấy dữ liệu danh mục đầu tư
        const response = await api.getPortfolioData();
        setPortfolioData(response.data || []); // Cập nhật state với dữ liệu trả về hoặc mảng rỗng nếu không có dữ liệu
      } catch (error) {
        // Xử lý lỗi nếu gọi API thất bại
        console.error("Failed to fetch portfolio data:", error);
      }
    };

    fetchPortfolioData(); // Thực thi hàm khi component mount
  }, []); // Mảng phụ thuộc rỗng để chỉ gọi khi component mount

  // useEffect để lấy danh sách theo dõi khi component được render lần đầu
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        // Gọi API lấy dữ liệu danh sách theo dõi
        const response = await api.getWatchlist();
        setWatchedCoins(response.data || []); // Cập nhật state với dữ liệu trả về hoặc mảng rỗng nếu không có dữ liệu
      } catch (error) {
        // Xử lý lỗi nếu gọi API thất bại
        console.error("Failed to fetch watchlist:", error);
        setWatchedCoins([]); // Đặt lại thành mảng rỗng nếu có lỗi
      }
    };

    fetchWatchlist(); // Thực thi hàm khi component mount
  }, []); // Mảng phụ thuộc rỗng để chỉ gọi khi component mount

  // useEffect để lấy dữ liệu thị trường từ Binance khi component được render lần đầu
  useEffect(() => {
    const fetchMarketDataFromBinance = async () => {
      const data = await fetchMarketData(); // Gọi API lấy dữ liệu thị trường từ Binance
      setMarketData(data); // Cập nhật state với dữ liệu thị trường
    };

    fetchMarketDataFromBinance(); // Thực thi hàm khi component mount
  }, []); // Mảng phụ thuộc rỗng để chỉ gọi khi component mount

  // Hàm tạo dữ liệu biểu đồ cho coin
  const createChartData = (coin) => ({
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], // Nhãn các tháng
    datasets: [
      {
        label: `${coin.name || ""} (${coin.symbol || ""}) Purchase Price`, // Nhãn của biểu đồ
        data: coin.priceHistory || [], // Dữ liệu giá lịch sử của coin
        fill: true, // Đổ màu nền dưới đường biểu đồ
        borderColor: "#3b82f6", // Màu của đường biểu đồ
        backgroundColor: "rgba(59, 130, 246, 0.1)", // Màu nền của vùng dưới biểu đồ
        tension: 0.4, // Độ cong của đường biểu đồ
      },
    ],
  });

  // useEffect để lấy danh sách theo dõi từ localStorage khi component được render lần đầu
  useEffect(() => {
    const storedCoins = JSON.parse(localStorage.getItem("watchedCoins") || "[]"); // Lấy danh sách theo dõi từ localStorage hoặc mảng rỗng nếu không có dữ liệu
    setWatchedCoins(storedCoins); // Cập nhật state với danh sách đã lưu
  }, []); // Mảng phụ thuộc rỗng để chỉ gọi khi component mount

  // Hàm lấy dữ liệu coin theo ký hiệu (symbol)
  const getCoinData = (symbol) => {
    const formattedSymbol = symbol.endsWith("USDT") ? symbol : symbol + "USDT"; // Đảm bảo ký hiệu coin kết thúc bằng "USDT"
    const data = marketData.find((coin) => coin.symbol === formattedSymbol); // Tìm dữ liệu coin từ danh sách thị trường

    // Trả về giá cuối cùng và phần trăm thay đổi giá nếu có, nếu không trả về "N/A"
    return {
      lastPrice: data?.lastPrice || "N/A",
      priceChangePercent: data?.priceChangePercent || "N/A",
    };
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Dashboard</h2>

      {/* Watchlist */}
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Watchlist</h3>
      {watchedCoins.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {watchedCoins.map((symbol, index) => {
              // Đảm bảo symbol là chuỗi hoặc số; nếu không, gán giá trị mặc định
              const safeSymbol = typeof symbol === "string" || typeof symbol === "number" ? symbol : "Unknown Symbol";
              const coinData = getCoinData(safeSymbol);

              // Kiểm tra loại dữ liệu trước khi render
              const lastPrice = typeof coinData.lastPrice === "string" || typeof coinData.lastPrice === "number" ? coinData.lastPrice : "N/A";
              const priceChangePercent = typeof coinData.priceChangePercent === "string" || typeof coinData.priceChangePercent === "number" ? coinData.priceChangePercent : "N/A";

              return (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="font-medium text-lg text-gray-700 mb-2 flex items-center">
                    {safeSymbol}
                  </h3>
                  <div className="text-sm text-gray-500 mb-1">
                    Current Price: <span className="text-gray-800 font-medium">{formatPrice(lastPrice)} </span>
                  </div>
                  <div className={`text-sm ${parseFloat(priceChangePercent) >= 0 ? "text-green-500" : "text-red-500"}`}>
                    24h Change: {priceChangePercent}%
                  </div>
                </div>
              );
            })}

          </div>
        </>
      ) : (
        <p className="text-center text-gray-500">No coins in watchlist</p>
      )}

      <h3 className="text-xl font-semibold text-gray-700 mt-10 mb-4">Portfolio</h3>
      {/* Spacing between watchlist and portfolio */}
      {portfolioData.length > 0 ? (
        <div className="mt-10">
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {portfolioData.map((coin, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="font-medium text-lg text-gray-700 mb-2 flex items-center">
                  {coin.name ? coin.name : coin.symbol ? `${coin.symbol}` : ""}
                </h3>
                <div className="text-sm text-gray-500 mb-1">
                  Quantity: <span className="text-gray-800 font-medium">{coin.quantity || 0}</span>
                </div>
                <div className="text-sm text-gray-500 mb-1">
                  Value (USD): <span className="text-gray-800 font-medium">
                    ${(coin.currentValueUSD || 0).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-1">
                  Value (JPY): <span className="text-gray-800 font-medium">
                    ¥{(coin.currentValueJPY || 0).toLocaleString()}
                  </span>
                </div>
                <div className={`text-sm ${coin.isProfit ? "text-green-500" : "text-red-500"}`}>
                  Profit/Loss: {coin.isProfit ? "+" : "-"}${Math.abs(coin.profitLossUSD || 0).toLocaleString()}  /
                  {coin.isProfit ? "+" : "-"}¥{Math.abs(coin.profitLossJPY || 0).toLocaleString()}
                </div>
                <div className="mt-4">
                  <Line data={createChartData(coin)} options={{ maintainAspectRatio: false }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">No coins in portfolio</p>
      )}
    </div>
  );

};

export default Dashboard;
