# Stage 1: Build the static assets
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve using Nginx in production
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
# Configure Nginx to listen on port 3000 instead of 80 to match configuration
RUN sed -i 's/listen       80;/listen       3000;/g' /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
