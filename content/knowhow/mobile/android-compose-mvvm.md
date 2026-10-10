---
title: "Android with Kotlin: Compose, MVVM, coroutines"
category: mobile
tags: [android, kotlin, mvvm, coroutines, room]
skills: [kotlin]
summary: "How a modern Android app is structured — Jetpack Compose UI, a ViewModel holding state, coroutines, Room + Retrofit for offline-first data and navigation — from the todo, recipe and Linto apps I built."
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

## Offline-first: Room + Retrofit

In the **Linto demo app** (Japanese vocabulary) the data comes from a web service, but the app also works offline:

- **Retrofit** loads the vocabulary as JSON (kotlinx.serialization DTOs).
- **Room** (entity, DAO, database) stores it locally, and the UI only observes the database as a `Flow`.
- The repository fetches from the network, writes to Room, and if the network fails, the cached data is still shown.

## Navigation

A `NavHost` with routes; pass IDs between screens, not whole objects, and load the data again on the target screen.

## Kotlin features I used a lot

Data classes, null safety (`?.`, `?:`), collection lambdas (`filter`, `map`, `groupBy`) and `when` expressions.
