package controllers

import (
	"context"
	"crypto-folio/configs"
	"crypto-folio/models"
	"crypto-folio/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/sessions"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Khởi tạo store session với khóa bí mật cho cookie-based session
// Lưu ý: Khuyến nghị nên lấy khóa từ biến môi trường để bảo mật
var store = sessions.NewCookieStore([]byte("super-secret-key"))

// Hàm Login xử lý đăng nhập và tạo session cho người dùng
func Login(w http.ResponseWriter, r *http.Request) {
	// Phân tích nội dung JSON từ yêu cầu thành đối tượng user
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Lấy collection người dùng từ cấu hình và tạo context có thời gian chờ
	collection := configs.GetCollection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Tìm người dùng trong cơ sở dữ liệu bằng email
	var foundUser models.User
	err := collection.FindOne(ctx, bson.M{"email": user.Email}).Decode(&foundUser)
	if err != nil || !utils.CheckPasswordHash(user.Password, foundUser.Password) {
		http.Error(w, "Incorrect login information", http.StatusUnauthorized)
		return
	}

	// Tạo session cho người dùng đã xác thực

	session, _ := store.Get(r, "session-id")
	session.Values["userID"] = foundUser.ID.Hex() // Lưu ID người dùng vào session
	session.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   86400 * 7, // Session hết hạn sau 24 giờ
		HttpOnly: true,      // Ngăn JavaScript truy cập cookie session
		Secure:   false,     // Bật chế độ bảo mật HTTPS trong môi trường sản xuất
	}
	session.Save(r, w) // Lưu session để gửi về cho client

	// Trả về phản hồi thành công
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{"status": 200, "message": "Login successful"})
}

// Register function xử lý thêm người dùng mới và tạo session
func Register(w http.ResponseWriter, r *http.Request) {
	// Phân tích nội dung JSON từ yêu cầu thành đối tượng user
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Lấy collection người dùng từ cấu hình và tạo context với thời gian chờ
	collection := configs.GetCollection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Kiểm tra xem email đã tồn tại trong hệ thống chưa
	var existingUser models.User
	err := collection.FindOne(ctx, bson.M{"email": user.Email}).Decode(&existingUser)
	if err == nil {
		http.Error(w, "User already exists", http.StatusConflict)
		return
	}

	// Mã hóa mật khẩu người dùng và thiết lập thông tin người dùng mới
	hashedPassword, _ := utils.HashPassword(user.Password)
	user.Password = hashedPassword
	user.ID = primitive.NewObjectID() // Tạo ObjectID mới cho _id
	user.CreatedAt = time.Now()       // Thiết lập thời gian tạo
	user.UpdatedAt = time.Now()       // Thiết lập thời gian cập nhật

	// Tạo session mới cho người dùng đã đăng ký
	session, _ := store.Get(r, "session-id")
	session.Values["userID"] = user.ID.Hex()
	session.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   86400, // Session hợp lệ trong 1 tuần
		HttpOnly: true,
		Secure:   false, // Bật Secure khi triển khai trong môi trường sản xuất (HTTPS)
	}
	err = session.Save(r, w)
	if err != nil {
		fmt.Printf("Error saving session during registration: %v\n", err)
		http.Error(w, "Error saving session", http.StatusInternalServerError)
		return
	}
	fmt.Printf("Debug - Session saved with userID: %v\n", session.Values["userID"])

	// Thêm người dùng mới vào cơ sở dữ liệu
	_, err = collection.InsertOne(ctx, user)
	if err != nil {
		http.Error(w, "Error registering user", http.StatusInternalServerError)
		return
	}

	// Trả về phản hồi thành công sau khi đăng ký
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  201,
		"message": "Registration successful",
	})
}

// / VerifySession kiểm tra xem session có hợp lệ không
func VerifySession(w http.ResponseWriter, r *http.Request) {
	// Lấy session từ yêu cầu HTTP bằng session-id
	session, _ := store.Get(r, "session-id")

	// Kiểm tra xem userID có tồn tại trong session không
	if session.Values["userID"] != nil {
		// Trả về trạng thái OK nếu session hợp lệ
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  200,
			"message": "Session is valid",
		})
	} else {
		// Trả về trạng thái Unauthorized nếu session không hợp lệ
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  401,
			"message": "Session is invalid",
		})
	}
}

// Logout function để xóa session hiện tại của người dùng
func Logout(w http.ResponseWriter, r *http.Request) {
	// Lấy session từ yêu cầu HTTP bằng session-id
	session, _ := store.Get(r, "session-id")

	// Đặt giá trị session về nil để xóa hoàn toàn các dữ liệu lưu trữ trong session
	session.Values = nil
	session.Options.MaxAge = -1 // Đặt thời gian hết hạn của session thành -1 để hủy session

	// Lưu session đã xóa vào phản hồi HTTP để cập nhật trên client
	err := session.Save(r, w)
	if err != nil {
		fmt.Printf("Error clearing session: %v\n", err)
		http.Error(w, "Error clearing session", http.StatusInternalServerError)
		return
	}

	// Phản hồi thành công khi logout hoàn tất
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  200,
		"message": "Logout successful",
	})
}
