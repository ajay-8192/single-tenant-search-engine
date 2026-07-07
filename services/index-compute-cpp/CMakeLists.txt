cmake_minimum_required(VERSION 3.15)
project(index-compute-cpp CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find Protobuf and gRPC libraries
find_package(Protobuf REQUIRED)
find_package(gRPC CONFIG REQUIRED)

# Paths for Proto definition
set(PROTO_SRC_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../shared/proto")
set(PROTO_FILE "${PROTO_SRC_DIR}/search_engine.proto")

# Generated Files
set(GEN_PROTO_SRC "${CMAKE_CURRENT_BINARY_DIR}/search_engine.pb.cc")
set(GEN_PROTO_HDR "${CMAKE_CURRENT_BINARY_DIR}/search_engine.pb.h")
set(GEN_GRPC_SRC "${CMAKE_CURRENT_BINARY_DIR}/search_engine.grpc.pb.cc")
set(GEN_GRPC_HDR "${CMAKE_CURRENT_BINARY_DIR}/search_engine.grpc.pb.h")

add_custom_command(
    OUTPUT "${GEN_PROTO_SRC}" "${GEN_PROTO_HDR}" "${GEN_GRPC_SRC}" "${GEN_GRPC_HDR}"
    COMMAND protobuf::protoc
    ARGS --cpp_out="${CMAKE_CURRENT_BINARY_DIR}"
         --grpc_out="${CMAKE_CURRENT_BINARY_DIR}"
         --plugin=protoc-gen-grpc=$<TARGET_FILE:gRPC::grpc_cpp_plugin>
         -I "${PROTO_SRC_DIR}"
         "${PROTO_FILE}"
    DEPENDS "${PROTO_FILE}"
)

# Executable Targets
add_executable(index_compute_server
    src/main.cpp
    src/parser/parser.cpp
    src/parser/parser.hpp
    src/arena/arena.hpp
    "${GEN_PROTO_SRC}"
    "${GEN_GRPC_SRC}"
)

target_include_directories(index_compute_server PRIVATE
    "${CMAKE_CURRENT_BINARY_DIR}"
    "${CMAKE_CURRENT_SOURCE_DIR}/src"
)

target_link_libraries(index_compute_server PRIVATE
    gRPC::grpc++
    protobuf::libprotobuf
)
