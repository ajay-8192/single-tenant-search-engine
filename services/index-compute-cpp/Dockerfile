FROM ubuntu:24.04 AS build

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    protobuf-compiler \
    protobuf-compiler-grpc \
    libprotobuf-dev \
    libgrpc++-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY services/index-compute-cpp/ .
COPY shared/proto/ ../shared/proto/

RUN mkdir build && cd build && \
    cmake -DCMAKE_BUILD_TYPE=Release .. && \
    make -j$(nproc)

FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    libprotobuf-dev \
    libgrpc++-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/build/index_compute_server /app/index_compute_server

EXPOSE 50051
CMD ["/app/index_compute_server"]
