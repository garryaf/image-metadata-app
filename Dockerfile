# Gunakan image node untuk build
FROM node:18 AS build

# Set workdir
WORKDIR /app

# Copy package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy semua source code
COPY . .

# Build aplikasi React (output ke /app/build)
RUN npm run build

# Gunakan image nginx untuk serve build React
FROM nginx:alpine

# Copy build hasil dari tahap build ke folder nginx
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
