<p align="center">
  <img src="./app/icon.svg" width="72" alt="Logo Underflow" />
</p>

<h1 align="center">Underflow (Frontend)</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19.2-61dafb?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <a href="https://underflow-pi.vercel.app"><img src="https://img.shields.io/badge/Live-underflow--pi.vercel.app-35702b" alt="Live" /></a>
</p>

Repo frontend Underflow, platform kolaborasi untuk mahasiswa dan pencari
portofolio: user memposting proyek, user lain melamar, owner menyetujui,
lalu tim berkolaborasi di dalam aplikasi.

Repo ini privat dan hanya dipakai tim. Backend ada di repo terpisah:
[stackunderflow_BE](https://github.com/fnCodeee/stackunderflow_BE)
(PHP Native + MySQL, plus server WebSocket Node.js).

**Live:** https://underflow-pi.vercel.app

## Stack

- Next.js 16.3 (App Router) + React 19
- TypeScript strict
- Tailwind CSS v4 + design system Astryx (`@astryxdesign/core`,
  `@astryxdesign/theme-neutral`)
- Ikon Boxicons, toast Sonner
- react-markdown + remark-gfm untuk Profile Detail
- Test: Vitest, lint: ESLint

## Menjalankan lokal

Prasyarat: Node.js 20+, backend Underflow jalan (API REST di :8000,
MySQL via Laragon), dan server realtime jalan (WebSocket di :8080).
Urutan nyalakan: MySQL dulu (Laragon Start All), lalu backend, lalu
realtime, terakhir frontend.

```bash
npm install
npm run dev
```

Buka http://localhost:3000.

### Environment variables

File `.env.local`:

| Variable | Isi |
| -------- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL API backend, contoh `http://127.0.0.1:8000` |
| `NEXT_PUBLIC_REALTIME_URL` | URL server WebSocket, contoh `ws://127.0.0.1:8080` |
| `NEXT_PUBLIC_SITE_URL` | URL publik frontend, contoh `http://localhost:3000` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client ID Google OAuth untuk tombol sign-in |

Catatan: pakai `127.0.0.1`, bukan `localhost` (di Windows `localhost`
resolve ke IPv6 dulu dan server lokal hanya dengar di IPv4).

### Scripts

| Command | Fungsi |
| ------- | ------ |
| `npm run dev` | Server development |
| `npm run build` | Build production |
| `npm run start` | Jalankan hasil build |
| `npm run lint` | ESLint |
| `npm test` | Vitest |

## Struktur folder

```
app/            Routing (App Router): dashboard/feed, collaborations,
                my-collaborations, circle, profile, admin, settings,
                halaman auth, halaman legal
features/       Modul per fitur: auth, dashboard, collaborations,
                my-collaborations, circle, inbox, profile, admin,
                appeals, search, settings
components/     UI bersama: layout (Sidebar, TopBar), komponen ui,
                grafik kontribusi (vendored dari Kibo UI)
lib/            API client, kamus i18n (EN/ID), utilitas
public/         Aset statis dan font
tests/          Test Vitest
```

## Fitur yang sudah jalan

- **Auth**: registrasi email dengan verifikasi (akun baru dibuat setelah
  link email diklik; kalau email gagal terkirim, registrasi batal),
  login JWT, sign-in Google.
- **Feed**: postingan teks + maks 5 gambar, like, komentar. Update live
  via WebSocket, fallback polling 5 detik.
- **Collaborations**: buat proyek dengan skill yang dibutuhkan dan
  jumlah anggota; lamaran masuk lewat Inbox, owner approve/decline.
- **My Collaborations**: board proyek milik sendiri dan yang diikuti,
  dikelompokkan per status, termasuk kolom Owned.
- **Circle**: ruang grup per proyek. Zone announcements (khusus owner)
  dan general, lampiran file, mention + @everyone, penanda unread,
  pesan bisa dibalas/diedit/dihapus.
- **Profil**: gaya GitHub, grafik kontribusi 365 hari (yang dihitung
  hanya proyek yang dibuat dan diikuti), Profile Detail (markdown),
  daftar skill, link sosial.
- **Panel admin**: dua tingkat role. Monitor mengusulkan tindakan,
  Super Admin menyetujui dan mengeksekusi. Ada strike, suspend,
  dan banding dari user.
- **Moderator AI**: postingan, komentar, dan collab baru dicek AI
  setelah tayang. Pelanggaran dihapus + kena strike; laporan user
  diverifikasi AI dulu sebelum ada yang diturunkan. Kill switch
  `AI_MOD_ENABLED` ada di `.env` backend.
- **Tema** Light/Dark/System tersimpan di akun, ikut pindah device.
  Bahasa UI: Inggris dan Indonesia.

## Konvensi penting

- Bahasa UI: Inggris. Bahasa kode dan komentar mengikuti file di
  sekitarnya.
- Radius design system Astryx: kartu/container 12px, elemen di
  dalamnya 10px, paling dalam 6px. Jangan pakai 28px untuk kartu
  profil.
- Aksen Astryx diganti hijau: light `#35702b`, dark `#d8e9a8`.
  Teks tetap hitam.
- Logo resmi: huruf U solid milik Raka (`components/ui/LogoMark.tsx`).
- Semua animasi/motion wajib lewat skill `motionmaxxing` (aturan tim
  internal, lihat `AGENTS.md`).

## Deployment

- Frontend: Vercel, deploy otomatis dari branch `main`.
- Backend + WebSocket saat ini masih di laptop Raka, publik lewat
  Tailscale Funnel (API di host `ts.net`, WS di port 8443). Situs hanya
  hidup selama laptop menyala dengan stack lengkap.
- Setiap origin frontend baru wajib ditambahkan ke
  `CORS_ALLOWED_ORIGINS` di backend dan ke authorized origins Google
  OAuth, kalau tidak data dan login Google akan ditolak browser.
- Endpoint publish WebSocket dikunci header `X-Publish-Secret`
  (`REALTIME_PUBLISH_SECRET` di `.env` backend). Jangan pernah
  menghapus pemeriksaan ini selama WS terbuka ke publik.
- Rencana berikutnya: backend pindah ke server Faiz (Cloudflare
  Tunnel + domain sendiri).

## Tim

- Raka Alfarezi: frontend, UI/UX
- Faiz Aghitsna: backend, database
- Fadilah Nur Yasin: pendukung backend dan database
- Alvina Chalista Putri: riset UX, dokumentasi
- Alifah Nailatusy Syarifah: riset UX, dokumentasi
