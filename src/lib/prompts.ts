export type DataGuru = {
  nama_sekolah: string;
  alamat_sekolah: string;
  nama_guru: string;
  nip_guru: string;
  nama_kepala_sekolah: string;
  nip_kepala_sekolah: string;
};

export function promptPerangkatAjar(
  g: DataGuru,
  f: {
    kelasFase: string;
    mapel: string;
    jpMinggu: string;
    jpTahun: string;
    sistemSekolah: string;
  },
) {
  return `Saya adalah ${g.nama_guru}, NIP ${g.nip_guru}, Guru Mata Pelajaran ${f.mapel} ${f.kelasFase} di ${g.nama_sekolah}.

Data Sekolah
Nama Guru : ${g.nama_guru}
NIP : ${g.nip_guru}
Mata Pelajaran : ${f.mapel}
Kelas/Fase : ${f.kelasFase}
Satuan Pendidikan : ${g.nama_sekolah}
Alamat Sekolah : ${g.alamat_sekolah}
Jumlah Jam Pelajaran : ${f.jpMinggu}
Total Jam Pelajaran : ${f.jpTahun}
Sistem Sekolah : ${f.sistemSekolah}
Kepala Sekolah
Nama : ${g.nama_kepala_sekolah}
NIP : ${g.nip_kepala_sekolah}

TUGAS AI
Berdasarkan seluruh dokumen yang saya lampirkan (Format, Capaian Pembelajaran, dan Kalender Pendidikan), buatkan perangkat pembelajaran berikut secara berurutan. Setiap dokumen harus saling berkaitan dan menggunakan hasil dokumen sebelumnya sebagai dasar penyusunannya.
1. Analisis Capaian Pembelajaran (CP) — mengikuti format Analisis CP yang dilampirkan, berdasarkan CP yang dilampirkan.
2. Tujuan Pembelajaran (TP) — mengikuti format TP, berdasarkan Analisis CP.
3. Analisis Minggu Efektif — mengikuti format yang dilampirkan, berdasarkan Kalender Pendidikan.
4. Analisis Hari Efektif — berdasarkan Analisis Minggu Efektif dan Kalender Pendidikan.
5. Program Tahunan (Prota) — berdasarkan Analisis Minggu Efektif, Tujuan Pembelajaran, dan Kalender Pendidikan.
6. Program Semester (Promes) — berdasarkan Prota, TP, dan Kalender Pendidikan, mengikuti format Promes, seluruh tabel dibuat berwarna sesuai contoh.
7. KKTP — berdasarkan Tujuan Pembelajaran, mengikuti format yang dilampirkan.
8. ATP — berdasarkan CP dan Promes, mengikuti format ATP yang dilampirkan.

KETENTUAN PENYUSUNAN
- Mengikuti format contoh 100% dan tidak mengubah format asli.
- Setiap dokumen dibuat dalam bagian terpisah dengan judul jelas (### 1. ANALISIS CP, dst).
- Seluruh dokumen harus saling berkaitan.
- Menggunakan Bahasa Indonesia baku sesuai Kurikulum Merdeka.
- Perhitungan minggu efektif, hari efektif, dan alokasi JP harus akurat.
- Seluruh tabel harus rapi, mudah dibaca, dan siap cetak.
- Setiap dokumen ditutup dengan bagian pengesahan Kepala Sekolah (${g.nama_kepala_sekolah}, NIP ${g.nip_kepala_sekolah}) dan Guru (${g.nama_guru}, NIP ${g.nip_guru}).`;
}

export function promptRPM(
  g: DataGuru,
  f: {
    tanggal: string;
    mapel: string;
    kelasFase: string;
    semester: string;
    alokasiWaktu: string;
    pendekatan: string;
    materiPokok: string;
    cp: string;
    tp: string;
  },
) {
  return `Anda adalah seorang guru profesional yang memahami Kurikulum Merdeka dan mampu menyusun Rencana Pembelajaran Mendalam (RPM) sesuai karakteristik peserta didik.
Buatkan Rencana Pembelajaran Mendalam (RPM) yang lengkap, sistematis, profesional, dan menggunakan format resmi.

IDENTITAS PEMBELAJARAN
Nama Sekolah : ${g.nama_sekolah}
Mata Pelajaran : ${f.mapel}
Kelas/Fase : ${f.kelasFase}
Semester : ${f.semester}
Alokasi Waktu : ${f.alokasiWaktu}
Materi Pokok : ${f.materiPokok}
Hari/Tanggal : ${f.tanggal}

MODUL RPM HARUS MEMUAT
1. DIMENSI PROFIL LULUSAN (Keimanan dan Ketakwaan, Kewargaan, Penalaran Kritis, Kreativitas, Kolaborasi, Kemandirian, Kesehatan, Komunikasi) beserta alasan/penerapannya.
2. CAPAIAN PEMBELAJARAN: ${f.cp}
   Uraikan keterkaitan CP dengan materi, tujuan, aktivitas, dan penilaian.
3. LINTAS DISIPLIN ILMU yang relevan beserta bentuk keterpaduannya.
4. TUJUAN PEMBELAJARAN: ${f.tp}
5. PRAKTIK PEDAGOGIS: Deep Learning (Pembelajaran Mendalam) dipadukan dengan ${f.pendekatan}; jelaskan model, pendekatan, metode, strategi, teknik, peran guru, peran peserta didik, aktivitas kolaboratif.
6. LINGKUNGAN PEMBELAJARAN (fisik, sosial, emosional, pengaturan ruang, pemanfaatan lingkungan sekitar).
7. KEMITRAAN PEMBELAJARAN.
8. PEMANFAATAN DIGITAL.
9. KEGIATAN PEMBELAJARAN: A. Pendahuluan (salam, doa, presensi, apersepsi, motivasi, tujuan, pertanyaan pemantik, manfaat), B. Inti dengan sintaks ${f.pendekatan} dipadukan Pembelajaran Mendalam (Tahap Memahami dan Tahap Mengaplikasikan), C. Penutup (Refleksi, Penguatan Konsep, Penutup).
10. PENILAIAN FORMATIF (teknik, instrumen, indikator, kisi-kisi, contoh soal, kunci jawaban, pedoman penskoran, umpan balik).
11. PENILAIAN SUMATIF INDIVIDU (tujuan, teknik, bentuk, kisi-kisi, soal, kunci jawaban, penskoran, kriteria ketuntasan).
12. RUBRIK PENILAIAN lengkap dalam tabel.
13. LKPD BERGAMBAR (identitas, tujuan, petunjuk, ilustrasi edukatif, aktivitas, pertanyaan, ruang jawaban, refleksi).

KETENTUAN FORMAT OUTPUT
Sajikan seluruh RPM dalam bentuk tabel Markdown yang sangat rapi, profesional, sistematis, mudah disalin ke Microsoft Word, judul dan subjudul jelas, bahasa Indonesia baku, sesuai Kurikulum Merdeka.

BAGIAN PENGESAHAN
Kepala Sekolah: ${g.nama_kepala_sekolah}, NIP. ${g.nip_kepala_sekolah}
Guru: ${g.nama_guru}, NIP. ${g.nip_guru}`;
}

export function promptSoal(
  g: DataGuru,
  f: {
    jenjang: string;
    mapel: string;
    kelasFase: string;
    jenisAsesmen: string;
    tanggal: string;
    font: string;
    ukuranFont: string;
    tp: string;
    pg: number;
    isian: number;
    esai: number;
  },
) {
  const total = f.pg + f.isian + f.esai;
  return `ANDA BERPERAN SEBAGAI GURU PROFESIONAL ${f.jenjang} YANG MEMAHAMI KURIKULUM MERDEKA, KARAKTERISTIK PESERTA DIDIK ${f.kelasFase}, PENYUSUNAN KISI-KISI, ASESMEN PEMBELAJARAN, DAN TAKSONOMI BLOOM.

Buatkan dua dokumen terpisah:
1. Kisi-Kisi ${f.jenisAsesmen} ${f.mapel}
2. Soal ${f.jenisAsesmen} ${f.mapel}

A. KETENTUAN UMUM
1. Seluruh kisi-kisi dan soal mengacu langsung pada Tujuan Pembelajaran (TP) berikut: ${f.tp}
2. Sesuai mata pelajaran ${f.mapel}, ${f.kelasFase}, Kurikulum Merdeka, indikator kisi-kisi, dan Taksonomi Bloom.
3. Jangan membuat soal di luar cakupan TP.
4. Kesesuaian jelas: TP → Indikator Soal → Level Kognitif → Bentuk Soal → Nomor Soal.
5. Hindari soal ambigu atau berjawaban ganda.

B. DOKUMEN 1 — KISI-KISI SOAL
KOP SEKOLAH
Nama Sekolah : ${g.nama_sekolah}
Alamat Sekolah : ${g.alamat_sekolah}
Mata Pelajaran : ${f.mapel}
Kelas/Fase : ${f.kelasFase}
Jenis huruf: ${f.font}; Ukuran huruf: ${f.ukuranFont}.
Tabel kisi-kisi memuat kolom: No. | Mata Pelajaran | Tujuan Pembelajaran | Indikator Soal | Level Kognitif (C1-C4) | Bentuk Soal | Jumlah Soal | Nomor Soal.
Jumlah seluruh soal harus ${total} soal.

C. DOKUMEN 2 — SOAL ${f.jenisAsesmen}
Identitas: ${f.jenisAsesmen}; Mata Pelajaran : ${f.mapel}; Kelas/Fase : ${f.kelasFase}; Tanggal Ulangan : ${f.tanggal}; Nama Peserta Didik : ______; Nilai : ______.
Rincian soal:
- Pilihan Ganda: ${f.pg} soal (4 opsi A-D, satu jawaban benar, distraktor logis).
- Isian Singkat: ${f.isian} soal.
- Uraian/Esai: ${f.esai} soal.
Total tepat ${total} soal.

F. PROPORSI TINGKAT KESULITAN: 30% mudah, 50% sedang, 20% sulit, tersebar proporsional pada semua bentuk soal.

G. JENIS SOAL: memuat soal literasi (teks/konteks kehidupan sehari-hari), soal numerasi (data/tabel sederhana), dan soal bergambar (deskripsikan gambar secara jelas dan relevan bila gambar tidak dapat ditampilkan).

I. KUNCI JAWABAN DAN PEDOMAN PENSKORAN
- Kunci jawaban PG, jawaban isian, dan poin penting jawaban esai.
- PG dan isian benar = 1 poin; uraian menggunakan rubrik; sertakan rumus pengolahan nilai.

PEMERIKSAAN AKHIR: pastikan PG tepat ${f.pg}, isian tepat ${f.isian}, esai tepat ${f.esai}, total ${total} soal, semua sesuai TP, kisi-kisi, dan ${f.kelasFase}.
Sajikan hasil dalam Markdown rapi dengan tabel, siap disalin dan dicetak (font ${f.font} ${f.ukuranFont}).
Tutup dengan pengesahan: Kepala Sekolah ${g.nama_kepala_sekolah} (NIP. ${g.nip_kepala_sekolah}) dan Guru ${g.nama_guru} (NIP. ${g.nip_guru}).`;
}