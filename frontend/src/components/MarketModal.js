// export default MarketModal;
import React, { useState, useEffect, useMemo } from "react";
import { FaSort, FaSortUp, FaSortDown, FaStar } from "react-icons/fa";
import { fetchMarketData } from '../services/api_service';
import { formatPrice } from '../utils/format';
import api from "../api";

const MarketModal = () => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [filteredCoins, setFilteredCoins] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [watchedCoins, setWatchedCoins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [coins, setCoins] = useState([]);

  const itemsPerPage = 15;

  // useEffect để khởi động WebSocket và thiết lập các khoảng thời gian cập nhật
  useEffect(() => {
    // Gọi hàm fetchData để lấy dữ liệu ban đầu từ API
    fetchData();

    // Mở kết nối WebSocket tới Binance để nhận dữ liệu ticker theo thời gian thực
    const socket = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");
    let buffer = []; // Bộ đệm lưu trữ dữ liệu tạm thời

    // Xử lý khi có dữ liệu mới từ WebSocket
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data); // Parse dữ liệu JSON từ sự kiện WebSocket
      const usdtCoins = data.filter((coin) => coin && coin.symbol && coin.symbol.endsWith("USDT")); // Chỉ lấy những coin có ký hiệu kết thúc bằng "USDT"
      if (usdtCoins.length > 0) {
        buffer = usdtCoins; // Cập nhật bộ đệm với các coin USDT
      }
    };

    // Cập nhật dữ liệu từ bộ đệm mỗi 2 giây
    const intervalId = setInterval(() => {
      if (buffer.length > 0) {
        setCoins(buffer); // Cập nhật danh sách coin
        setFilteredCoins(buffer); // Cập nhật danh sách coin đã lọc
        sessionStorage.setItem("usdtCoins", JSON.stringify(buffer)); // Lưu vào session storage
        buffer = []; // Đặt lại bộ đệm sau khi cập nhật
      }
    }, 2000);

    // Thiết lập để gọi API mỗi 60 giây để cập nhật dữ liệu
    const apiIntervalId = setInterval(fetchData, 60000);

    // Dọn dẹp WebSocket và khoảng thời gian khi component unmount
    return () => {
      socket.close(); // Đóng WebSocket khi không còn cần
      clearInterval(intervalId); // Xóa khoảng thời gian cập nhật từ bộ đệm
      clearInterval(apiIntervalId); // Xóa khoảng thời gian cập nhật API
    };
  }, []);

  // Hàm fetch dữ liệu từ API
  const fetchData = async () => {
    setLoading(true); // Bắt đầu trạng thái tải
    const data = await fetchMarketData(); // Gọi API lấy dữ liệu thị trường
    setCoins(data); // Cập nhật danh sách coin
    setFilteredCoins(data); // Cập nhật danh sách coin đã lọc
    sessionStorage.setItem("usdtCoins", JSON.stringify(data)); // Lưu dữ liệu vào session storage
    setLoading(false); // Kết thúc trạng thái tải
  };

  // Hàm xử lý tìm kiếm với từ khóa
  const handleSearch = (term) => {
    const searchTerm = term.toLowerCase(); // Chuyển từ khóa tìm kiếm sang chữ thường
    setSearchTerm(searchTerm); // Cập nhật từ khóa tìm kiếm
    setFilteredCoins(coins.filter((coin) => coin.symbol.toLowerCase().includes(searchTerm))); // Lọc danh sách coin theo từ khóa
    setCurrentPage(1); // Đặt lại trang hiện tại về trang đầu tiên
  };

  // useEffect để lấy danh sách theo dõi từ API khi component mount
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const response = await api.getWatchlist(); // Gọi API lấy danh sách theo dõi
        setWatchedCoins(response.data || []); // Cập nhật danh sách theo dõi hoặc đặt mảng rỗng nếu không có dữ liệu
      } catch (error) {
        console.error("Failed to fetch watchlist:", error);
        setWatchedCoins([]); // Đặt lại thành mảng rỗng nếu có lỗi
      }
    };

    fetchWatchlist(); // Thực hiện lấy danh sách theo dõi khi component mount
  }, []);

  // Hàm thêm/xóa coin khỏi danh sách theo dõi
  const handleWatchCoin = async (coinSymbol) => {
    const isWatched = watchedCoins.includes(coinSymbol); // Kiểm tra nếu coin đã có trong danh sách theo dõi
    const action = isWatched ? "remove" : "add"; // Xác định hành động là thêm hay xóa
    await api.updateWatchlist(coinSymbol, action); // Cập nhật danh sách theo dõi qua API

    // Cập nhật danh sách theo dõi trong state dựa vào hành động
    setWatchedCoins((prev) =>
      isWatched ? prev.filter((c) => c !== coinSymbol) : [...prev, coinSymbol]
    );
  };

  // Hàm xử lý sắp xếp theo cột
  const requestSort = (key) => {
    let direction = "ascending"; // Thiết lập hướng sắp xếp mặc định là tăng dần
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"; // Nếu đã tăng dần thì đổi sang giảm dần
    }
    setSortConfig({ key, direction }); // Cập nhật cấu hình sắp xếp
  };

  // Tối ưu hóa lọc và phân trang dữ liệu với useMemo
  const filteredData = useMemo(() => {
    return coins.filter((coin) => coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())); // Lọc dữ liệu dựa trên từ khóa tìm kiếm
  }, [coins, searchTerm]);

  // Sắp xếp dữ liệu đã lọc dựa trên cấu hình sắp xếp
  const sortedCoins = useMemo(() => {
    if (!sortConfig.key) return filteredData; // Nếu không có cấu hình sắp xếp, trả về dữ liệu đã lọc
    return [...filteredData].sort((a, b) => {
      // Chuyển đổi giá trị thành số nếu là trường hợp lastPrice hoặc quoteVolume
      const aValue = sortConfig.key === "lastPrice" || sortConfig.key === "quoteVolume" ? parseFloat(a[sortConfig.key]) : a[sortConfig.key];
      const bValue = sortConfig.key === "lastPrice" || sortConfig.key === "quoteVolume" ? parseFloat(b[sortConfig.key]) : b[sortConfig.key];
      // Sắp xếp theo hướng cấu hình (tăng hoặc giảm)
      return sortConfig.direction === "ascending" ? aValue - bValue : bValue - aValue;
    });
  }, [filteredData, sortConfig]);

  // Lấy dữ liệu coin cần hiển thị theo trang hiện tại
  const displayedCoins = useMemo(() => {
    return sortedCoins.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage); // Cắt dữ liệu theo trang
  }, [sortedCoins, currentPage, itemsPerPage]);

  // Hàm lấy biểu tượng sắp xếp cho từng cột
  const getSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) return <FaSort className="inline ml-2" />; // Trả về biểu tượng mặc định nếu không sắp xếp theo cột
    return sortConfig.direction === "ascending" ? <FaSortUp className="inline ml-2" /> : <FaSortDown className="inline ml-2" />; // Trả về biểu tượng theo hướng sắp xếp
  };

  // Hàm xử lý trang tiếp theo
  const handleNextPage = () => {
    if (currentPage < Math.ceil(filteredCoins.length / itemsPerPage)) {
      setCurrentPage((prev) => prev + 1); // Chuyển đến trang tiếp theo nếu chưa đến trang cuối
    }
  };

  // Hàm xử lý trang trước đó
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1); // Quay lại trang trước nếu chưa ở trang đầu tiên
    }
  };

  // Định dạng volume thành dạng đọc dễ hiểu (B = tỷ, M = triệu)
  const formatVolume = (volume) => {
    if (volume >= 1e9) {
      return `$${(volume / 1e9).toFixed(2)}B`; // Định dạng thành tỷ nếu lớn hơn hoặc bằng 1 tỷ
    } else if (volume >= 1e6) {
      return `$${(volume / 1e6).toFixed(2)}M`; // Định dạng thành triệu nếu lớn hơn hoặc bằng 1 triệu
    } else {
      return `$${volume.toFixed(2)}`; // Giữ lại số thập phân nếu nhỏ hơn 1 triệu
    }
  };



  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Market Prices</h2>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search coin..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-800"
        />
      </div>
      <div className="overflow-y-auto max-h-[500px]">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: "5%" }}>
                  {/* Cột icon sao */}
                </th>
                <th className="px-16 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort("symbol")} style={{ width: "20%" }}>
                  Coin {getSortIcon("symbol")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort("lastPrice")} style={{ width: "20%" }}>
                  Price (USDT) {getSortIcon("lastPrice")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort("priceChangePercent")} style={{ width: "20%" }}>
                  Change (24h) {getSortIcon("priceChangePercent")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort("quoteVolume")} style={{ width: "20%" }}>
                  Volume (24h) {getSortIcon("quoteVolume")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedCoins.map((coin) => (
                <tr key={coin.symbol}>
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => handleWatchCoin(coin.symbol)} className="text-yellow-500">
                      <FaStar className={watchedCoins?.includes(coin.symbol) ? "text-yellow-500" : "text-gray-300"} />
                    </button>

                  </td>
                  <td className="px-16 py-4 whitespace-nowrap text-sm font-medium text-gray-800" style={{ width: "20%" }}>
                    {coin.symbol.replace("USDT", "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800" style={{ width: "20%" }}>
                    {formatPrice(coin.lastPrice)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${parseFloat(coin.priceChangePercent) >= 0 ? "text-green-600" : "text-red-600"}`} style={{ width: "20%" }}>
                    {parseFloat(coin.priceChangePercent).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800" style={{ width: "20%" }}>
                    {formatVolume(parseFloat(coin.quoteVolume))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-700">Page {currentPage} of {Math.ceil(filteredCoins.length / itemsPerPage)}</span>
        <button
          onClick={handleNextPage}
          disabled={currentPage >= Math.ceil(filteredCoins.length / itemsPerPage)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </>

  );
};

export default MarketModal;