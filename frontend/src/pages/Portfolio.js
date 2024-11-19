// export default Portfolio;
import React, { useState, useEffect } from 'react';
import ChartDisplay from '../components/ChartDisplay';
import PortfolioCard from "../components/PortfolioCard";
import api from '../api';
import { FaChartPie, FaChartBar } from "react-icons/fa";

const Portfolio = () => {
  const [activeChart, setActiveChart] = useState("pie");
  const [portfolioData, setPortfolioData] = useState([]);

  // useEffect để lấy dữ liệu danh mục đầu tư khi component được render lần đầu
  useEffect(() => {
    // Hàm bất đồng bộ để gọi API lấy dữ liệu danh mục đầu tư
    const fetchPortfolioData = async () => {
      try {
        // Gọi API để lấy dữ liệu danh mục đầu tư
        const response = await api.getPortfolio();
        const data = response.data; // Lưu trữ dữ liệu danh mục đầu tư từ phản hồi của API
        setPortfolioData(data); // Cập nhật state với dữ liệu danh mục đầu tư
      } catch (error) {
        // Xử lý lỗi nếu gọi API thất bại
        console.error("Error fetching portfolio data:", error);
      }
    };

    fetchPortfolioData(); // Thực thi hàm fetchPortfolioData khi component mount
  }, []); // Mảng phụ thuộc rỗng để chỉ gọi khi component mount


  const chartData = {
    labels: portfolioData.map((item) => item.symbol),
    datasets: [{
      data: portfolioData.map((item) => item.quantity), // Đổi từ currentValue sang quantity
      backgroundColor: [
        "rgba(255, 206, 86, 0.7)",
        "rgba(54, 162, 235, 0.7)",
        "rgba(255, 159, 64, 0.7)",
        "rgba(201, 203, 207, 0.7)"
      ],
      borderColor: [
        "rgba(255, 206, 86, 1)",
        "rgba(54, 162, 235, 1)",
        "rgba(255, 159, 64, 1)",
        "rgba(201, 203, 207, 1)"
      ],
      borderWidth: 2
    }]
  };

  const chartDataProfitLoss = {
    labels: portfolioData.map((item) => item.symbol),
    datasets: [{
      label: "Profit/Loss (%)",
      data: portfolioData.map((item) => item.profitLossPercent),
      backgroundColor: portfolioData.map((item) => item.profitLoss >= 0 ? "rgba(75, 192, 192, 0.7)" : "rgba(255, 99, 132, 0.7)"),
      borderColor: portfolioData.map((item) => item.profitLoss >= 0 ? "rgba(75, 192, 192, 1)" : "rgba(255, 99, 132, 1)"),
      borderWidth: 2
    }]
  };


  const totalValue = portfolioData.reduce((acc, asset) => acc + asset.currentValue, 0);
  const totalProfitLoss = portfolioData.reduce((acc, asset) => acc + asset.profitLoss, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-medium text-gray-600 mb-4">Total Portfolio Value</h2>
            <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-blue-800 break-words">${totalValue.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-r from-green-100 to-green-50 rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-medium text-gray-600 mb-4">Total Profit/Loss</h2>
            <p className={`text-3xl sm:text-4xl md:text-5xl font-extrabold ${totalProfitLoss >= 0 ? "text-green-700" : "text-red-700"} break-words`}>
              {totalProfitLoss >= 0 ? "+" : "-"}${Math.abs(totalProfitLoss).toLocaleString()}
            </p>
          </div>
        </div>


      </div>
      <div className="mb-6 flex justify-end space-x-4">
        <button
          onClick={() => setActiveChart("pie")}
          className={`flex items-center px-4 py-2 rounded-lg transition-all ${activeChart === "pie" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          <FaChartPie className="mr-2" /> Pie Chart
        </button>
        <button
          onClick={() => setActiveChart("bar")}
          className={`flex items-center px-4 py-2 rounded-lg transition-all ${activeChart === "bar" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          <FaChartBar className="mr-2" /> Bar Chart
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột Biểu đồ */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 col-span-1 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Asset Distribution</h2>
          <ChartDisplay activeChart={activeChart} chartData={chartData} />

          <h2 className="text-xl font-semibold mt-8 mb-6 text-gray-800">Profit/Loss Overview</h2>
          <ChartDisplay activeChart="bar" chartData={chartDataProfitLoss} />
        </div>

        {/* Cột Chi Tiết Tài Sản */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Asset Details</h2>
          <div className="space-y-4">
            {portfolioData.map((asset, index) => (
              <PortfolioCard key={index} asset={asset} />
            ))}
          </div>
        </div>
      </div>


    </div>
  );
};

export default Portfolio;
