
import React, { useState, useEffect, useCallback, useRef } from "react";
import { fetchExchangeRate, fetchSuggestions } from '../services/api_service';
import { formatCurrency } from '../utils/format';
import api from "../api";

const AddTransactionModal = ({ show, onClose, onAdd, onUpdate, transaction }) => {
  const [transactionType, setTransactionType] = useState(transaction?.transaction_type || "buy");
  const [searchTerm, setSearchTerm] = useState(transaction?.coin || "");
  const [amount, setAmount] = useState(transaction?.amount || "");
  const [price, setPrice] = useState(transaction?.price || "");
  const [isCoinSelected, setIsCoinSelected] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  });
  const [exchangeRate, setExchangeRate] = useState(0);
  const [valueInYen, setValueInYen] = useState(0);
  const [dateError, setDateError] = useState("");
  const [rawPrice, setRawPrice] = useState("");
  const [error, setError] = useState("");
  const searchInputRef = useRef(null);
  const today = new Date();


  // Fetch tỷ giá USD/JPY khi mở modal
  useEffect(() => {
    // Hàm bất đồng bộ để lấy tỷ giá từ API
    const getExchangeRate = async () => {
      const rate = await fetchExchangeRate(); // Gọi API để lấy tỷ giá USD/JPY
      setExchangeRate(rate); // Cập nhật tỷ giá vào state
    };
    getExchangeRate(); // Thực thi hàm lấy tỷ giá khi component render
  }, []);

  // Tính toán giá trị theo Yên khi thay đổi amount hoặc selectedCoin
  useEffect(() => {
    if (price && amount && exchangeRate) {
      // Chuyển đổi giá trị theo Yên dựa vào số lượng, giá và tỷ giá hiện tại
      const value = parseFloat(amount) * parseFloat(price) * exchangeRate;
      setValueInYen(value); // Lưu giá trị đã quy đổi vào state
    }
  }, [price, amount, exchangeRate]);

  // Hàm resetModal để đặt lại các giá trị trong modal
  const resetModal = useCallback(() => {
    setSearchTerm(""); // Xóa từ khóa tìm kiếm
    setSelectedCoin(null); // Đặt lại đồng coin đã chọn
    setIsCoinSelected(false); // Đặt lại trạng thái đã chọn coin
    setSuggestions([]); // Xóa danh sách gợi ý
    setAmount(""); // Đặt lại giá trị số lượng
    setPrice(""); // Đặt lại giá
    setRawPrice(""); // Đặt lại giá hiển thị
    setSelectedDate({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
    }); // Đặt lại ngày về ngày hiện tại
    setValueInYen(0); // Đặt lại giá trị quy đổi theo Yên
    setDateError(""); // Xóa thông báo lỗi ngày
  }, []);

  // Fetch các coin gợi ý từ API khi search
  useEffect(() => {
    // Nếu đã chọn coin hoặc từ khóa ngắn hơn 2 ký tự, xóa gợi ý
    if (isCoinSelected || searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    // Sử dụng callback trong setTimeout để gọi fetchSuggestions sau 300ms
    const debounceFetch = setTimeout(() => {
      fetchSuggestions(searchTerm, setLoading, setSuggestions);
    }, 300);

    // Xóa thời gian chờ khi input thay đổi hoặc component unmount
    return () => clearTimeout(debounceFetch);
  }, [searchTerm, isCoinSelected]);


  // Hàm xử lý khi thay đổi amount
  const handleAmountChange = (e) => {
    const input = e.target.value;
    // Kiểm tra xem giá trị nhập vào có hợp lệ không (chỉ cho phép số và dấu thập phân)
    if (/^\d*\.?\d*$/.test(input)) {
      setAmount(input); // Cập nhật giá trị vào state
    }
  };

  // Hàm xử lý khi chọn coin từ danh sách gợi ý
  const handleCoinSelect = (coin) => {
    setSelectedCoin(coin); // Lưu thông tin coin đã chọn
    setSearchTerm(coin.symbol); // Cập nhật từ khóa tìm kiếm theo coin đã chọn
    setPrice(coin.price); // Cập nhật giá của coin đã chọn
    setRawPrice(formatCurrency(coin.price, "USD")); // Định dạng giá cho hiển thị
    setSuggestions([]); // Xóa danh sách gợi ý sau khi chọn
    setIsCoinSelected(true); // Đặt trạng thái đã chọn coin thành true
  };

  // Hàm xử lý khi thay đổi giá
  const handlePriceChange = (e) => {
    const input = e.target.value.replace(/[^0-9.]/g, ""); // Chỉ giữ lại chữ số và dấu thập phân
    setRawPrice(input); // Lưu trữ giá trị thô
    if (!isNaN(input)) {
      setPrice(input); // Cập nhật giá trị vào state
    }
  };

  // Định dạng giá trị khi người dùng rời khỏi ô input
  const handlePriceBlur = () => {
    if (price) {
      setRawPrice(formatCurrency(price, "USD")); // Định dạng lại giá trị khi người dùng rời khỏi ô
    }
  };

  // Xóa định dạng khi người dùng click vào input để chỉnh sửa
  const handlePriceFocus = () => {
    setRawPrice(price); // Hiển thị giá trị thô để chỉnh sửa dễ dàng hơn
  };

  // Hàm xử lý khi thay đổi ngày
  const handleDateChange = (field, value) => {
    const newDate = { ...selectedDate, [field]: parseInt(value, 10) };
    const selected = new Date(newDate.year, newDate.month - 1, newDate.day);

    if (selected > today) {
      setDateError("Cannot select a future date."); // Hiển thị lỗi nếu chọn ngày tương lai
    } else {
      setDateError(""); // Xóa lỗi nếu chọn ngày hợp lệ
      setSelectedDate(newDate); // Cập nhật ngày vào state
    }
  };

  // Cập nhật các giá trị vào modal khi hiển thị modal
  useEffect(() => {
    if (show) {
      if (transaction) {
        // Nếu là chỉnh sửa giao dịch, điền dữ liệu hiện có vào các trường
        setTransactionType(transaction.transaction_type);
        setSearchTerm(transaction.coin);
        setAmount(transaction.amount);
        setPrice(transaction.price);
        setRawPrice(formatCurrency(transaction.price, "USD"));
        setSuggestions([]);
        setIsCoinSelected(true);
      } else {
        // Nếu là giao dịch mới, đặt các trường vào trạng thái mặc định và focus vào ô tìm kiếm
        setTransactionType("buy");
        setSearchTerm("");
        setAmount("");
        setPrice("");
        setRawPrice("");
        setSuggestions([]);
        setIsCoinSelected(false);
        searchInputRef.current?.focus();
      }
    }
  }, [transaction, show]);

  // Hàm lưu giao dịch
  const handleSaveTransaction = async () => {
    // Kiểm tra nếu chưa chọn coin hoặc không nhập amount, hiển thị lỗi
    if ((!transaction && !selectedCoin) || !amount) {
      setError("Please select a coin and enter an amount.");
      return;
    }

    // Chuẩn bị dữ liệu giao dịch để lưu
    const transactionData = {
      ...transaction,
      coin: transaction ? transaction.coin : selectedCoin.symbol,
      transaction_type: transactionType,
      amount: parseFloat(amount),
      price: parseFloat(price),
      value: parseFloat(valueInYen),
      date: new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day),
    };

    try {
      let response;

      if (transaction) {
        // Nếu là cập nhật giao dịch hiện có
        response = await api.updateTransaction({ ...transactionData, id: transaction._id });
        if (response.status === 200 && (!response.data.code || response.data.code === null)) {
          onUpdate(response.data); // Gọi callback cập nhật sau khi thành công
          resetModal();
          onClose();
        } else if (response.status === 400 && response.data.code) {
          // Xử lý các lỗi cụ thể khi cập nhật
          switch (response.data.code) {
            case "COIN_NOT_IN_PORTFOLIO":
              setError("You cannot sell this coin as it is not in your portfolio.");
              break;
            case "SELL_AMOUNT_EXCEEDS_HOLDING":
              setError("The sell amount exceeds your current holding.");
              break;
            default:
              setError(response.data.message || "Unable to update transaction. Please try again.");
          }
        } else {
          setError("Unable to update transaction. Please try again.");
        }
      } else {
        // Nếu là thêm giao dịch mới
        response = await api.addTransaction(transactionData);
        if (response.status === 201 && (!response.data.code || response.data.code === null)) {
          onAdd(transactionData); // Gọi callback thêm mới sau khi thành công
          resetModal();
          onClose();
        } else if (response.status === 400 && response.data.code) {
          // Xử lý các lỗi cụ thể khi thêm mới
          switch (response.data.code) {
            case "COIN_NOT_IN_PORTFOLIO":
              setError("You cannot sell this coin as it is not in your portfolio.");
              break;
            case "SELL_AMOUNT_EXCEEDS_HOLDING":
              setError("The sell amount exceeds your current holding.");
              break;
            default:
              setError(response.data.message || "Unable to add transaction. Please try again.");
          }
        } else {
          setError("Unable to add transaction. Please try again.");
        }
      }
    } catch (error) {
      // Xử lý lỗi khi lưu giao dịch không thành công
      console.error("Failed to save transaction:", error);
      if (error.response) {
        setError(error.response.data.message || "Unknown error from the server.");
      } else if (error.request) {
        setError("Cannot connect to the server. Please check your network connection.");
      } else {
        setError("An error occurred while saving the transaction. Please try again.");
      }
    }
  };


  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900">{transaction ? "Edit Transaction" : "Add New Transaction"}</h3>
        {error && (
          <p className="text-red-500 text-sm mt-2 text-center">
            {error}
          </p>
        )}
        <div className="mt-2 space-y-4">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for coin..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsCoinSelected(false);
              }}
              className="w-full p-2 border border-gray-300 rounded-md pr-10 bg-gray-50 text-gray-800"
            />
            {loading && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
            {suggestions.length > 0 && (
              <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-auto">
                {suggestions.map((coin) => (
                  <div
                    key={coin.symbol}
                    className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                    onClick={() => handleCoinSelect(coin)}
                  >
                    <span className="font-medium">{coin.symbol}</span>
                    <span className="text-sm text-gray-600">{formatCurrency(coin.price, "USD")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <select
            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-800"
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
          <input
            type="text"
            placeholder="Amount"
            value={amount}
            onChange={handleAmountChange}
            className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-800"
          />
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Price per coin"
              onChange={handlePriceChange}
              onBlur={handlePriceBlur}
              onFocus={handlePriceFocus}
              value={rawPrice}
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-800"
            />
          </div>
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Value in ¥"
              value={valueInYen ? formatCurrency(valueInYen, "JPY") : ""}
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-800"
              readOnly
            />
          </div>
          <div className="flex space-x-2">
            <select
              value={selectedDate.year}
              onChange={(e) => handleDateChange("year", e.target.value)}
              className="w-1/3 p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-800"
            >
              {Array.from({ length: 101 }, (_, i) => today.getFullYear() - i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={selectedDate.month}
              onChange={(e) => handleDateChange("month", e.target.value)}
              className="w-1/3 p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-800"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={selectedDate.day}
              onChange={(e) => handleDateChange("day", e.target.value)}
              className="w-1/3 p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-800"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          {dateError && <p className="text-red-500 text-sm mt-1">{dateError}</p>}
        </div>
        <div className="mt-4 flex justify-center space-x-3">
          <button
            onClick={() => {
              onClose();
              resetModal();
            }}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveTransaction}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            {transaction ? "Update Transaction" : "Add Transaction"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AddTransactionModal);
