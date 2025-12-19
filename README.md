📘 DOKUMENTASI API
E-Peken Mart (Marketplace UMKM)
🧠 ARSITEKTUR SISTEM
Frontend (Web / Mobile)
↓
Cloudflare Tunnel (HTTPS Public URL)
↓
Backend Express (Local)
↓
PostgreSQL (Local)
↓
Supabase Storage (Images)
↓
Midtrans Sandbox (Payment)

🌍 BASE URL

Gunakan URL dari Cloudflare Tunnel:

https://xxxx.trycloudflare.com

Contoh:

BASE_URL = https://xxxx.trycloudflare.com

🔐 AUTHENTICATION

Menggunakan JWT (Bearer Token)

Token dikirim lewat header:

Authorization: Bearer <access_token>

1️⃣ AUTH API
🔹 Register User

POST /auth/register

Body (JSON)
{
"name": "Admin",
"email": "admin@mail.com",
"password": "123456",
"role": "ADMIN"
}

Role tersedia
USER | UMKM | ADMIN

Response
{
"message": "Register berhasil",
"userId": 1,
"role": "ADMIN"
}

🔹 Login

POST /auth/login

Body
{
"email": "admin@mail.com",
"password": "123456"
}

Response
{
"token": "JWT_TOKEN",
"user": {
"id": 1,
"name": "Admin",
"email": "admin@mail.com",
"role": "ADMIN"
}
}

🔹 Get My Profile

GET /me

Headers
Authorization: Bearer JWT_TOKEN

2️⃣ UMKM (SELLER)
🔹 Create / Update Profil UMKM (Onboarding)

POST /umkm/profile

Headers
Authorization: Bearer JWT_TOKEN (role UMKM)

Body
{
"storeName": "Toko Makmur",
"slug": "toko-makmur",
"description": "Menjual produk lokal",
"address": "Bandung"
}

🔹 Upload Logo UMKM

POST /upload/umkm/logo

Headers
Authorization: Bearer JWT_TOKEN
Content-Type: multipart/form-data

Form Data
file: (image.png)

Response
{
"message": "Upload berhasil",
"imageUrl": "https://xxxx.supabase.co/storage/..."
}

🔹 Upload Banner UMKM

POST /upload/umkm/banner

(sama seperti logo)

3️⃣ PRODUK (UMKM)
🔹 Create Produk

POST /products

Headers
Authorization: Bearer JWT_TOKEN (UMKM)

Body
{
"name": "Keripik Singkong",
"description": "Gurih dan renyah",
"price": 15000,
"stock": 20,
"categoryId": 1
}

🔹 Upload Gambar Produk

POST /upload/product

Headers
Authorization: Bearer JWT_TOKEN
Content-Type: multipart/form-data

Form Data
file: produk.jpg
productId: 1

🔹 Soft Delete Produk

PATCH /products/:id/deactivate

4️⃣ PUBLIC API (TANPA LOGIN)
🔹 List Produk

GET /public/products

🔹 Detail Produk

GET /public/products/:id

🔹 Profil UMKM + Produk

GET /public/umkm/:slug

5️⃣ CART & CHECKOUT
🔹 Add to Cart

POST /cart

Headers
Authorization: Bearer JWT_TOKEN

Body
{
"productId": 1,
"quantity": 2
}

🔹 Checkout

POST /checkout

Headers
Authorization: Bearer JWT_TOKEN

Body
{
"paymentMethod": "MIDTRANS"
}

Response
{
"snapUrl": "https://app.sandbox.midtrans.com/snap/..."
}

6️⃣ MIDTRANS CALLBACK
🔹 Callback URL (WAJIB)

Set di Midtrans Dashboard:

https://xxxx.trycloudflare.com/midtrans/callback

🔹 Callback Endpoint

POST /midtrans/callback

Flow

Verifikasi signature

Update:

payments.status

orders.payment_status

wallet.balance_pending

7️⃣ WALLET UMKM
🔹 View Wallet

GET /umkm/wallet

🔹 Withdraw Request

POST /umkm/withdraw

8️⃣ ADMIN PANEL API
🔹 List Users

GET /admin/users

🔹 Ban / Unban User

PATCH /admin/users/:id/ban
PATCH /admin/users/:id/unban

🔹 Approve UMKM

PATCH /admin/umkm/:id/approve

🔹 Admin Order Monitoring

GET /admin/orders

9️⃣ ORDER FLOW
🔹 My Orders (User)

GET /orders/my

🔹 Ship Order (UMKM)

PATCH /orders/:id/ship

🔹 Complete Order (User)

PATCH /orders/:id/complete

🔟 DISPUTE
🔹 Create Dispute

POST /disputes

🔹 Resolve Dispute (Admin)

PATCH /admin/disputes/:id/resolve

🧪 POSTMAN COLLECTION (REKOMENDASI)

Folder:

Auth
UMKM
Products
Public
Cart
Checkout
Orders
Wallet
Admin
Midtrans
Upload

Gunakan Environment Variable:

BASE_URL
TOKEN

🧾 CATATAN PENTING

Semua image disimpan di Supabase

Semua data di PostgreSQL lokal

Backend tidak diubah

Cloudflare Tunnel hanya jembatan HTTPS

Siap demo / testing / MVP

✅ STATUS AKHIR

✔ Auth
✔ Role
✔ Upload image
✔ Product
✔ Checkout
✔ Midtrans
✔ Wallet
✔ Admin
✔ Public API
