# ZoraLive — Ovozli Party, Jonli Video Efir, PK Battle va Party O‘yinlar Platformasi

**ZoraLive** — *Ziigo-Chat&Live Streaming* tipidagi to‘liq ishlaydigan real-time ijtimoiy efir, ovozli xona va party-o‘yinlar platformasining 1-bosqich (MVP) to‘liq kod bazasi.

## Asosiy imkoniyatlar
- **Ovozli Party Xonalar (Voice Rooms):** 6/8/12 ta interaktiv mikrofon o‘rni, real WebRTC ovoz + gapirganda yonuvchi to‘lqin, xona egasi moderatsiyasi (qulflash, ovozini o‘chirish, chiqarib yuborish), xona mavzulari, kirish effektlari (Entry Rides), jonli chat va xona ichidan o‘yin ochish.
- **Jonli Video Efir + PK Battle:** Real kamera oqimi / studiya rejimi, ikkiga bo‘lingan PK jangi, jonli taymer va sovg‘alar hisob chizig‘i.
- **2 ta to‘liq ishlaydigan o‘yin:** **Klassik 15×15 Ludo** (ko‘p o‘yinchili + AI botlar) va **Lucky Wheel / Greedy** (serverda hisoblanuvchi x15 gacha yutuqli g‘ildirak).
- **Virtual Iqtisodiyot (Atomar Ledger):** Tangalar (Coins), Olmoslar (Diamonds), 12+ sovg‘alar (Oddiy, Lucky, Luxury to‘liq ekran animatsiya), Do‘kon (Avatar ramkalari, Kirish mashinalari, Chat pufaklari, VIP/SVIP), Kunlik vazifalar, Olmos → Tanga konvertatsiyasi va Host pul yechish (KYC) so‘rovlari.
- **Host & Agentlik Tizimi:** Agency ID (`ZORA77`, `TASH01`) orqali qo‘shilish, yangi agentlik ochish, avtomatik 50% Host / 10% Agentlik / 40% Platforma taqsimoti.
- **Super Admin Panel (`/admin`):** Foydalanuvchilar, jonli xonalar, sovg‘alar katalogi, payout tasdiqlash/rad etish va shikoyatlar moderatsiyasi.
- **PWA + Capacitor Android Tayyor:** `client/capacitor.config.ts` va `manifest.webmanifest` sozlangan.

## Ishga tushirish

```bash
npm run dev
```

* **Ilova (Frontend):** `http://localhost:5173`
* **API & Socket.IO Server:** `http://localhost:4000`

### Tayyor Demo Akkauntlar (Parol hammasi uchun: `123456`)
| Rol | Username | Imkoniyatlari |
| :--- | :--- | :--- |
| **Super Admin** | `admin` | `/admin` boshqaruv paneli + barcha funksiyalar |
| **Agentlik** | `silkroad` | `ZORA77` agentligi rahbari, komissiyalar va hostlar |
| **Host** | `madina_live` | Jonli xona egasi, olmos balansi, PK va moderatsiya |
| **VIP Mehmon** | `mehmon` | 15,000 tanga, ramka va sportkar kirish effekti |

## Android APK qilish (Capacitor)
Android Studio o‘rnatilgandan so‘ng:
```bash
cd client
npm run build
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
npx cap sync
npx cap open android
```
