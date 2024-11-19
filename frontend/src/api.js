// api.js
import axios from "axios";

// Định nghĩa hai base URLs trực tiếp từ biến môi trường
const goServiceBaseURL = process.env.REACT_APP_GO_API_BASE_URL;
const nodeServiceBaseURL = process.env.REACT_APP_NODE_API_BASE_URL;

const goServiceClient = axios.create({
  baseURL: goServiceBaseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

const nodeServiceClient = axios.create({
  baseURL: nodeServiceBaseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Hàm retry
async function retryRequest(request, retries = 3, delay = 1000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await request();
      return response; // Thành công, trả về phản hồi
    } catch (error) {
      if (attempt < retries - 1) {
        console.warn(`Retrying... Attempt ${attempt + 1}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error; // Sau số lần thử tối đa, báo lỗi
      }
    }
  }
}

export default {
  // Các hàm sử dụng Go service
  loginUser(credentials) {
    return retryRequest(() => goServiceClient.post("/login", credentials));
  },
  registerUser(userInfo) {
    return retryRequest(() => goServiceClient.post("/register", userInfo));
  },
  verifySession() {
    return retryRequest(() => goServiceClient.get("/verify-session"));
  },
  logout() {
    return retryRequest(() => goServiceClient.post("/logout"));
  },
  addTransaction(transactionData) {
    return retryRequest(() => goServiceClient.post("/add-transaction", transactionData));
  },
  getTransactions() {
    return retryRequest(() => goServiceClient.get("/transactions"));
  },
  getPortfolio() {
    return retryRequest(() => goServiceClient.get("/portfolio"));
  },
  getPortfolioData() {
    return retryRequest(() => goServiceClient.get("/dashboard"));
  },
  updateTransaction(transactionData) {
    return retryRequest(() => goServiceClient.put(`/update-transaction/${transactionData.id}`, transactionData));
  },
  getWatchlist() {
    return retryRequest(() => goServiceClient.get("/watchlist"));
  },
  updateWatchlist(coinSymbol, action) {
    return retryRequest(() => goServiceClient.post("/watchlist", { coin_symbol: coinSymbol, action }));
  },


  // Các hàm sử dụng Node.js service
  addXxxxxx(xxxxxx) {
    return retryRequest(() => nodeServiceClient.post("/xxxxx", xxxxxx));
  },
};
