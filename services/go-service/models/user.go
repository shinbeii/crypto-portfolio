package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	Email       string             `bson:"email" json:"email"`
	Password    string             `bson:"password" json:"password"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
	PortfolioID primitive.ObjectID `bson:"portfolio_id,omitempty" json:"portfolio_id,omitempty"`
	Watchlist   []string           `bson:"watchlist,omitempty" json:"watchlist,omitempty"`
}
