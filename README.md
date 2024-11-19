
# Crypto Portfolio Management

Crypto Portfolio Management là một ứng dụng web giúp người dùng quản lý danh mục đầu tư tiền điện tử, với cấu trúc microservices linh hoạt kết hợp giữa Go và Node.js, cùng với frontend React và MongoDB. Dự án được triển khai và quản lý dễ dàng với Docker và Nginx làm reverse proxy.

## Mục lục
1. [Tổng quan dự án](#tong-quan-du-an)
2. [Các tính năng](#cac-tinh-nang)
3. [Công nghệ sử dụng](#cong-nghe-su-dung)
4. [Thiết lập môi trường](#thiet-lap-moi-truong)
5. [Cấu trúc dự án](#cau-truc-du-an)
6. [Chạy dự án](#chay-du-an)
7. [Triển khai](#trien-khai)

---

## Tổng quan dự án
Dự án Công Uẩn AI Crypto Portfolio Management cung cấp các API mạnh mẽ để quản lý danh mục đầu tư, giao dịch tiền điện tử và tích hợp dữ liệu thị trường. Sử dụng kiến trúc microservices giúp phân tách nhiệm vụ, tối ưu hóa hiệu suất và khả năng mở rộng.

## Các tính năng
1. **Xác thực người dùng**: Đăng ký, đăng nhập và quản lý phiên.
2. **Quản lý danh mục**: Theo dõi nhiều tài sản, xem giá trị hiện tại.
3. **Dữ liệu thị trường**: Xem dữ liệu thị trường theo thời gian thực.
4. **Lịch sử giao dịch**: Ghi và xem lại các giao dịch.
5. **Trực quan hóa dữ liệu**: Biểu đồ tương tác để theo dõi danh mục.

## Công nghệ sử dụng
- **Frontend**: React.js, TailwindCSS
- **Backend**: Go (Golang), Node.js với Express
- **Database**: MongoDB
- **Công cụ khác**: Docker, Nginx

## Thiết lập môi trường

### Điều kiện tiên quyết
- **Docker**: Đảm bảo Docker và Docker Compose đã cài đặt.
- **Node.js** (dành cho frontend và Node.js service)
- **Go** (dành cho Go service)

### Cấu hình dự án
Sử dụng các lệnh sau để tạo cấu trúc dự án:

```bash
# Tạo thư mục chính cho dự án
mkdir -p crypto-portfolio-management
cd crypto-portfolio-management

# Tạo thư mục và file cho frontend
mkdir -p frontend/public frontend/src
touch frontend/.env.development frontend/Dockerfile frontend/package.json

# Tạo cấu trúc thư mục và file cho Go service
mkdir -p services/go-service/{configs,controllers,models,routes,utils}
touch services/go-service/main.go services/go-service/.env services/go-service/Dockerfile

# Tạo cấu trúc thư mục và file cho Node.js service
mkdir -p services/node-service/{controllers,models,routes}
touch services/node-service/index.js services/node-service/.env services/node-service/Dockerfile

# Tạo thư mục và file cho cấu hình MongoDB
mkdir -p database
touch database/init-mongo.js

# Tạo thư mục và file cấu hình Nginx
mkdir -p nginx
touch nginx/nginx.conf

# Tạo file docker-compose và README cho dự án
touch docker-compose.yml README.md
```

## Cấu trúc dự án
```
crypto-portfolio-management/
├── frontend/                    
├── services/
│   ├── go-service/             
│   └── node-service/           
├── database/                   
├── nginx/                      
├── docker-compose.yml          
└── README.md                   
```

## Chạy dự án

### Sử dụng Docker
1. **Build và khởi động dịch vụ**:
   ```bash
   docker-compose up --build
   ```
2. **Truy cập ứng dụng**:
   - Frontend: [http://localhost:3001](http://localhost:3001)
   - Go API: [http://localhost:5001](http://localhost:5001)
   - Node API: [http://localhost:5002](http://localhost:5002)

### Phát triển (không dùng Docker)
1. **Go Service**:
   ```bash
   cd services/go-service
   go run main.go
   ```
2. **Node Service**:
   ```bash
   cd services/node-service
   npm install
   node index.js
   ```
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Triển khai

1. **Docker Compose**: Tạo các image Docker cho từng service và chạy tất cả trong Docker Compose.
2. **Nginx Reverse Proxy**: Định tuyến các yêu cầu tới frontend và các dịch vụ backend.

---

Dự án của bạn giờ đã sẵn sàng để mở rộng và triển khai. Chúc bạn thành công!
