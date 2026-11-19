# 🚀 ZoraLive - GitHub & Vercel Deploy Qo'llanmasi

Ushbu loyiha zamonaviy arxitekturaga ega:
- **Frontend (Client):** React 19 + Vite 6 + Tailwind CSS 4 (Vercel uchun to'liq moslangan).
- **Backend (Server):** Node.js + Express + Socket.IO + SQLite (WebRTC, real-time ovoz va PK janglari).

---

## 1. Loyihani GitHub'ga yuklash (Push)

1. [GitHub.com](https://github.com/new) saytiga kiring va yangi repository oching (masalan, nomi: `zoralive`).
2. Terminalda (loyiha papkasida: `C:\Users\Owner\.gemini\antigravity\scratch\zoralive`) quyidagi buyruqlarni bajaring:

```bash
git remote add origin https://github.com/azamatkarimov3421-create/zoralive.git
git branch -M main
git push -u origin main
```
*(Eslatma: Agar repository nomini boshqacha qo'ysangiz, URL manzilini shunga moslang)*.

---

## 2. Vercel'da Frontend'ni ishga tushirish

1. [Vercel.com](https://vercel.com) saytiga kiring va GitHub orqali tizimga kiring.
2. **"Add New..." -> "Project"** tugmasini bosing.
3. Yangi yaratilgan **`zoralive`** repozitoriyasini tanlang (**Import**).
4. Sozlamalarni tekshiring:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (yoki `client`)
   - **Build Command:** `npm run build --prefix client` (root bo'lsa) yoki avtomatik `tsc && vite build`
   - **Output Directory:** `client/dist` (yoki `dist`)
5. **Deploy** tugmasini bosing! 
   Loyiha 1 daqiqada global CDN orqali jonli efirga chiqadi (masalan: `https://zoralive.vercel.app`).

### ⚙️ Environment Variables (Ixtiyoriy - Real-time Server ulanganda):
Vercel loyiha sozlamalarida (`Settings` -> `Environment Variables`) quyidagilarni kiritishingiz mumkin:
- `VITE_API_URL` = `https://sizning-backend-serveringiz.onrender.com`
- `VITE_WS_URL` = `https://sizning-backend-serveringiz.onrender.com`

---

## 3. Real-time Backend (Socket.IO & WebRTC) ni bepul joylash

Vercel — serverless bo'lgani uchun doimiy ochiq qoluvchi WebSocket (Socket.IO) va mahalliy SQLite faylini to'liq xotirada ushlamaydi. Shuning uchun backend qismini quyidagi bepul/oson platformalardan biriga ulash tavsiya etiladi:

### Variant A: Render.com (Eng qulay va bepul)
1. [Render.com](https://render.com) ga kiring -> **New Web Service**.
2. GitHub repongizni tanlang.
3. Sozlamalar:
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Chiqqan URL manzilni (masalan `https://zoralive-api.onrender.com`) Vercel'dagi `VITE_API_URL` ga kiriting.

### Variant B: Railway.app yoki O'zingizning VPS Serveringiz
```bash
cd server
npm install
npm run build
npm start
```
Port: `4000` da to'liq ishlaydi.
