package configs

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var DB *mongo.Client

// ConnectDB thiết lập kết nối đến MongoDB và xác thực kết nối thành công
func ConnectDB() {
	// Tải các biến môi trường từ tệp .env
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file") // Báo lỗi nếu không thể tải tệp .env
	}

	// Lấy URI của MongoDB từ biến môi trường
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		log.Fatal("MONGO_URI not found in environment variables") // Báo lỗi nếu không tìm thấy MONGO_URI
	}

	// Cấu hình tùy chọn cho MongoDB client với URI và cho phép RetryWrites
	clientOptions := options.Client().ApplyURI(mongoURI).SetRetryWrites(true)

	// Thiết lập context với thời gian chờ 10 giây để kết nối đến MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Kết nối đến MongoDB với clientOptions đã cấu hình
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal("Failed to connect to MongoDB:", err) // Báo lỗi nếu kết nối thất bại
	}

	// Xác thực kết nối bằng cách gửi một lệnh ping đến MongoDB
	if err := client.Ping(ctx, nil); err != nil {
		log.Fatal("MongoDB connection ping failed:", err) // Báo lỗi nếu lệnh ping thất bại
	}

	// Lưu client đã kết nối vào biến toàn cục DB
	DB = client
	log.Println("Connected to MongoDB successfully") // Log thông báo kết nối thành công
}

// GetCollection trả về một collection cụ thể từ database "crypto-app"
func GetCollection(collectionName string) *mongo.Collection {
	// Kiểm tra xem kết nối đến MongoDB đã được thiết lập chưa
	if DB == nil {
		log.Fatal("Database connection is not established") // Báo lỗi nếu chưa có kết nối
	}
	// Truy xuất và trả về collection từ database "crypto-app"
	return DB.Database("crypto-app").Collection(collectionName)
}
