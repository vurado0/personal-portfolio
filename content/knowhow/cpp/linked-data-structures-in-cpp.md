---
title: "Hand-made stacks, queues and lists in C++"
category: cpp
tags: [cpp, data-structures, memory]
skills: [cpp]
summary: Building linked data structures without the STL for an image-processing assignment — node design, destructors that free everything, keeping a stack intact while reading it, and a padding bug in BMP files.
updated: 2026-10-06
difficulty: intermediate
---

From *Data Structures* (Universidad de Alcalá, fall 2026). Lab assignment 1: load a BMP image, put every pixel into hand-written structures (stack, queue, row lists), process it and write it back out, all without `std::vector` or `std::list`.

## Design

Six small classes: `Pixel` (one node: red, green, blue and a `next` pointer), `StackDS`, `QueueDS`, `RowListDS`, `ImageListDS` and `Core`. `main` only creates `Core` and calls `run()`.

```cpp
void StackDS::push(const Pixel& p) {
    Pixel* n = new Pixel(p);
    n->next = top_;
    top_ = n;
    ++size_;
}

StackDS::~StackDS() {           // free every node: no leaks
    while (!isEmpty()) pop();
}
```

## Things worth remembering

- **Rule of three.** If a class owns raw pointers, write the destructor, and either write or delete the copy constructor and copy assignment. Otherwise two objects free the same nodes.
- **Reading a stack without destroying it.** Pop everything into a helper stack, use the values, then push them back. The original keeps its size and its top.
- **Pixel order matters.** A stack gives you the pixels reversed (LIFO); a queue keeps the file order (FIFO).
- **BMP row padding.** Each row is padded to a multiple of 4 bytes. The teacher's library computed the padding *before* reading the width, which broke images whose width isn't a multiple of 4. I found and fixed it by comparing the output pixel by pixel.

## Verification

- The round trip (`image → stack → image_test.bmp`) is identical to the original, pixel by pixel.
- 0 memory leaks (checked with leaks/valgrind) and 0 warnings with `-Wall -Wextra`.
