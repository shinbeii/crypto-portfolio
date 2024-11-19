// export default React.memo(TransactionRow);
import React, { useState, useMemo, useEffect } from "react";
import { formatAmount, formatPrice } from '../utils/format';
import AddTransactionModal from "./AddTransactionModal";
import { FaEdit } from "react-icons/fa";

const TransactionRow = ({ transactions, setTransactions = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [highlightedRow, setHighlightedRow] = useState(null);


  // useEffect chạy khi `transactions` hoặc `highlightedRow` thay đổi
  useEffect(() => {
    setCurrentPage(1); // Đặt lại trang hiện tại về trang đầu tiên khi danh sách giao dịch thay đổi

    // Nếu có hàng được đánh dấu (highlightedRow), đặt timer để xóa highlight sau 3 giây
    if (highlightedRow) {
      const timer = setTimeout(() => setHighlightedRow(null), 3000); // Xóa highlight sau 3 giây
      return () => clearTimeout(timer); // Dọn dẹp timer khi component unmount hoặc `highlightedRow` thay đổi
    }
  }, [transactions, highlightedRow]);

  // Hàm để đánh dấu (highlight) một hàng giao dịch
  const handleHighlight = (transactionId) => {
    setHighlightedRow(transactionId); // Đặt hàng được highlight với ID giao dịch
    setTimeout(() => setHighlightedRow(null), 3000); // Xóa highlight sau 3 giây
  };

  // Sắp xếp các giao dịch từ mới nhất đến cũ nhất
  const sortedTransactions = useMemo(() => {
    // Tạo một bản sao của mảng `transactions` và sắp xếp theo ngày giảm dần
    return [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions]); // Sắp xếp lại khi `transactions` thay đổi

  // Tính tổng số trang dựa trên số lượng giao dịch và số giao dịch trên mỗi trang
  const totalTransactionPages = useMemo(
    () => Math.ceil(sortedTransactions.length / transactionsPerPage),
    [sortedTransactions]
  );

  // Lấy các giao dịch được hiển thị dựa trên trang hiện tại
  const displayedTransactions = useMemo(
    () => transactions.slice((currentPage - 1) * transactionsPerPage, currentPage * transactionsPerPage),
    [transactions, currentPage]
  );

  // Hàm chuyển sang trang kế tiếp nếu chưa phải là trang cuối
  const handleNextPage = () => {
    if (currentPage < totalTransactionPages) {
      setCurrentPage((prevPage) => prevPage + 1); // Cập nhật state để chuyển sang trang kế
    }
  };

  // Hàm chuyển về trang trước đó nếu chưa ở trang đầu tiên
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1); // Cập nhật state để quay lại trang trước
    }
  };

  // Hàm định dạng ngày từ chuỗi ngày thành định dạng `YYYY/MM/DD`
  const formatDate = (dateString) => {
    const date = new Date(dateString); // Chuyển đổi chuỗi thành đối tượng ngày
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Thêm số 0 vào đầu nếu tháng nhỏ hơn 10
    const day = String(date.getDate()).padStart(2, '0'); // Thêm số 0 vào đầu nếu ngày nhỏ hơn 10
    return `${year}/${month}/${day}`; // Trả về chuỗi định dạng ngày
  };

  // Hàm định dạng số tiền theo kiểu tiền tệ (USD và JPY)
  const formatCurrency = (value, currency) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2, // Đảm bảo có ít nhất 2 chữ số sau dấu thập phân
    }).format(value); // Trả về giá trị đã định dạng
  };

  // Hàm xử lý khi người dùng nhấn vào nút chỉnh sửa giao dịch
  const handleEditClick = (transaction) => {
    setSelectedTransaction(transaction); // Đặt giao dịch được chọn để chỉnh sửa
  };

  // Hàm cập nhật giao dịch trong danh sách khi nhận được giao dịch đã chỉnh sửa
  const onUpdate = (updatedTransaction) => {
    // Cập nhật mảng giao dịch, thay thế giao dịch cũ bằng giao dịch đã chỉnh sửa
    setTransactions((prevTransactions) =>
      prevTransactions.map((t) =>
        t._id === updatedTransaction._id ? updatedTransaction : t
      )
    );
    setSelectedTransaction(null); // Đặt lại giao dịch đã chọn về null
    handleHighlight(updatedTransaction._id); // Đánh dấu (highlight) hàng giao dịch đã chỉnh sửa
  };

  return (
    <>
      {displayedTransactions.map((transaction, index) => (
        <tr
          key={index}
          className={`${highlightedRow === transaction._id ? "bg-green-100 transition ease-in-out duration-2000" : ""}`}
        >
          <td className={`px-12 py-4 whitespace-nowrap text-sm font-medium ${transaction.transaction_type === "buy" ? "text-green-500" : "text-red-500"}`}>
            {transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1)}
          </td>
          <td className="px-12 py-4 whitespace-nowrap text-sm text-gray-700">{transaction.coin}</td>
          <td className="px-12 py-4 whitespace-nowrap text-sm text-gray-700">{formatAmount(transaction.amount)}</td>
          <td className="px-12 py-4 whitespace-nowrap text-sm text-gray-700">
            {formatPrice(transaction.price) ? formatCurrency(transaction.price, "USD") : "-"}
          </td>
          <td className="px-12 py-4 whitespace-nowrap text-sm text-gray-700">
            {formatPrice(transaction.value) ? formatCurrency(transaction.value, "JPY") : "-"}
          </td>
          <td className="px-12 py-4 whitespace-nowrap text-sm text-gray-700">
            {transaction.date ? formatDate(transaction.date) : "-"}
          </td>
          <td className="px-3 py-4 whitespace-nowrap text-sm text-blue-500 text-center">
            <button onClick={() => handleEditClick(transaction)} className="text-blue-500">
              <FaEdit size={18} />
            </button>
          </td>
        </tr>

      ))}

      {selectedTransaction && (
        <AddTransactionModal
          show={true}
          onClose={() => setSelectedTransaction(null)}
          transaction={selectedTransaction}
          onUpdate={onUpdate}
        />
      )}

      {transactions.length > transactionsPerPage && (
        <tr>
          <td colSpan="7" className="px-6 py-4 text-center">
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalTransactionPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalTransactionPages}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </td>
        </tr>
      )}

    </>
  );
};

export default React.memo(TransactionRow);
