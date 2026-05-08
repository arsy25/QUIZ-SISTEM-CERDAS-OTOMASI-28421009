/**
 * ============================================================
 * RabbitMQ Consumer Worker
 * IF-6403 Sistem Cerdas dan Otomasi
 *
 * Tugas:
 * 1. Connect ke RabbitMQ (queue: camera.matlab)
 * 2. Baca payload berupa nama file gambar
 * 3. Simpan ke MongoDB (image_name + image_url + created_at)
 * ============================================================
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const amqp = require('amqplib');
const mongoose = require('mongoose');

const rabbitmqConfig = require('../src/config/rabbitmq');
const connectDB = require('../src/config/database');
const CameraImage = require('../src/models/CameraImage');

const IMAGE_BASE_URL =
  process.env.IMAGE_BASE_URL || 'https://smartparking.pptik.id/data/data';

// ─── Reconnect state ───────────────────────────────────────────────────────────
let connection = null;
let channel = null;
let isShuttingDown = false;

// ─── Connect to RabbitMQ ───────────────────────────────────────────────────────
const connectRabbitMQ = async () => {
  try {
    console.log(`🐰 Connecting to RabbitMQ at ${rabbitmqConfig.host}...`);
    connection = await amqp.connect(rabbitmqConfig.url);

    connection.on('error', (err) => {
      console.error('❌ RabbitMQ connection error:', err.message);
      if (!isShuttingDown) scheduleReconnect();
    });

    connection.on('close', () => {
      console.warn('⚠️  RabbitMQ connection closed.');
      if (!isShuttingDown) scheduleReconnect();
    });

    channel = await connection.createChannel();

    // Ensure the queue exists and is durable
    await channel.assertQueue(rabbitmqConfig.queue, { durable: true });

    // Process one message at a time
    channel.prefetch(1);

    console.log(`✅ RabbitMQ connected. Listening on queue: ${rabbitmqConfig.queue}`);
    console.log('⏳ Waiting for messages...\n');

    channel.consume(rabbitmqConfig.queue, handleMessage, { noAck: false });
  } catch (error) {
    console.error('❌ Failed to connect to RabbitMQ:', error.message);
    if (!isShuttingDown) scheduleReconnect();
  }
};

// ─── Handle each incoming message ─────────────────────────────────────────────
const handleMessage = async (msg) => {
  if (!msg) return;

  const raw = msg.content.toString().trim();
  console.log(`📨 Message received: ${raw}`);

  try {
    // Payload = nama file gambar, e.g.: CAM-P016-NcynZFYPh.jpg
    const image_name = raw;
    const image_url = `${IMAGE_BASE_URL}/${image_name}`;

    // Check for duplicate (idempotent insert)
    const existing = await CameraImage.findOne({ image_name });
    if (existing) {
      console.log(`⚠️  Duplicate skipped: ${image_name}`);
      channel.ack(msg);
      return;
    }

    // Save to MongoDB
    const saved = await CameraImage.create({
      image_name,
      image_url,
      created_at: new Date(),
    });

    console.log(`💾 Saved to DB → _id: ${saved._id} | ${image_name}`);

    // Acknowledge the message only after successful save
    channel.ack(msg);
  } catch (error) {
    console.error('❌ Error processing message:', error.message);

    // Negative-acknowledge and requeue so we don't lose the message
    channel.nack(msg, false, true);
  }
};

// ─── Auto-reconnect ────────────────────────────────────────────────────────────
const scheduleReconnect = () => {
  const delay = rabbitmqConfig.options.reconnectDelay || 5000;
  console.log(`🔄 Reconnecting in ${delay / 1000}s...`);
  setTimeout(connectRabbitMQ, delay);
};

// ─── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  isShuttingDown = true;
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    await mongoose.disconnect();
    console.log('✅ Cleaned up. Bye!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err.message);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// ─── Boot ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   RabbitMQ Consumer Worker                   ║');
  console.log('║   IF-6403 Sistem Cerdas dan Otomasi          ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  await connectDB();
  await connectRabbitMQ();
})();
