// Adapted from the course starter: same routes, database, and sample todos.
const express = require('express');
const { MongoClient } = require('mongodb');
const { trace, metrics } = require('@opentelemetry/api');
const app = express();
const meter = metrics.getMeter('todo-app');
const requests = meter.createCounter('todo.requests', { description: 'Completed todo HTTP requests' });
const duration = meter.createHistogram('todo.request.duration', { unit: 'ms', description: 'Todo request duration' });
app.use((req, res, next) => {
  const start = performance.now();
  const context = trace.getActiveSpan()?.spanContext();
  res.on('finish', () => {
    const elapsed = performance.now() - start;
    const attributes = { route: req.route?.path || 'unmatched', status: res.statusCode };
    requests.add(1, attributes);
    duration.record(elapsed, attributes);
    console.log(JSON.stringify({ event: 'request_completed', method: req.method, route: attributes.route,
      status: res.statusCode, duration_ms: Number(elapsed.toFixed(3)), trace_id: context?.traceId, span_id: context?.spanId }));
  });
  next();
});
let db;
app.get('/todo', async (req, res) => {
  const todos = await db.collection('todos').find({}).toArray();
  res.send(todos);
});
app.get('/todo/:id', async (req, res) => {
  const todo = await db.collection('todos').findOne({ id: req.params.id });
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.send(todo);
});
const client = new MongoClient('mongodb://127.0.0.1:27017/');
async function startServer() {
  await client.connect();
  db = client.db('todo');
  // Upserts avoid duplicate sample data across restarts.
  for (const todo of [
    { id: '1', title: 'Buy groceries' },
    { id: '2', title: 'Install Aspecto' },
    { id: '3', title: 'buy my own name domain' },
  ]) await db.collection('todos').updateOne({ id: todo.id }, { $set: todo }, { upsert: true });
  const server = app.listen(3000, '127.0.0.1', () => console.log('Listening on http://localhost:3000'));
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
    server.close(async () => { await client.close(); await require('./tracing').shutdown(); process.exit(0); });
  });
}
startServer().catch(error => { console.error(error); process.exitCode = 1; });
