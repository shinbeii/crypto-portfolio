import React, { useState, useEffect } from 'react';
import AddTransactionModal from '../components/AddTransactionModal';
import TransactionRow from '../components/TransactionRow';
import { FaPlus } from "react-icons/fa";
import api from '../api';

const History = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [highlightedRow, setHighlightedRow] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [ setCurrentPage] = useState(1);


  // useEffect để lấy dữ liệu giao dịch khi component được render lần đầu
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // Gọi API để lấy dữ liệu giao dịch
        const response = await api.getTransactions();
        // Lọc ra các giao dịch hợp lệ (đảm bảo các trường cần thiết đều có giá trị)
        const validTransactions = (response.data || []).filter(transaction =>
          transaction.transaction_type && transaction.coin && transaction.amount && transaction.price
        );
        setTransactionHistory(validTransactions); // Cập nhật danh sách giao dịch hợp lệ vào state
      } catch (error) {
        // Xử lý lỗi nếu gọi API thất bại
        console.error("Failed to fetch transactions:", error);
        setTransactionHistory([]); // Đặt danh sách giao dịch thành mảng rỗng nếu có lỗi
      }
    };

    fetchTransactions(); // Gọi hàm fetchTransactions khi component mount
  }, []); // Mảng phụ thuộc rỗng để chỉ gọi khi component mount

  // Hàm xử lý khi thay đổi từ khóa tìm kiếm
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value); // Cập nhật từ khóa tìm kiếm trong state
  };

  // Hàm thêm giao dịch mới vào lịch sử giao dịch
  const handleAddTransaction = (newTransaction) => {
    if (newTransaction) {
      // Cập nhật danh sách giao dịch, thêm giao dịch mới vào đầu danh sách
      setTransactionHistory((prevHistory) => {
        const updatedHistory = [newTransaction, ...prevHistory];
        return updatedHistory; // Trả về danh sách đã cập nhật
      });
      setCurrentPage(1); // Đặt trang hiện tại về trang đầu tiên
      setHighlightedRow(newTransaction._id); // Đánh dấu hàng mới thêm
    }
    setShowAddModal(false); // Đóng modal thêm giao dịch
  };

  // Hàm cập nhật giao dịch trong danh sách khi có chỉnh sửa
  const handleUpdateTransaction = (updatedTransaction) => {
    // Cập nhật danh sách giao dịch, thay thế giao dịch cũ bằng giao dịch đã chỉnh sửa
    setTransactionHistory((prevHistory) =>
      prevHistory.map((transaction) =>
        transaction._id === updatedTransaction._id ? updatedTransaction : transaction
      )
    );
    setHighlightedRow(updatedTransaction._id); // Đánh dấu hàng giao dịch đã chỉnh sửa
    setSelectedTransaction(null); // Đặt lại giao dịch đã chọn về null
  };

  // Lọc danh sách giao dịch dựa trên từ khóa tìm kiếm
  const filteredTransactions = transactionHistory?.filter((transaction) =>
    searchTerm === "" || (transaction.coin && transaction.coin.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  // useEffect để xóa highlight sau 2 giây
  useEffect(() => {
    if (highlightedRow) {
      // Thiết lập timer để xóa highlight sau 2 giây
      const timer = setTimeout(() => setHighlightedRow(null), 2000);
      return () => clearTimeout(timer); // Dọn dẹp timer khi component unmount hoặc highlightedRow thay đổi
    }
  }, [highlightedRow]); // Chỉ gọi khi highlightedRow thay đổi


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Transaction History</h2>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <input
            type="text"
            placeholder="Search by coin name"
            value={searchTerm}
            onChange={handleSearchChange}
            className="flex-grow px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={() => { setShowAddModal(true); setSelectedTransaction(null); }}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm md:text-base"
          >
            <FaPlus className="mr-2" />
            <span className="hidden sm:inline">Add Transaction</span>
            <span className="sm:hidden">Add</span>
          </button>
          <AddTransactionModal
            show={showAddModal}
            onClose={() => { setShowAddModal(false); setSelectedTransaction(null); }}
            transaction={selectedTransaction}
            onAdd={handleAddTransaction}
            onUpdate={handleUpdateTransaction}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-12 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-12 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coin</th>
              <th className="px-12 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-12 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price ($)</th>
              <th className="px-12 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value (¥)</th>
              <th className="px-12 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-12 py-3"></th>
            </tr>
          </thead>


          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransactions.length > 0 ? (
              <TransactionRow
                transactions={filteredTransactions}
                setTransactions={setTransactionHistory}
                highlightedRow={highlightedRow}
                onEdit={(transaction) => { setSelectedTransaction(transaction); setShowAddModal(true); }}
              />
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;
