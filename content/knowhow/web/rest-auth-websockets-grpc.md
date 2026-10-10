---
title: "Web services: REST, auth, WebSockets, gRPC and GraphQL"
category: web
tags: [rest, jwt, websockets, grpc, graphql, nodejs]
skills: [typescript, security, networking]
summary: "The ways I built services in Web Service Development — REST with Basic Auth, bcrypt and JWT, real-time WebSockets, typed gRPC contracts and client-driven GraphQL — and when to use which."
updated: 2026-06-03
difficulty: intermediate
---

From *Web Service Development* (FH JOANNEUM, summer 2026). The final project was **GameTracker**, a Node.js/Express API with a React frontend that pushes achievements to all clients in real time.

## REST basics

- Resources are nouns (`/games/42/sessions`); the HTTP method says what happens.
- Use the right status codes: `201` created, `400` bad input, `401` not logged in, `403` not allowed, `404` not found.
- Validate every request body (I used **Joi**) and document the API (**Swagger** generated from JSDoc).

## Authentication, step by step

1. **Basic Auth.** Username and password are sent with every request. Simple, but only safe over HTTPS.
2. **Hash the passwords with bcrypt.** Never store plain text. bcrypt is slow on purpose and adds a salt.
3. **JWT.** After login, the server signs a token (`sub`, `role`, `exp`). The client sends `Authorization: Bearer <token>`, so the server needs no session store.

```js
const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
```

Without a token, `/me` returns `401`. With a user token on an admin route, it returns `403`.

## WebSockets

HTTP is request/response; a WebSocket stays open, so the server can **push**. In GameTracker, every `achievement-unlocked` event is broadcast to all connected clients. Authenticate the socket too: send the JWT when connecting and reject unknown clients.

## gRPC

The contract is a `.proto` file; client and server stubs are generated from it, even in different languages. gRPC runs over HTTP/2 with binary Protobuf, so it's fast and strictly typed. That makes it good between services, but less handy for browsers.

gRPC has four call types: unary (one request, one reply), server streaming, client streaming and bidirectional streaming.

## GraphQL

One endpoint (`POST /graphql`), and the **client** decides which fields it gets. A phone asks for little, an admin dashboard for everything, and nobody over-fetches.

```graphql
query { game(id: 42) { title sessions { score } } }
mutation { addSession(gameId: 42, minutes: 30) { id } }
```

**Queries** read and **mutations** write. The schema is the contract. Watch out for expensive nested queries and caching, which is harder than with REST URLs.

## When to use which

| Need | Choose |
|---|---|
| Public API, browsers, caching | REST |
| Many clients that need different fields | GraphQL |
| Live updates, chat, dashboards | WebSockets |
| Fast typed calls between services | gRPC |
