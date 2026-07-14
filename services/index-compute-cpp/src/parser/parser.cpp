#include "parser.hpp"
#include <algorithm>
#include <cctype>

HTMLDocumentSanitizer::HTMLDocumentSanitizer() 
    : computational_arena(1024 * 1024 * 10) {} // 10MB thread-safe compute workspace

ProcessedDocumentModel HTMLDocumentSanitizer::parse_html_document(const std::string& raw_html) {
    computational_arena.reset_pool(); // Reset the arena allocator block for this document
    ProcessedDocumentModel result;
    
    result.title = extract_tag_content(raw_html, "<title>", "</title>");
    result.meta_description = extract_meta_description(raw_html);

    std::string cleaned_text = strip_html_boilerplate(raw_html);

    std::string current_token = "";
    for (char character : cleaned_text) {
        if (std::isalnum(static_cast<unsigned char>(character))) {
            current_token += std::tolower(static_cast<unsigned char>(character));
        } else {
            if (!current_token.empty()) {
                if (current_token.length() > 2) {
                    result.term_frequencies[current_token]++;
                }
                current_token = "";
            }
        }
    }
    if (!current_token.empty() && current_token.length() > 2) {
        result.term_frequencies[current_token]++;
    }

    return result;
}

std::string HTMLDocumentSanitizer::extract_tag_content(const std::string& html, const std::string& open_tag, const std::string& close_tag) {
    size_t start_pos = html.find(open_tag);
    if (start_pos == std::string::npos) return "Untitled Page Document";
    start_pos += open_tag.length();
    size_t end_pos = html.find(close_tag, start_pos);
    if (end_pos == std::string::npos) return "Untitled Page Document";
    return html.substr(start_pos, end_pos - start_pos);
}

std::string HTMLDocumentSanitizer::extract_meta_description(const std::string& html) {
    // Find <meta name="description" or <meta name="Description"
    std::string search_html = html;
    std::transform(search_html.begin(), search_html.end(), search_html.begin(), ::tolower);
    
    size_t lookup = search_html.find("name=\"description\"");
    if (lookup == std::string::npos) {
        lookup = search_html.find("name='description'");
    }
    if (lookup == std::string::npos) return "No description block provided.";

    size_t content_start = search_html.find("content=\"", lookup);
    if (content_start == std::string::npos) {
        content_start = search_html.find("content='", lookup);
    }
    if (content_start == std::string::npos) return "No description block provided.";
    
    content_start += 9; // length of 'content="' or 'content=''
    
    size_t content_end = html.find(html[content_start - 1], content_start);
    if (content_end == std::string::npos) return "No description block provided.";
    
    return html.substr(content_start, content_end - content_start);
}

std::string HTMLDocumentSanitizer::strip_html_boilerplate(const std::string& html) {
    // Allocate space in the arena for processing to avoid fragmentation
    size_t len = html.length();
    char* buffer = static_cast<char*>(computational_arena.allocate(len + 1));
    
    size_t write_idx = 0;
    bool in_tag = false;
    bool in_script = false;
    bool in_style = false;
    
    for (size_t i = 0; i < len; ++i) {
        // Lowercase check for scripts and styles to strip them out
        if (i + 7 < len && (html.compare(i, 8, "<script>") == 0 || html.compare(i, 8, "<SCRIPT>") == 0)) {
            in_script = true;
            if (write_idx > 0 && buffer[write_idx - 1] != ' ') {
                buffer[write_idx++] = ' ';
            }
            i += 7;
            continue;
        }
        if (i + 8 < len && (html.compare(i, 9, "</script>") == 0 || html.compare(i, 9, "</SCRIPT>") == 0)) {
            in_script = false;
            if (write_idx > 0 && buffer[write_idx - 1] != ' ') {
                buffer[write_idx++] = ' ';
            }
            i += 8;
            continue;
        }
        if (i + 6 < len && (html.compare(i, 7, "<style>") == 0 || html.compare(i, 7, "<STYLE>") == 0)) {
            in_style = true;
            if (write_idx > 0 && buffer[write_idx - 1] != ' ') {
                buffer[write_idx++] = ' ';
            }
            i += 6;
            continue;
        }
        if (i + 7 < len && (html.compare(i, 8, "</style>") == 0 || html.compare(i, 8, "</STYLE>") == 0)) {
            in_style = false;
            if (write_idx > 0 && buffer[write_idx - 1] != ' ') {
                buffer[write_idx++] = ' ';
            }
            i += 7;
            continue;
        }
        
        if (in_script || in_style) {
            continue;
        }
        
        if (html[i] == '<') {
            in_tag = true;
            if (write_idx > 0 && buffer[write_idx - 1] != ' ') {
                buffer[write_idx++] = ' ';
            }
            continue;
        }
        if (html[i] == '>') {
            in_tag = false;
            if (write_idx > 0 && buffer[write_idx - 1] != ' ') {
                buffer[write_idx++] = ' ';
            }
            continue;
        }
        
        if (!in_tag) {
            // Keep content, replace spacing characters with space
            if (std::isspace(static_cast<unsigned char>(html[i]))) {
                if (write_idx > 0 && buffer[write_idx - 1] != ' ') {
                    buffer[write_idx++] = ' ';
                }
            } else {
                buffer[write_idx++] = html[i];
            }
        }
    }
    buffer[write_idx] = '\0';
    return std::string(buffer, write_idx);
}
