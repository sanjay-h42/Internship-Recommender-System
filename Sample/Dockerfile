# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Accept the RapidAPI key as a build-time argument so Vite can embed it
ARG VITE_RAPIDAPI_KEY
ENV VITE_RAPIDAPI_KEY=$VITE_RAPIDAPI_KEY

RUN npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Use our custom Nginx config (handles SPA routing + API proxy to backend services)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
