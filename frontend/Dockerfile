# Stage 1: build Vite
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# URL del backend la tomará del Ingress en producción
ARG VITE_API_DESPACHOS_URL=/api/despachos
ARG VITE_API_VENTAS_URL=/api/ventas
RUN npm run build

# Stage 2: Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80