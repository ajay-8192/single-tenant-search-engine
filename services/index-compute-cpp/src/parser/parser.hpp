#pragma once
#include <string>
#include <unordered_map>
#include "../arena/arena.hpp"

struct ProcessedDocumentModel {
    std::string title;
    std::string meta_description;
    std::unordered_map<std::string, int32_t> term_frequencies;
};

class HTMLDocumentSanitizer {
private:
    MemoryArena computational_arena;
    std::string extract_tag_content(const std::string& html, const std::string& open_tag, const std::string& close_tag);
    std::string extract_meta_description(const std::string& html);
    std::string strip_html_boilerplate(const std::string& html);

public:
    HTMLDocumentSanitizer();
    ProcessedDocumentModel parse_html_document(const std::string& raw_html);
};
