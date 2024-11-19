package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"crypto-folio/configs"
	"crypto-folio/models"
	"crypto-folio/services"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// getUserIDFromSession lấy ID người dùng từ session nếu người dùng đã xác thực
// - userID dưới dạng ObjectID hoặc lỗi nếu không xác thực được
func getUserIDFromSession(r *http.Request) (primitive.ObjectID, error) {
	// Lấy session từ request với session ID "session-id"
	session, err := store.Get(r, "session-id")
	if err != nil {
		return primitive.NilObjectID, fmt.Errorf("failed to get session: %v", err)
	}

	// Lấy userID dưới dạng chuỗi từ session values
	userIDHex, ok := session.Values["userID"].(string)
	if !ok || userIDHex == "" {
		// Trả về lỗi nếu không tìm thấy userID hoặc nếu userID là chuỗi rỗng
		return primitive.NilObjectID, fmt.Errorf("user not authenticated")
	}

	// Chuyển đổi userID từ chuỗi sang kiểu ObjectID
	userID, err := primitive.ObjectIDFromHex(userIDHex)
	if err != nil {
		return primitive.NilObjectID, fmt.Errorf("invalid userID in session: %v", err)
	}

	// Trả về userID dưới dạng ObjectID nếu thành công
	return userID, nil
}

// AddTransaction xử lý thêm giao dịch mới của người dùng và cập nhật danh mục đầu tư
func AddTransaction(w http.ResponseWriter, r *http.Request) {
	var transaction models.Transaction

	// Giải mã và kiểm tra dữ liệu giao dịch từ yêu cầu
	err := json.NewDecoder(r.Body).Decode(&transaction)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Lấy ID người dùng từ session để xác thực
	userID, err := getUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized access", http.StatusUnauthorized)
		return
	}

	// Thiết lập các thông tin metadata cho giao dịch
	transaction.UserID = userID              // Gắn ID người dùng vào giao dịch
	transaction.ID = primitive.NewObjectID() // Tạo ObjectID mới cho giao dịch
	transaction.Date = time.Now()            // Gán thời gian giao dịch hiện tại
	transaction.CreatedAt = time.Now()       // Gán thời gian tạo
	transaction.Status = "completed"         // Đặt trạng thái giao dịch là "completed"

	// Cập nhật danh mục đầu tư của người dùng với giao dịch mới
	err = services.UpdatePortfolio(userID, transaction)
	if customErr, ok := err.(*services.CustomError); ok {
		// Gửi phản hồi lỗi nếu cập nhật danh mục thất bại
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(customErr)
		return
	} else if err != nil {
		// Xử lý lỗi khác nếu cập nhật danh mục thất bại
		http.Error(w, "Error updating portfolio", http.StatusInternalServerError)
		return
	}

	// Nếu danh mục đầu tư được cập nhật thành công, thêm giao dịch vào cơ sở dữ liệu
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	transactionCollection := configs.GetCollection("transactions")
	_, err = transactionCollection.InsertOne(ctx, transaction)
	if err != nil {
		http.Error(w, "Error adding transaction", http.StatusInternalServerError)
		return
	}

	// Trả về phản hồi JSON thành công
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode("Transaction added and portfolio updated successfully")
}

// GetTransactions trả về danh sách giao dịch của người dùng theo thứ tự mới nhất đến cũ nhất
func GetTransactions(w http.ResponseWriter, r *http.Request) {
	// Lấy ID người dùng từ session để xác thực
	userID, err := getUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized access", http.StatusUnauthorized)
		return
	}

	// Tạo collection và context có thời gian chờ cho thao tác với cơ sở dữ liệu
	collection := configs.GetCollection("transactions")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Thiết lập tùy chọn sắp xếp theo thứ tự giảm dần của ngày giao dịch ("date")
	findOptions := options.Find().SetSort(bson.M{"date": -1})

	// Tìm tất cả giao dịch của người dùng trong cơ sở dữ liệu
	var transactions []models.Transaction
	cursor, err := collection.Find(ctx, bson.M{"user_id": userID}, findOptions)
	if err != nil {
		http.Error(w, "Error retrieving transactions", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	// Chuyển tất cả các giao dịch vào slice transactions
	if err := cursor.All(ctx, &transactions); err != nil {
		http.Error(w, "Error processing transactions", http.StatusInternalServerError)
		return
	}

	// Trả về dữ liệu giao dịch dưới dạng JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(transactions)
}

// UpdateTransaction sẽ cập nhật thông tin giao dịch dựa trên ID giao dịch
func UpdateTransaction(w http.ResponseWriter, r *http.Request) {
	// Lấy ID giao dịch từ URL
	vars := mux.Vars(r)
	id := vars["id"]

	// Giải mã dữ liệu từ body của yêu cầu
	var updatedTransaction models.Transaction
	err := json.NewDecoder(r.Body).Decode(&updatedTransaction)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Gọi phương thức cập nhật giao dịch trong model
	err = models.UpdateTransaction(id, &updatedTransaction)
	if err != nil {
		http.Error(w, "Failed to update transaction", http.StatusInternalServerError)
		return
	}
	// Trả về dữ liệu giao dịch dưới dạng JSON
	// Trả về kết quả thành công
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(updatedTransaction)
}
