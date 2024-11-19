package controllers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"crypto-folio/configs"
	"crypto-folio/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// Lấy danh sách watchlist của người dùng
func GetWatchlist(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized access", http.StatusUnauthorized)
		return
	}

	// Tạo context với thời gian chờ để tránh treo kết nối
	collection := configs.GetCollection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user models.User
	err = collection.FindOne(ctx, bson.M{"_id": userID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(user.Watchlist) // Trả về watchlist dưới dạng JSON
}

// Cập nhật danh sách watchlist của người dùng
func UpdateWatchlist(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized access", http.StatusUnauthorized)
		return
	}

	var updateData struct {
		CoinSymbol string `json:"coin_symbol"`
		Action     string `json:"action"` // "add" hoặc "remove"
	}
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Lấy collection người dùng từ cấu hình và tạo context với thời gian chờ
	collection := configs.GetCollection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"_id": userID}
	var update bson.M

	// Xử lý hành động thêm hoặc gỡ bỏ coin khỏi watchlist
	if updateData.Action == "add" {
		update = bson.M{"$addToSet": bson.M{"watchlist": updateData.CoinSymbol}}
	} else if updateData.Action == "remove" {
		update = bson.M{"$pull": bson.M{"watchlist": updateData.CoinSymbol}}
	} else {
		http.Error(w, "Invalid action", http.StatusBadRequest)
		return
	}

	_, err = collection.UpdateOne(ctx, filter, update)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode("Watchlist updated successfully")
}
