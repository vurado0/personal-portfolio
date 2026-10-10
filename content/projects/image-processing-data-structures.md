---
title: Image processing with hand-made data structures
summary: University assignment in C++ — load BMP images and process every pixel through self-written stacks, queues and linked row lists, without the STL and without memory leaks.
stack: [C++17, CodeLite, Make]
skills: [cpp]
tags: [university, data-structures]
role: Student (Data Structures, Universidad de Alcalá)
status: in progress
period: 2026
links:
  github: https://github.com/vurado0/DS-LabAssignment1
---

## Task

Lab assignment 1 of *Data Structures* (Universidad de Alcalá, fall 2026). Read a BMP image, store its pixels in **linked data structures I wrote myself**, transform the image in several stages and write the results back as BMP files.

## What's done

- Six small classes: `Pixel`, `StackDS`, `QueueDS`, `RowListDS`, `ImageListDS` and `Core`.
- **Stage 1**: ask for an image (and ask again if it can't be loaded), then push every pixel onto the stack.
- **Stage 2**: write the image back from the stack. A helper stack restores the original, so size and top are unchanged.
- I found and fixed a **row-padding bug** in the provided BMP library: images whose width isn't a multiple of 4 came out broken.

## Quality

- The round trip is identical to the original, pixel by pixel (tested from 12 to 640 000 pixels).
- 0 memory leaks and 0 warnings with `-Wall -Wextra`.

The repository is private while the course is running. The ideas are written up in the [know-how article](/knowhow/cpp/linked-data-structures-in-cpp).
