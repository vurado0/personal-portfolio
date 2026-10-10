---
title: "Android with Kotlin: Compose, MVVM, coroutines"
category: mobile
tags: [android, kotlin, mvvm, coroutines]
skills: [kotlin]
summary: How a modern Android app is structured — Jetpack Compose UI, a ViewModel holding state, coroutines for background work and navigation between screens — from the todo, recipe and Linto apps I built.
updated: 2026-06-15
difficulty: beginner
---

From *Interactive Mobile Applications* (FH JOANNEUM, summer 2026). The exercises were a scaffold app, a todo app, a recipe app and coroutines. The final project was the Android app for **Linto**, our startup-project idea.

## MVVM in one picture

```
UI (Composables)  ──events──▶  ViewModel  ──▶  Repository / data
       ▲                          │
       └──────── state (StateFlow) ┘
```

- The **UI** only shows state and sends events. It holds no business logic.
- The **ViewModel** survives screen rotation and exposes `StateFlow` / `State`.
- The **repository** hides where the data comes from (memory, database, network).

```kotlin
class TodoViewModel : ViewModel() {
    private val _todos = MutableStateFlow<List<Todo>>(emptyList())
    val todos = _todos.asStateFlow()

    fun add(title: String) = _todos.update { it + Todo(title) }
}
```

## Coroutines

- `viewModelScope.launch { … }` is cancelled automatically when the ViewModel is gone.
- Do slow work on `Dispatchers.IO`, and only update the UI from the main thread.
- `suspend` functions pause without blocking a thread.

## Navigation

A `NavHost` with routes; pass IDs between screens, not whole objects, and load the data again on the target screen.

## Kotlin features I used a lot

Data classes, null safety (`?.`, `?:`), collection lambdas (`filter`, `map`, `groupBy`) and `when` expressions.
