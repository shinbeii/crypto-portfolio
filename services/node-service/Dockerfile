# services/node-service/Dockerfile

# Sử dụng Node.js để build và chạy ứng dụng
FROM node:14

# Set working directory
WORKDIR /app

# Copy package.json và package-lock.json để cài đặt phụ thuộc
COPY package*.json ./

# Cài đặt các phụ thuộc
RUN npm install

# Copy toàn bộ mã nguồn vào container
COPY . .

# Expose port 5002
EXPOSE 5002

# Khởi động ứng dụng
# CMD ["node", "index.js"]
CMD ["tail", "-f", "/dev/null"]

