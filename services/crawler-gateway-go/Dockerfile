FROM golang:1.23-alpine AS build

WORKDIR /app

COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /gateway cmd/main.go

FROM alpine:latest
WORKDIR /app
COPY --from=build /gateway /app/gateway

EXPOSE 8080
CMD ["/app/gateway"]
