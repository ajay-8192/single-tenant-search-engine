#pragma once
#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <new>
#include <mutex>

class MemoryArena {
private:
    uint8_t* memory_pool;
    size_t total_capacity;
    size_t current_offset;
    std::mutex allocation_mutex;

public:
    explicit MemoryArena(size_t bytes_to_reserve) 
        : total_capacity(bytes_to_reserve), current_offset(0) {
        memory_pool = new uint8_t[bytes_to_reserve];
    }

    ~MemoryArena() {
        delete[] memory_pool;
    }

    void* allocate(size_t allocation_size, size_t alignment = alignof(std::max_align_t)) {
        std::lock_guard<std::mutex> lock(allocation_mutex);
        
        size_t current_address = reinterpret_cast<size_t>(memory_pool + current_offset);
        size_t alignment_mask = alignment - 1;
        size_t aligned_address = (current_address + alignment_mask) & ~alignment_mask;
        size_t true_needed_bytes = (aligned_address - current_address) + allocation_size;

        if (current_offset + true_needed_bytes > total_capacity) {
            throw std::bad_alloc(); // Guard memory limit (e.g. 10MB) to block overflow attacks
        }

        current_offset += true_needed_bytes;
        return reinterpret_cast<void*>(aligned_address);
    }

    void reset_pool() {
        std::lock_guard<std::mutex> lock(allocation_mutex);
        current_offset = 0; // O(1) reclamation
    }

    // Disable copy/assignment operations
    MemoryArena(const MemoryArena&) = delete;
    MemoryArena& operator=(const MemoryArena&) = delete;
};
