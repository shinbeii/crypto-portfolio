package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Portfolio struct {
	ID           primitive.ObjectID     `bson:"_id,omitempty" json:"_id,omitempty"`
	UserID       primitive.ObjectID     `bson:"user_id" json:"user_id"`
	CoinHoldings map[string]CoinHolding `bson:"coin_holdings" json:"coin_holdings"` // Chứa các thông tin về coin đang giữ
}

type CoinHolding struct {
	Quantity    float64 `bson:"quantity" json:"quantity"`
	AvgBuyPrice float64 `bson:"avg_buy_price" json:"avg_buy_price"`
}
