import axios from 'axios';

// Hàm lấy tỷ giá USD/JPY từ API
export const fetchExchangeRate = async () => {
  try {
    // Gọi API để lấy tỷ giá từ USD sang các loại tiền tệ khác
    const response = await axios.get("https://api.exchangerate-api.com/v4/latest/USD");
    return response.data.rates.JPY || 0; // Trả về tỷ giá JPY hoặc 0 nếu không có dữ liệu
  } catch (error) {
    // Xử lý lỗi khi không thể gọi API
    console.error("Error fetching exchange rate:", error);
    return 0; // Trả về 0 trong trường hợp có lỗi
  }
};

// Hàm lấy dữ liệu thị trường từ Binance cho các cặp giao dịch kết thúc bằng USDT
export const fetchMarketData = async () => {
  try {
    // Gọi API để lấy dữ liệu thị trường trong 24 giờ từ Binance
    const response = await axios.get("https://api.binance.com/api/v3/ticker/24hr");
    // Lọc dữ liệu để chỉ lấy các coin có ký hiệu kết thúc bằng "USDT"
    return response.data.filter((coin) => coin.symbol && coin.symbol.endsWith("USDT"));
  } catch (error) {
    // Xử lý lỗi khi không thể gọi API
    console.error("Error fetching data:", error);
    return []; // Trả về mảng rỗng nếu có lỗi
  }
};

// Hàm lấy gợi ý các coin có ký hiệu trùng với từ khóa tìm kiếm
export const fetchSuggestions = async (searchTerm, setLoading, setSuggestions) => {
  setLoading(true); // Bắt đầu trạng thái tải
  try {
    const response = await axios.get("https://api.binance.com/api/v3/ticker/price");
    const coins = response.data
      .filter((coin) =>
        coin.symbol.toLowerCase().includes(searchTerm.toLowerCase()) &&
        coin.symbol.endsWith("USDT")
      )
      .slice(0, 5)
      .map((coin) => ({
        symbol: coin.symbol.replace("USDT", ""),
        price: parseFloat(coin.price),
      }));
    setSuggestions(coins); // Cập nhật danh sách gợi ý với các coin đã lọc
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    setSuggestions([]); // Đặt lại danh sách gợi ý thành mảng rỗng nếu có lỗi
  }
  setLoading(false); // Kết thúc trạng thái tải
};

