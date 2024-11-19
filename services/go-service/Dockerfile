# services/go-service/Dockerfile

# Sử dụng image Golang để build ứng dụng
FROM golang:1.23-alpine AS backend

# Set working directory
WORKDIR /app

# Copy các tệp cấu hình và mã nguồn Go vào container
COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . .

# Build ứng dụng Go
RUN go build -o main .

# Sử dụng image nhỏ gọn để chạy ứng dụng
FROM alpine:latest
WORKDIR /root/

# Copy file thực thi từ giai đoạn build
COPY --from=backend /app/main .
COPY --from=backend /app/.env .

# Expose port 5000
EXPOSE 5000

# Khởi động ứng dụng
CMD ["./main"]
