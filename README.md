# A9 Observability

Express and MongoDB todo app with OpenTelemetry tracing in Jaeger.
Adapted from the course starter files.

## Run

With Node.js and Docker running:

```sh
npm ci
docker run -d --name a9-mongo -p 127.0.0.1:27017:27017 mongo:7
docker run -d --name a9-jaeger -p 127.0.0.1:16686:16686 -p 127.0.0.1:4318:4318 jaegertracing/jaeger:2.5.0
npm start
```

In another terminal:

```sh
curl http://localhost:3000/todo
```

Open http://localhost:16686, select `todo-service`, and click **Find Traces**.
The trace shows the HTTP request and MongoDB query.
Request counts, durations, and JSON logs appear in the terminal.

For the console tracing step, stop the app and use `npm run start:console`.
