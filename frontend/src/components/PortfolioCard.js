import React, { useState, useEffect } from "react";
import axios from "axios";

const PortfolioCard = ({ asset }) => {
  const [exchangeRate, setExchangeRate] = useState(1); // Tỷ giá USD sang JPY, mặc định ban đầu là 1

  // useEffect để lấy tỷ giá USD/JPY từ API khi component được render lần đầu
  useEffect(() => {
    // Hàm bất đồng bộ để gọi API lấy tỷ giá
    const fetchExchangeRate = async () => {
      try {
        // Gọi API lấy dữ liệu tỷ giá hối đoái mới nhất từ USD sang các đồng tiền khác
        const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
        const rate = response.data.rates.JPY; // Lấy tỷ giá từ USD sang JPY từ dữ liệu trả về
        setExchangeRate(rate); // Cập nhật tỷ giá vào state
      } catch (error) {
        // Xử lý lỗi nếu gọi API thất bại
        console.error("Error fetching exchange rate:", error);
      }
    };

    // Gọi hàm fetchExchangeRate khi component được render lần đầu
    fetchExchangeRate();
  }, []); // Mảng phụ thuộc rỗng để chỉ gọi khi component mount


  const isProfit = asset.profitLoss >= 0;
  const profitLossClass = isProfit ? "text-green-500" : "text-red-500";
  const profitSign = isProfit ? "+" : "-";
  const currentValueJPY = asset.currentValue * exchangeRate;
  const profitLossJPY = asset.profitLoss * exchangeRate;

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 transition transform hover:scale-102 hover:shadow-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-base text-gray-700">{asset.name} {asset.symbol}</h3>
      </div>
      <div className="text-sm text-gray-500 mb-1">Quantity: <span className="text-gray-800 font-medium">{asset.quantity}</span></div>
      <div className="text-sm text-gray-500 mb-1">Value (USD): <span className="text-gray-800 font-medium">${asset.currentValue.toLocaleString()} </span></div>
      <div className="text-sm text-gray-500 mb-1">Value (JPY): <span className="text-gray-800 font-medium">¥{currentValueJPY.toLocaleString()}</span></div>

      {/* Hiển thị lãi/lỗ và phần trăm */}
      <div className={`text-sm ${profitLossClass}`}>
        Profit/Loss: {profitSign}${Math.abs(asset.profitLoss).toLocaleString()} / {profitSign}¥{Math.abs(profitLossJPY).toLocaleString()}
      </div>
      <div className={`text-sm ${profitLossClass}`}>
        {profitSign}{Math.abs(asset.profitLossPercent).toFixed(2)}%
      </div>
    </div>
  );

};

export default React.memo(PortfolioCard);

