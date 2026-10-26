# GrowTrack 🌱

GrowTrack adalah aplikasi timer farm untuk Growtopia. Catat farm dan jenis seed, lihat perkiraan waktu panen, lalu kelola siklus tanam dan panen dari satu dashboard.

## Fitur

- Tambah, edit, hapus, pin, dan pantau farm dari dashboard.
- Pilih seed dari seed library bawaan atau buat seed sendiri.
- Atur sisa waktu menuju panen dalam hari, jam, dan menit; waktu siap panen ditampilkan sebagai perkiraan.
- Lihat status farm: sedang tumbuh, siap dipanen, atau sudah dipanen.
- Tandai panen, tanam ulang, dan reset siklus pertumbuhan.
- Aktifkan pengingat panen per farm.
- Kelola seed kustom serta pulihkan seed starter.

## Teknologi

- **React Native 0.88** dan **React 19**
- **Expo SDK 57**, TypeScript
- **AsyncStorage** untuk penyimpanan lokal
- **expo-notifications** untuk notifikasi native
- **react-native-web** untuk target web
- Jest dan `jest-expo` untuk pengujian

## Struktur proyek

```text
.
├── App.tsx                   # Root app dan perpindahan layar
├── app.json                  # Konfigurasi Expo, platform, dan plugin
├── index.ts                  # Entry point Expo
├── assets/                   # Icon, splash, dan aset aplikasi
├── __tests__/                # Pengujian UI
└── src/
    ├── components/           # Komponen UI reusable
    ├── data/                 # Seed bawaan dan icon seed
    ├── hooks/                # Hooks, termasuk jam/clock
    ├── screens/               # Dashboard, form farm/seed, library, settings
    ├── notifications.ts      # Permission dan penjadwalan pengingat
    ├── storage.ts            # Load, validasi, migrasi, dan persist data
    ├── store.tsx             # State dan aksi aplikasi
    ├── theme.ts              # Design tokens
    ├── types.ts              # Tipe data
    └── utils/                # Perhitungan waktu dan konfirmasi
```

## Setup

Persyaratan: Node.js dan npm. Untuk menjalankan di perangkat atau emulator native, siapkan juga toolchain Android/iOS yang sesuai dengan Expo.

```bash
git clone https://github.com/Archeeell/Grow-Track.git
cd Grow-Track
npm install
```

## Menjalankan aplikasi

```bash
npm start       # Expo development server
npm run android # Jalankan target Android
npm run ios     # Jalankan target iOS
npm run web     # Jalankan target web
```

Perintah kualitas yang tersedia:

```bash
npm test        # Jest
npm run typecheck
```

## Platform

Konfigurasi proyek mencakup **Android, iOS, dan web** melalui Expo. Dukungan tablet iOS diaktifkan dalam `app.json`. Ketersediaan fitur native, terutama notifikasi, bergantung pada izin OS dan jenis build; Expo Go tidak menjalankan modul notifikasi native pada implementasi ini.

## Data dan penyimpanan

Data farm dan seed disimpan secara lokal di perangkat menggunakan AsyncStorage dengan key `growtopia-farm-tracker`. Aplikasi tidak mengonfigurasi akun atau backend/cloud sync. Seed bawaan dapat ditambahkan kembali melalui aksi restore; data versi lama dimigrasikan ke format versi baru saat dibaca. Data lokal tidak otomatis tersinkron antar perangkat.

## Notifikasi

Pengingat dapat diaktifkan per farm dan mati secara default. Pada Android, aplikasi menyiapkan notification channel `farm-ready`; pada iOS/Android notifikasi dijadwalkan melalui `expo-notifications` setelah izin diberikan. Untuk web, aplikasi meminta izin browser dan memakai Web Notifications. Pengingat web menggunakan timer halaman, sehingga tidak setara dengan penjadwalan native di background. Jika izin ditolak atau platform tidak mendukung notifikasi, farm tetap dapat disimpan tanpa pengingat.

## Screenshots

Belum ada screenshot aplikasi yang diverifikasi untuk README ini. Tambahkan gambar ke repository lalu tautkan, contohnya:

<img width="394" height="853" alt="Designer" src="https://github.com/user-attachments/assets/01e648d2-6131-4e9c-a8c6-4ee1e06db32f" />

## Catatan dan batasan

- Grow time pada seed bawaan adalah data starter; Settings juga menyebut nilainya memakai formula rarity Growtopia dan mungkin sudah berubah. Sesuaikan melalui seed library bila tidak cocok dengan game.
- Waktu panen adalah estimasi berbasis waktu dan durasi yang dimasukkan pengguna.
- Penyimpanan bersifat lokal per instalasi; tidak ada sinkronisasi cloud yang dikonfigurasi.
- Dukungan notifikasi background bergantung pada platform, permission, dan build aplikasi; pengalaman web dan Expo Go memiliki batasan yang dijelaskan di atas.

## License

Lihat [LICENSE](LICENSE).
