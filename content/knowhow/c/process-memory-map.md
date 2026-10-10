---
title: "The memory map of a C process"
category: c
tags: [c, memory, linux, operating-systems]
skills: [c, linux]
summary: Where globals, constants, locals and malloc blocks really live — .text, .rodata, .data, .bss, heap and stack — and how to check it yourself with objdump, readelf and nm.
updated: 2026-10-08
difficulty: intermediate
---

From Lab 1 of *Advanced Operating Systems* (Universidad de Alcalá, fall 2026, Erasmus). We printed the addresses of variables in a C program and checked them against the ELF file.

## The regions

| Region | What lives there | Initial value |
|---|---|---|
| `.text` | machine code (functions) | read-only |
| `.rodata` | string literals, `const` data | from the file, read-only |
| `.data` | **initialised** globals and `static`s | value stored in the file |
| `.bss` | **uninitialised** globals and `static`s | zero (the loader zero-fills; takes no space in the file) |
| heap | `malloc` blocks, grows up | undefined until you write |
| stack | locals, parameters, return addresses; grows down | garbage |
| shared libraries | `printf`, `malloc` from libc | mapped at load time |

Low addresses hold code and globals, then the heap, then shared libraries; the stack sits at the very top.

## Check it yourself

```bash
gcc -g -o prog prog.c
objdump -h prog        # section headers: sizes and addresses of .text, .data, .bss
readelf -s prog        # symbol table: which variable ended up in which section
nm prog                # short version: T = text, D = data, B = bss, R = rodata
objdump -d prog        # disassembly
```

## Classic exam traps

- `char *s = "hi";` → the pointer is on the stack, the text is in `.rodata`. Writing to it crashes.
- `static int n;` inside a function lives in `.bss`, not on the stack, and keeps its value between calls.
- A local array that isn't initialised contains garbage; a global one is zero.
- Returning the address of a local variable is a bug: the stack frame is gone after the return.
