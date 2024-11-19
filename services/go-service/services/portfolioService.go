package services

import (
	"context"
	"crypto-folio/configs"
	"crypto-folio/models"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Hàm phụ để tính toán giá mua trung bình mới
func calculateAveragePrice(currentQuantity, currentPrice, additionalQuantity, additionalPrice float64) float64 {
	totalCost := currentQuantity*currentPrice + additionalQuantity*additionalPrice
	newQuantity := currentQuantity + additionalQuantity
	return totalCost / newQuantity
}

// CustomError định nghĩa lỗi có mã lỗi và thông báo
type CustomError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func (e *CustomError) Error() string {
	return e.Message
}

// UpdatePortfolio cập nhật danh mục đầu tư của người dùng dựa trên giao dịch mới
func UpdatePortfolio(userID primitive.ObjectID, transaction models.Transaction) error {
	// Tạo collection của portfolio và context với thời gian chờ
	portfolioCollection := configs.GetCollection("portfolios")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Tìm hoặc tạo danh mục đầu tư của người dùng
	var portfolio models.Portfolio
	err := portfolioCollection.FindOne(ctx, bson.M{"user_id": userID}).Decode(&portfolio)
	if err != nil {
		portfolio = models.Portfolio{
			ID:           primitive.NewObjectID(),
			UserID:       userID,
			CoinHoldings: make(map[string]models.CoinHolding),
		}
	}

	// Lấy dữ liệu coin hiện tại từ danh mục đầu tư (nếu có)
	holding, exists := portfolio.CoinHoldings[transaction.Coin]

	// Xử lý giao dịch mua
	if transaction.TransactionType == "buy" {
		if exists {
			// Tính toán giá trung bình mới nếu đã có coin
			holding.AvgBuyPrice = calculateAveragePrice(holding.Quantity, holding.AvgBuyPrice, transaction.Amount, transaction.Price)
			holding.Quantity += transaction.Amount
		} else {
			// Thêm coin mới vào danh mục nếu chưa có
			holding = models.CoinHolding{
				Quantity:    transaction.Amount,
				AvgBuyPrice: transaction.Price,
			}
		}
		portfolio.CoinHoldings[transaction.Coin] = holding

	} else if transaction.TransactionType == "sell" {
		if !exists {
			return &CustomError{Code: "COIN_NOT_IN_PORTFOLIO", Message: "This coin is not in your portfolio."}
		}
		if holding.Quantity < transaction.Amount {
			return &CustomError{Code: "SELL_AMOUNT_EXCEEDS_HOLDING", Message: "The sell amount exceeds your current holding."}
		}
		holding.Quantity -= transaction.Amount
		if holding.Quantity <= 0 {
			delete(portfolio.CoinHoldings, transaction.Coin)
		} else {
			portfolio.CoinHoldings[transaction.Coin] = holding
		}
	}

	// Cập nhật hoặc thêm mới danh mục đầu tư với tùy chọn Upsert
	filter := bson.M{"user_id": userID}
	update := bson.M{"$set": bson.M{"coin_holdings": portfolio.CoinHoldings, "user_id": userID}}
	_, err = portfolioCollection.UpdateOne(ctx, filter, update, options.Update().SetUpsert(true))
	if err != nil {
		return fmt.Errorf("error updating portfolio: %v", err)
	}

	return nil
}

// GetUserPortfolio lấy danh mục đầu tư của người dùng từ cơ sở dữ liệu
func GetUserPortfolio(userID primitive.ObjectID) (*models.Portfolio, error) {
	// Kết nối tới collection portfolios
	portfolioCollection := configs.GetCollection("portfolios")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Tìm danh mục đầu tư của người dùng với userID tương ứng
	var portfolio models.Portfolio
	err := portfolioCollection.FindOne(ctx, bson.M{"user_id": userID}).Decode(&portfolio)
	if err != nil {
		return nil, err
	}

	// Trả về danh mục đầu tư của người dùng
	return &portfolio, nil
}

// BinancePrice là cấu trúc để parse kết quả từ Binance API
type BinancePrice struct {
	Symbol string `json:"symbol"`
	Price  string `json:"price"`
}

// getCurrentPrice lấy giá hiện tại của coin từ Binance API
func GetCurrentPrice(symbol string) (float64, float64, error) {
	// Lấy giá USD từ Binance API
	urlUSD := fmt.Sprintf("https://api.binance.com/api/v3/ticker/price?symbol=%sUSDT", symbol)
	resp, err := http.Get(urlUSD)
	if err != nil {
		return 0, 0, err
	}
	defer resp.Body.Close()

	var priceUSD BinancePrice
	if err := json.NewDecoder(resp.Body).Decode(&priceUSD); err != nil {
		return 0, 0, err
	}

	// Chuyển đổi chuỗi giá trị USD thành float
	priceUSDValue, err := strconv.ParseFloat(priceUSD.Price, 64)
	if err != nil {
		return 0, 0, err
	}

	// Lấy giá JPY từ Binance API (nếu có)
	urlJPY := fmt.Sprintf("https://api.binance.com/api/v3/ticker/price?symbol=%sJPY", symbol)
	resp, err = http.Get(urlJPY)
	if err != nil {
		// Nếu không lấy được giá JPY trực tiếp, sử dụng tỷ giá USD/JPY
		usdToJpyRate, rateErr := GetUSDToJPYRate()
		if rateErr != nil {
			return priceUSDValue, 0, nil // Trả về giá USD và bỏ qua JPY nếu không thể lấy tỷ giá
		}
		return priceUSDValue, priceUSDValue * usdToJpyRate, nil // Tính giá JPY từ USD nếu không có JPY trực tiếp
	}
	defer resp.Body.Close()

	var priceJPY BinancePrice
	if err := json.NewDecoder(resp.Body).Decode(&priceJPY); err != nil {
		// Nếu lỗi khi decode JPY, sử dụng tỷ giá USD/JPY
		usdToJpyRate, rateErr := GetUSDToJPYRate()
		if rateErr != nil {
			return priceUSDValue, 0, nil
		}
		return priceUSDValue, priceUSDValue * usdToJpyRate, nil
	}

	// Chuyển đổi chuỗi giá trị JPY thành float
	priceJPYValue, err := strconv.ParseFloat(priceJPY.Price, 64)
	if err != nil {
		// Nếu không thể chuyển đổi giá trị JPY thành số, sử dụng tỷ giá USD/JPY
		usdToJpyRate, rateErr := GetUSDToJPYRate()
		if rateErr != nil {
			return priceUSDValue, 0, nil
		}
		return priceUSDValue, priceUSDValue * usdToJpyRate, nil
	}

	return priceUSDValue, priceJPYValue, nil
}

// GetUSDToJPYRate lấy tỷ giá USD sang JPY từ API
func GetUSDToJPYRate() (float64, error) {
	resp, err := http.Get("https://api.exchangerate-api.com/v4/latest/USD")
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	var data map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return 0, err
	}

	rates, ok := data["rates"].(map[string]interface{})
	if !ok {
		return 0, errors.New("error parsing rates data")
	}

	jpyRate, ok := rates["JPY"].(float64)
	if !ok {
		return 0, errors.New("JPY rate not found")
	}

	return jpyRate, nil
}

// GetPriceHistory lấy lịch sử giá mua cho một coin cụ thể của người dùng chỉ cho các tháng có giao dịch mua
func GetPriceHistory(userID primitive.ObjectID, coinSymbol string) ([]float64, error) {
	// Kết nối đến collection transactions
	transactionCollection := configs.GetCollection("transactions")

	// Tạo bộ lọc truy vấn các giao dịch mua của người dùng và coin cụ thể
	filter := bson.M{
		"user_id":          userID,
		"coin":             coinSymbol,
		"transaction_type": "buy",       // Lọc các giao dịch là mua
		"status":           "completed", // Lấy các giao dịch đã hoàn thành
	}

	// Sắp xếp các giao dịch theo thời gian để tính toán giá theo thứ tự
	opts := options.Find().SetSort(bson.D{{Key: "date", Value: 1}})

	// Thực hiện truy vấn
	cursor, err := transactionCollection.Find(context.Background(), filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	// Khởi tạo mảng priceHistory với giá trị 0 cho mỗi tháng
	priceHistory := make([]float64, 12)

	// Tạo bản đồ lưu tổng giá và số lượng cho từng tháng có giao dịch mua
	monthlyTotals := make(map[int]struct {
		totalPrice  float64
		totalAmount float64
	})

	// Duyệt qua các giao dịch và tổng hợp giá theo từng tháng có giao dịch mua
	var transactions []models.Transaction
	if err = cursor.All(context.Background(), &transactions); err != nil {
		return nil, err
	}

	for _, transaction := range transactions {
		month := int(transaction.Date.Month()) - 1 // Lấy tháng, trừ đi 1 để phù hợp với chỉ mục mảng (0-11)
		entry := monthlyTotals[month]
		entry.totalPrice += transaction.Price * transaction.Amount
		entry.totalAmount += transaction.Amount
		monthlyTotals[month] = entry
	}

	// Tính giá trung bình cho mỗi tháng có giao dịch và lưu vào mảng priceHistory
	for month, entry := range monthlyTotals {
		if entry.totalAmount > 0 {
			priceHistory[month] = entry.totalPrice / entry.totalAmount
		}
	}

	return priceHistory, nil
}
