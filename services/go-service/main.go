package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"crypto-folio/configs"
	"crypto-folio/routes"

	"github.com/alexedwards/scs/mongodbstore"
	"github.com/alexedwards/scs/v2"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// LoadEnv tải các biến môi trường từ tệp .env
// Nếu không thể tải, hàm sẽ in cảnh báo, nhưng không dừng chương trình
func LoadEnv() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: Could not load .env file") // In cảnh báo nếu không tải được .env
	} else {
		log.Println(".env file loaded successfully") // In thông báo nếu tải thành công
	}
}

var sessionManager *scs.SessionManager

// main thiết lập và khởi chạy server, kết nối đến MongoDB, thiết lập session và router
func main() {
	// Tải các biến môi trường từ .env
	LoadEnv()

	// Kết nối đến MongoDB thông qua hàm ConnectDB
	configs.ConnectDB()

	// Cấu hình tùy chọn client MongoDB với URI
	env := os.Getenv("ENV")
	mongoURI := os.Getenv("MONGO_URI")
	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	// Thiết lập kết nối MongoDB
	clientOptions := options.Client().ApplyURI(mongoURI)
	client, err := mongo.Connect(context.TODO(), clientOptions)
	if err != nil {
		log.Fatal("Failed to connect to MongoDB:", err)
	}

	// Tạo đối tượng *mongo.Database từ client để làm việc với MongoDB
	db := client.Database("crypto-app")

	// Khởi tạo session manager với MongoDB store để lưu trữ session trong MongoDB
	sessionManager = scs.New()
	sessionManager.Store = mongodbstore.New(db) // Lưu trữ session trong MongoDB
	sessionManager.Lifetime = 24 * time.Hour    // Thiết lập thời gian tồn tại của session là 24 giờ

	// Thiết lập router để quản lý các route của ứng dụng
	router := mux.NewRouter()

	// Định nghĩa các route cho xác thực, giao dịch, và danh mục đầu tư
	// Thêm vào router với prefix /go
	goRouter := router.PathPrefix("/go").Subrouter()
	routes.AuthRoutes(goRouter)
	routes.TransactionRoutes(goRouter)
	routes.PortfolioRoutes(goRouter)
	routes.DashboardRoutes(goRouter)

	// Cấu hình CORS dựa trên môi trường
	var allowedOrigins []string
	if env == "development" {
		allowedOrigins = []string{"http://localhost:3000"}
	} else {
		allowedOrigins = []string{"http://frontend:3000"}
	}
	// Cấu hình CORS để kiểm soát quyền truy cập từ frontend
	corsOptions := cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	})

	// Kết hợp router với cấu hình CORS
	handler := corsOptions.Handler(router)

	log.Println("Server is running on port:", port)
	log.Fatal(http.ListenAndServe(":"+port, handler)) // Khởi chạy server trên cổng đã thiết lập
}
