# Build React app
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install --force
COPY . .
RUN npm run build

# Serve bằng nginx
FROM nginx:stable-alpine

# Copy file cấu hình nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build từ React
COPY --from=builder /app/dist /usr/share/nginx/html

# Tạo thư mục chứa env file
RUN mkdir /usr/share/nginx/html/env

# Script để ghi biến môi trường vào file JS
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
RUN apk add --no-cache dos2unix && dos2unix /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
