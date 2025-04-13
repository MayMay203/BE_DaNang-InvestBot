# Sử dụng Node.js phiên bản 22 làm base image
FROM node:22

# Kiểm tra nếu Yarn chưa cài, thì mới cài
RUN command -v yarn || npm install -g yarn

# Đặt thư mục làm việc trong container là /app
WORKDIR /app

# Copy các file package.json và yarn.lock vào container
COPY package*.json yarn.lock ./

# Cài đặt các dependencies bằng Yarn
RUN yarn install

# Copy toàn bộ mã nguồn của dự án vào trong container
COPY . .

# Build ứng dụng (Chạy yarn build cho NestJS)
RUN yarn build

# Mở port 3001 cho container
EXPOSE 3001

# Lệnh chạy ứng dụng khi container bắt đầu (Sử dụng yarn start:dev)
CMD ["yarn", "start:dev"]
