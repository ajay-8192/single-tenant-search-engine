#include <iostream>
#include <memory>
#include <string>
#include <grpcpp/grpcpp.h>

#include "search_engine.grpc.pb.h"
#include "parser/parser.hpp"

class HTMLProcessorImpl final : public search_engine::HTMLProcessor::Service {
private:
    HTMLDocumentSanitizer sanitizer;

public:
    grpc::Status ExtractAndTokenize(
        grpc::ServerContext* context, 
        const search_engine::ProcessDocumentRequest* request, 
        search_engine::ProcessDocumentResponse* response
    ) override {
        try {
            ProcessedDocumentModel doc = sanitizer.parse_html_document(request->raw_html_content());
            response->set_success(true);
            response->set_page_title(doc.title);
            response->set_meta_description(doc.meta_description);
            
            auto* tokens = response->mutable_token_frequencies();
            for (const auto& pair : doc.term_frequencies) {
                (*tokens)[pair.first] = pair.second;
            }
        } catch (const std::exception& e) {
            response->set_success(false);
            response->set_error_log(e.what());
        }
        return grpc::Status::OK;
    }
};

void RunServer() {
    // Bind to 0.0.0.0:50051 by default. On Unix/Docker systems, gRPC can also bind to unix sockets.
    std::string server_address("0.0.0.0:50051");
    HTMLProcessorImpl service;

    grpc::ServerBuilder builder;
    builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
    builder.RegisterService(&service);
    std::unique_ptr<grpc::Server> server(builder.BuildAndStart());
    std::cout << "C++ index-compute server listening on: " << server_address << std::endl;
    server->Wait();
}

int main(int argc, char** argv) {
    RunServer();
    return 0;
}
