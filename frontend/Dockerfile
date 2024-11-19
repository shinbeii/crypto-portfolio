# Bắt đầu từ image Node.js
FROM node:16

# Cài đặt thư mục làm việc
WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Sao chép toàn bộ mã nguồn vào trong container
COPY . .

# Biên dịch ứng dụng React thành mã tĩnh
RUN npm run build

# Cài đặt serve để chạy ứng dụng
RUN npm install -g serve

# Lệnh chạy khi container khởi động
CMD ["serve", "-s", "build", "-l", "3000"]
