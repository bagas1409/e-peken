# Panduan Deployment ke Railway (Backend)

File ini berisi panduan langkah demi langkah untuk men-deploy `api-ecommers` ke Railway.

## 1. Persiapan Git
Pastikan folder `api-ecommers` sudah di-push ke GitHub Anda.
Jika belum:
```bash
cd api-ecommers
git init
git add .
git commit -m "Initial commit"
# Buat repo baru di GitHub, lalu ikuti instruksi push dari GitHub, contoh:
# git remote add origin https://github.com/USERNAME/REPO_NAME.git
# git branch -M main
# git push -u origin main
```

## 2. Setup di Railway
1.  Buka [Railway.app](https://railway.app/) dan login (bisa via GitHub).
2.  Klik **+ New Project** > **Deploy from Java/Node/JS** (atau pilih **GitHub Repo** jika sudah connect).
3.  Pilih repository `api-ecommers` Anda.
4.  Klik **Deploy Now**.
*(Deployment awal mungkin gagal karena Environment Variables belum diset, ini wajar).*

## 3. Konfigurasi Environment Variables
Masuk ke tab **Variables** di dashboard project Railway Anda, lalu tambahkan variable berikut (copy dari file `.env` lokal Anda):

| Variable Name | Value (Contoh/Keterangan) |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://postgres:password@db.supabase.co:5432/postgres` (Ambil dari Supabase/Neon) |
| `SUPABASE_URL` | URL project Supabase Anda |
| `SUPABASE_SERVICE_ROLE_KEY` | Key Service Role Supabase (PENTING) |
| `MIDTRANS_SERVER_KEY` | Server Key dari Midtrans Dashboard |
| `MIDTRANS_CLIENT_KEY` | Client Key dari Midtrans Dashboard |
| `JWT_ACCESS_SECRET` | Secret untuk Access Token (Bebas, buat yang rumit) |
| `JWT_REFRESH_SECRET` | Secret untuk Refresh Token (Bebas, buat yang rumit) |
| `CORS_ORIGIN` | `*` (Untuk awal), nanti ubah ke domain frontend (cth: `https://epeken.com`) |

**Catatan**: Variable `PORT` tidak perlu ditambah manual, Railway otomatis menambahkannya.

## 4. Generate URL & Testing
1.  Setelah Variable disimpan, Railway biasanya akan auto-redeploy.
2.  Ke tab **Settings** > **Networking** > **Public Networking**.
3.  Klik **Generate Domain** (Anda akan dapat URL seperti `xxx.up.railway.app`).
4.  Buka URL tersebut di browser. Jika muncul pesan "Cannot GET /" (atau response default server Anda), berarti **BERHASIL**.

## 5. Cek Log
Jika ada error, buka tab **Deployments** > Klik deployment terakhir > **View Logs**.
