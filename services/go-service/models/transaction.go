package models

import (
	"context"
	"crypto-folio/configs"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"gopkg.in/mgo.v2/bson"
)

type Transaction struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	UserID          primitive.ObjectID `bson:"user_id" json:"user_id"`
	Coin            string             `bson:"coin" json:"coin"`
	TransactionType string             `bson:"transaction_type" json:"transaction_type"`
	Amount          float64            `bson:"amount" json:"amount"`
	Price           float64            `bson:"price" json:"price"`
	Value           float64            `bson:"value" json:"value"`
	Date            time.Time          `bson:"date" json:"date"`
	CreatedAt       time.Time          `bson:"created_at" json:"created_at"`
	Status          string             `bson:"status" json:"status"`
}

// UpdateTransaction cập nhật thông tin giao dịch theo ID
func UpdateTransaction(id string, updatedTransaction *Transaction) error {
	// Chuyển đổi ID từ chuỗi thành ObjectID
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return errors.New("invalid transaction ID")
	}

	// Thiết lập context với thời gian chờ
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Truy cập vào collection
	collection := configs.DB.Database("crypto-app").Collection("transactions")

	// Tạo filter và cập nhật cho MongoDB
	filter := bson.M{"_id": objectID}
	update := bson.M{
		"$set": bson.M{
			"user_id":          updatedTransaction.UserID,
			"coin":             updatedTransaction.Coin,
			"transaction_type": updatedTransaction.TransactionType,
			"amount":           updatedTransaction.Amount,
			"price":            updatedTransaction.Price,
			"value":            updatedTransaction.Value,
			"date":             updatedTransaction.Date,
			"status":           updatedTransaction.Status,
			"created_at":       updatedTransaction.CreatedAt,
		},
	}

	// Thực hiện cập nhật trong MongoDB
	_, err = collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return errors.New("could not update transaction")
	}
	return nil
}
