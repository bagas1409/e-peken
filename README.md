# 📕 DOKUMENTASI API + PANDUAN POSTMAN

## Marketplace UMKM Multi-Vendor

---

# 🧭 KONVENSI UMUM (WAJIB DIBACA)

## Base URL

```
http://localhost:4000
```

## Authorization

Semua endpoint protected pakai:

```
Authorization: Bearer <JWT_TOKEN>
```

Di **Postman**:

- Tab **Authorization**
- Type: `Bearer Token`
- Token: paste JWT

---

# 0️⃣ PERSIAPAN POSTMAN (WAJIB)

### Buat Environment

Nama: `Marketplace Local`

Variable:

| Key         | Value                                          |
| ----------- | ---------------------------------------------- |
| base_url    | [http://localhost:4000](http://localhost:4000) |
| token_user  | (kosong dulu)                                  |
| token_umkm  | (kosong dulu)                                  |
| token_admin | (kosong dulu)                                  |

👉 Supaya tinggal pakai:

```
{{base_url}}/auth/login
```

---

# 🔐 AUTH FLOW (USER / UMKM / ADMIN)

---

## 1️⃣ REGISTER USER / UMKM / ADMIN

### Endpoint

**POST** `{{base_url}}/auth/register`

### Postman Tab

- **Method**: POST
- **Body** → raw → JSON

### Body Contoh USER

```json
{
  "name": "User Test",
  "email": "user@test.com",
  "password": "123456",
  "role": "USER"
}
```

### Body Contoh UMKM

```json
{
  "name": "UMKM Test",
  "email": "umkm@test.com",
  "password": "123456",
  "role": "UMKM"
}
```

### Body Contoh ADMIN

```json
{
  "name": "Admin Test",
  "email": "admin@test.com",
  "password": "123456",
  "role": "ADMIN"
}
```

### Expected Response

```json
{
  "message": "Register berhasil"
}
```

---

## 2️⃣ LOGIN (DAPAT TOKEN)

### Endpoint

**POST** `{{base_url}}/auth/login`

### Body

```json
{
  "email": "user@test.com",
  "password": "123456"
}
```

### Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 🔥 SIMPAN TOKEN KE ENV (POSTMAN)

Di tab **Tests**:

```js
pm.environment.set("token_user", pm.response.json().token);
```

Untuk UMKM / ADMIN ganti:

- `token_umkm`
- `token_admin`

---

## 3️⃣ GET PROFILE (CEK TOKEN)

### Endpoint

**GET** `{{base_url}}/me`

### Authorization

- Bearer Token → `{{token_user}}`

### Response

```json
{
  "id": 1,
  "email": "user@test.com",
  "roles": ["USER"]
}
```

---

# 🏪 FLOW UMKM (ONBOARDING)

---

## 4️⃣ BUAT PROFIL UMKM (WAJIB SEBELUM JUALAN)

### Endpoint

**POST** `{{base_url}}/umkm/profile`

### Authorization

Bearer Token → `{{token_umkm}}`

### Body

```json
{
  "storeName": "Toko Bagas",
  "slug": "toko-bagas",
  "description": "UMKM lokal",
  "address": "Bandung",
  "openTime": "08:00",
  "closeTime": "17:00"
}
```

### Response

```json
{
  "message": "Profil UMKM berhasil dibuat, menunggu verifikasi admin"
}
```

📌 **STATUS = PENDING**
❌ Belum bisa upload produk

---

# 🛡️ FLOW ADMIN (APPROVE UMKM)

---

## 5️⃣ ADMIN LIHAT UMKM PENDING

### Endpoint

**GET** `{{base_url}}/admin/umkm/pending`

### Authorization

Bearer Token → `{{token_admin}}`

### Response

```json
[
  {
    "id": 1,
    "storeName": "Toko Bagas",
    "status": "PENDING"
  }
]
```

---

## 6️⃣ ADMIN APPROVE UMKM

### Endpoint

**PATCH** `{{base_url}}/admin/umkm/1/approve`

### Authorization

Bearer Token → `{{token_admin}}`

### Response

```json
{
  "message": "UMKM berhasil di-approve"
}
```

📌 Setelah ini:

- UMKM = ACTIVE
- Wallet dibuat otomatis
- Bisa upload produk

---

# 🖼️ UPLOAD (SUPABASE STORAGE)

---

## 7️⃣ UPLOAD LOGO UMKM

### Endpoint

**POST** `{{base_url}}/upload/umkm/logo`

### Authorization

Bearer Token → `{{token_umkm}}`

### Body

- **form-data**
  | Key | Type | Value |
  |---|---|---|
  | image | File | pilih gambar |

### Response

```json
{
  "logoUrl": "https://supabase-url"
}
```

---

## 8️⃣ UPLOAD BANNER UMKM

SAMA seperti logo, endpoint:

```
POST /upload/umkm/banner
```

---

## 9️⃣ UPLOAD GAMBAR PRODUK

### Endpoint

**POST** `{{base_url}}/upload/product-image`

### Authorization

Bearer Token → `{{token_umkm}}`

### Body

- form-data
  | image | File |

### Response

```json
{
  "imageUrl": "https://supabase-url"
}
```

⚠️ **CATAT URL INI**, dipakai saat create product

---

# 📦 PRODUK (UMKM)

---

## 🔟 CREATE PRODUCT

### Endpoint

**POST** `{{base_url}}/products`

### Authorization

Bearer Token → `{{token_umkm}}`

### Body

```json
{
  "name": "Keripik Pisang",
  "description": "Manis & renyah",
  "price": 15000,
  "stock": 20,
  "categoryId": 1,
  "imageUrl": "https://supabase-url"
}
```

### Response

```json
{
  "message": "Produk berhasil dibuat"
}
```

---

## 1️⃣1️⃣ GET PRODUK UMKM SENDIRI

**GET** `{{base_url}}/products/my`

Authorization → `{{token_umkm}}`

---

# 🌍 PUBLIC API (TANPA TOKEN)

---

## 1️⃣2️⃣ LIST UMKM

**GET** `{{base_url}}/public/umkm`

---

## 1️⃣3️⃣ DETAIL UMKM

**GET**

```
{{base_url}}/public/umkm/toko-bagas
```

---

## 1️⃣4️⃣ PRODUK UMKM

```
GET /public/umkm/toko-bagas/products
```

---

## 1️⃣5️⃣ DETAIL PRODUK

```
GET /public/products/1
```

---

# 🛒 CART & ORDER (USER)

---

## 1️⃣6️⃣ ADD TO CART

**POST** `/cart`

Authorization → `{{token_user}}`

```json
{
  "productId": 1,
  "quantity": 2
}
```

---

## 1️⃣7️⃣ CHECKOUT (MULTI UMKM)

**POST** `/checkout`

Authorization → `{{token_user}}`

Response:

```json
{
  "orders": [{ "id": 101 }, { "id": 102 }]
}
```

---

# 🚚 ORDER STATUS

---

## 1️⃣8️⃣ UMKM KIRIM BARANG

**PATCH** `/orders/101/ship`

Authorization → `{{token_umkm}}`

---

## 1️⃣9️⃣ USER TERIMA BARANG

**PATCH** `/orders/101/complete`

Authorization → `{{token_user}}`

---

# 💳 PAYMENT MIDTRANS DEMO

---

## 2️⃣0️⃣ BUAT PAYMENT

**POST** `/payments/midtrans/101`

Authorization → `{{token_user}}`

Response:

```json
{
  "snapToken": "xxxxx"
}
```

Frontend:

```js
window.snap.pay("xxxxx");
```

---

# 🚨 DISPUTE

---

## 2️⃣1️⃣ USER BUAT KOMPLAIN

**POST** `/disputes`

Authorization → `{{token_user}}`

```json
{
  "orderId": 101,
  "reason": "Barang rusak"
}
```

---

## 2️⃣2️⃣ ADMIN RESOLVE DISPUTE

**PATCH** `/admin/disputes/1/resolve`

Authorization → `{{token_admin}}`

```json
{
  "decision": "REFUND"
}
```

---
