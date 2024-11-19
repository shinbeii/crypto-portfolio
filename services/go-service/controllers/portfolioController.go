package controllers

import (
	"context"
	"crypto-folio/configs"
	"crypto-folio/models"
	"crypto-folio/services"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
)

// GetPortfolio lấy thông tin danh mục đầu tư của người dùng dựa trên ID từ session và tính toán lời/lỗ
func GetPortfolio(w http.ResponseWriter, r *http.Request) {
	// Lấy userID từ session để xác thực người dùng
	userID, err := getUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized access", http.StatusUnauthorized)
		return
	}

	// Thiết lập collection MongoDB và context có thời gian chờ để truy vấn
	portfolioCollection := configs.GetCollection("portfolios")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Tìm danh mục đầu tư của người dùng trong cơ sở dữ liệu
	var portfolio models.Portfolio
	err = portfolioCollection.FindOne(ctx, bson.M{"user_id": userID}).Decode(&portfolio)
	if err != nil {
		http.Error(w, "Portfolio not found", http.StatusNotFound)
		return
	}
	// Lấy giá real-time cho mỗi loại coin từ Binance API và xử lý lỗi trong quá trình gọi API
	prices := make(map[string]float64)
	for symbol := range portfolio.CoinHoldings {
		response, err := http.Get(fmt.Sprintf("https://api.binance.com/api/v3/ticker/price?symbol=%sUSDT", symbol))
		if err != nil {
			http.Error(w, "Failed to get price from Binance", http.StatusInternalServerError)
			return
		}
		defer response.Body.Close()

		// Đọc dữ liệu từ phản hồi API và kiểm tra lỗi
		body, err := io.ReadAll(response.Body)
		if err != nil {
			http.Error(w, "Failed to read response body", http.StatusInternalServerError)
			return
		}

		// Giải mã JSON từ phản hồi để lấy giá
		var priceData map[string]interface{}
		if err := json.Unmarshal(body, &priceData); err != nil {
			http.Error(w, "Failed to unmarshal response", http.StatusInternalServerError)
			return
		}

		// Lấy giá dưới dạng chuỗi và chuyển đổi sang float64
		price, ok := priceData["price"].(string)
		if !ok {
			http.Error(w, "Invalid price format from Binance", http.StatusInternalServerError)
			return
		}

		var realTimePrice float64
		if _, err := fmt.Sscanf(price, "%f", &realTimePrice); err != nil {
			http.Error(w, "Failed to parse price", http.StatusInternalServerError)
			return
		}

		// Lưu giá vào map để sử dụng cho các tính toán tiếp theo
		prices[symbol] = realTimePrice
	}

	// Tạo dữ liệu chi tiết về danh mục đầu tư bao gồm số lượng, giá trung bình, giá trị hiện tại và lời/lỗ
	portfolioData := []map[string]interface{}{}
	for symbol, holding := range portfolio.CoinHoldings {
		currentPrice, ok := prices[symbol]
		if !ok {
			http.Error(w, "Price not found for symbol", http.StatusInternalServerError)
			return
		}

		// Tính toán giá trị hiện tại và lời/lỗ dựa trên giá trung bình mua và giá hiện tại
		currentValue := currentPrice * holding.Quantity
		profitLoss := (currentPrice - holding.AvgBuyPrice) * holding.Quantity
		profitLossPercent := 0.0
		if holding.AvgBuyPrice > 0 {
			profitLossPercent = ((currentPrice - holding.AvgBuyPrice) / holding.AvgBuyPrice) * 100
		}

		portfolioData = append(portfolioData, map[string]interface{}{
			"symbol":            symbol,
			"quantity":          holding.Quantity,
			"avgBuyPrice":       holding.AvgBuyPrice,
			"currentValue":      currentValue,
			"profitLoss":        profitLoss,
			"profitLossPercent": profitLossPercent,
			"isProfit":          profitLoss >= 0,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(portfolioData)
}

// GetPortfolioData trả về thông tin danh mục đầu tư của người dùng
func GetPortfolioData(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized access", http.StatusUnauthorized)
		return
	}

	portfolio, err := services.GetUserPortfolio(userID)
	if err != nil {
		http.Error(w, "Error fetching portfolio", http.StatusInternalServerError)
		return
	}

	// Lấy tỷ giá USD sang JPY từ API
	conversionRateUSDToJPY, err := services.GetUSDToJPYRate()
	if err != nil {
		http.Error(w, "Error fetching USD to JPY conversion rate", http.StatusInternalServerError)
		return
	}

	var portfolioData []map[string]interface{}
	for coinSymbol, holding := range portfolio.CoinHoldings {
		currentPriceUSD, currentPriceJPY, err := services.GetCurrentPrice(coinSymbol)
		if err != nil {
			http.Error(w, "Error fetching coin prices", http.StatusInternalServerError)
			return
		}

		// Kiểm tra số lượng nắm giữ là dương trước khi tính toán
		if holding.Quantity <= 0 {
			continue
		}
		// Lấy lịch sử giá mua (priceHistory) cho coin từ một dịch vụ
		priceHistory, err := services.GetPriceHistory(userID, coinSymbol)
		if err != nil {
			http.Error(w, "Error fetching price history", http.StatusInternalServerError)
			return
		}
		currentValueUSD := holding.Quantity * currentPriceUSD
		currentValueJPY := holding.Quantity * currentPriceJPY
		profitLossUSD := currentValueUSD - (holding.Quantity * holding.AvgBuyPrice)
		profitLossJPY := currentValueJPY - (holding.Quantity * holding.AvgBuyPrice * conversionRateUSDToJPY)

		data := map[string]interface{}{
			"symbol":          coinSymbol,
			"quantity":        holding.Quantity,
			"avgBuyPrice":     holding.AvgBuyPrice,
			"currentValueUSD": currentValueUSD,
			"currentValueJPY": currentValueJPY,
			"profitLossUSD":   profitLossUSD,
			"profitLossJPY":   profitLossJPY,
			"isProfit":        profitLossUSD >= 0,
			"priceHistory":    priceHistory,
		}
		portfolioData = append(portfolioData, data)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(portfolioData)
}
