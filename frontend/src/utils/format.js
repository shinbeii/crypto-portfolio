export const formatPrice = (price) => {
  price = parseFloat(price); // Đảm bảo price là số
  if (isNaN(price)) {
    return "$0.00";
  }

  if (price >= 1) {
    // Format giá trị lớn hơn hoặc bằng 1 với tối đa 2 chữ số sau dấu phẩy
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (price > 0 && price < 1) {
    // Format giá trị nhỏ hơn 1 với các chữ số sau dấu phẩy tùy thuộc vào kích thước
    const fixedPrice = price.toFixed(8); // Tối đa 8 chữ số để tránh quá nhiều số 0
    const formattedPrice = fixedPrice.replace(/0+$/, ''); // Bỏ các số 0 thừa ở cuối
    return `$${formattedPrice}`;
  } else {
    return "$0.00";
  }
};

export const formatAmount = (amount) => {
  amount = parseFloat(amount); // Đảm bảo amount là số
  if (isNaN(amount)) return "0";

  if (amount >= 1) {
    // Số lớn hơn hoặc bằng 1 sẽ được format với dấu phẩy ngăn cách
    return amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  } else {
    // Số nhỏ hơn 1 sẽ hiển thị tối đa 10 chữ số thập phân
    const formattedAmount = amount.toFixed(10); // Đảm bảo có 10 chữ số
    return formattedAmount.replace(/(\.\d*[1-9])0+$/, "$1"); // Bỏ số 0 thừa ở cuối nhưng giữ lại các chữ số cần thiết
  }
};

// Hàm định dạng số tiền với độ chính xác cao hơn
export const formatCurrency = (value, currency) => {
  if (isNaN(value)) return "";

  // Kiểm tra nếu giá trị nhỏ hơn 1 và không phải là 0
  if (value < 1 && value > 0) {
    // Nếu giá trị nhỏ hơn 1, định dạng với 7 chữ số sau dấu phẩy
    return currency === "USD"
      ? `$${parseFloat(value).toFixed(7)}`
      : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 7,
        maximumFractionDigits: 7,
      }).format(value);
  } else {
    // Nếu giá trị lớn hơn hoặc bằng 1, định dạng với 2 chữ số sau dấu phẩy
    return currency === "USD"
      ? `$${parseFloat(value).toFixed(2)}`
      : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
  }
};