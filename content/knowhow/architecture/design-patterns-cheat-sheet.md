---
title: Design patterns I implemented (Java)
category: architecture
tags: [design-patterns, java, oop]
skills: [java]
summary: Factory, State, Command, Visitor, Composite, Adapter and Facade — one line on the problem each one solves and how I used it in the course tasks.
updated: 2026-06-01
difficulty: intermediate
---

From *Design Patterns* (FH JOANNEUM, summer 2026). Four tasks with Maven projects, two patterns each.

| Pattern | Problem it solves | In one sentence |
|---|---|---|
| **Factory method / Abstract factory** | Code shouldn't depend on concrete classes | A method or factory object decides which class to create |
| **State** | Big `switch` on a status field | Each state is a class; the object delegates to its current state |
| **Command** | Undo/redo, queues of actions | An action becomes an object with `execute()` (and `undo()`) |
| **Composite** | Trees of parts and groups | Leaves and groups share one interface, so clients treat them the same |
| **Visitor** | New operations on a fixed class hierarchy | The operation lives in a visitor; elements call `accept(visitor)` |
| **Adapter** | Two interfaces don't fit | A wrapper translates one interface into the other |
| **Facade** | A subsystem is too complex to use | One simple class in front of many |

## Rules of thumb

- Use a pattern when the problem shows up, not "just in case".
- **State vs. Strategy**: both swap behaviour, but a State switches itself, while a Strategy is chosen from outside.
- **Composite + Visitor** work well together: the composite builds the tree, and the visitors compute things on it (sums, printing, export).
