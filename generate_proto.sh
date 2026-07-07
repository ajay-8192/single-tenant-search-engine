#!/bin/sh
set -e

echo "Installing protobuf compiler and Go plugins..."
apk add --no-cache protobuf

go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.5.1

export PATH=$PATH:$(go env GOPATH)/bin

echo "Compiling Protobuf contract..."
protoc --go_out=. --go-grpc_out=. -I shared/proto shared/proto/search_engine.proto

echo "Protobuf compilation successful."
