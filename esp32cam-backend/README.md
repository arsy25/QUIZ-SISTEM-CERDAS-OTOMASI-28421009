# ESP32-CAM Backend — IF-6403 Sistem Cerdas dan Otomasi

Backend sistem integrasi kamera ESP32-CAM menggunakan **Express.js**, **MongoDB**, dan **RabbitMQ Consumer (Node.js)**.

---

## 📁 Struktur Proyek

```
esp32cam-backend/
├── src/
│   ├── config/
│   │   ├── database.js       # Konfigurasi koneksi MongoDB
│   │   └── rabbitmq.js       # Konfigurasi RabbitMQ
│   ├── controllers/
│   │   └── cameraController.js  # Logic untuk setiap endpoint
│   ├── middleware/
│   │   └── errorHandler.js   # Error handling global
│   ├── models/
│   │   └── CameraImage.js    # Mongoose model (skema database)
│   ├── routes/
│   │   └── cameraRoutes.js   # Definisi route API
│   └── index.js              # Entry point Express server
├── worker/
│   └── consumer.js           # RabbitMQ Consumer Worker
├── .env                      # Environment variables (jangan di-commit)
├── .env.example              # Contoh environment variables
└── package.json
```

---

## ⚙️ Konfigurasi Environment

Salin `.env.example` menjadi `.env`, lalu sesuaikan nilainya:

```bash
cp .env.example .env
```

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/esp32cam_db

RABBITMQ_HOST=rabbit-mq.sta.my.id
RABBITMQ_USER=smartparking
RABBITMQ_PASSWORD=mSmrtp4rk!n9
RABBITMQ_VHOST=/smartparking
RABBITMQ_QUEUE=camera.matlab

IMAGE_BASE_URL=https://smartparking.pptik.id/data/data
```

---

## 🚀 Cara Menjalankan

### 1. Install Dependencies

```bash
npm install
```

### 2. Jalankan Express API Server

```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

Server akan berjalan di `http://localhost:3000`.

### 3. Jalankan RabbitMQ Consumer Worker

Jalankan di terminal terpisah:

```bash
# Production
npm run worker

# Development (auto-reload)
npm run worker:dev
```

---

## 📡 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/` | Health check |
| GET | `/api/cameras` | Ambil semua gambar (paginasi) |
| GET | `/api/cameras/latest` | Ambil gambar terbaru |
| GET | `/api/cameras/stats` | Statistik total gambar & kamera |
| GET | `/api/cameras/:id` | Ambil gambar berdasarkan ID |
| DELETE | `/api/cameras/:id` | Hapus gambar berdasarkan ID |

### Query Parameters — `GET /api/cameras`

| Parameter | Default | Contoh | Keterangan |
|-----------|---------|--------|------------|
| `page` | `1` | `?page=2` | Halaman ke-n |
| `limit` | `10` | `?limit=20` | Jumlah item per halaman |
| `guid` | - | `?guid=CAM-P016` | Filter berdasarkan GUID kamera |

### Contoh Response — `GET /api/cameras`

```json
{
  "success": true,
  "data": [
    {
      "_id": "665f...",
      "image_name": "CAM-P016-NcynZFYPh.jpg",
      "image_url": "https://smartparking.pptik.id/data/data/CAM-P016-NcynZFYPh.jpg",
      "created_at": "2025-05-07T15:41:39.000Z",
      "guid": "CAM-P016"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "total_pages": 5
  }
}
```

---

## 🗄️ Skema Database (MongoDB)

Collection: `cameraimages`

| Field | Type | Keterangan |
|-------|------|-----------|
| `_id` | ObjectId | Primary Key (auto) |
| `image_name` | String | Nama file gambar dari RabbitMQ |
| `image_url` | String | URL lengkap gambar |
| `created_at` | Date | Waktu data diterima dari queue |

---

## 🐰 Alur Kerja Consumer

```
RabbitMQ Queue (camera.matlab)
        │
        ▼
  Consumer Worker
  (worker/consumer.js)
        │
        ├── Parse payload (image filename)
        ├── Build image_url
        ├── Cek duplikasi di MongoDB
        └── Simpan ke MongoDB → ACK message
```

Consumer otomatis **reconnect** jika koneksi RabbitMQ terputus.
