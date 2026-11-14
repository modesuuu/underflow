// dictionary.ts — every user-facing string of the surfaces the
// language setting covers, keyed once in English (the source of
// truth for the key set) and translated to Bahasa Indonesia.
// Deeper surfaces (inbox detail, admin panel, modals) still hold
// their English copy inline and join this dictionary pass by pass.

export const en = {
  // Sidebar / navigation
  "nav.sectionDashboard": "Dashboard",
  "nav.sectionTools": "Tools",
  "nav.feeds": "Feeds",
  "nav.tasks": "Tasks",
  "nav.collaborations": "Collaborations",
  "nav.circle": "Circle",
  "nav.inbox": "Inbox",
  "nav.myCollaborations": "My Collaborations",
  "nav.admin": "Admin",
  "nav.setting": "Setting",
  "nav.theme": "Theme",
  "nav.expandSidebar": "Expand sidebar",
  "nav.collapseSidebar": "Collapse sidebar",
  "nav.viewYourProfile": "View your profile",
  "nav.logOut": "Log out",

  // Theme toggle
  "theme.light": "Light",
  "theme.system": "System",
  "theme.dark": "Dark",
  "theme.aria": "Theme",
  "theme.modeAria": "{label} theme",
  "theme.switchAria": "Theme: {current}. Switch to {next}",

  // TopBar + breadcrumbs
  "topbar.openMenu": "Open menu",
  "topbar.backTo": "Back to {label}",
  "crumb.dashboard": "Dashboard",
  "crumb.feed": "Feed",
  "crumb.settings": "Settings",
  "crumb.appearance": "Appearance",
  "crumb.profile": "Profile",
  "crumb.account": "Account",
  "crumb.helpCenter": "Help Center",
  "crumb.language": "Language",
  "crumb.collaborations": "Collaborations",
  "crumb.myCollaborations": "My Collaborations",
  "crumb.inbox": "Inbox",
  "crumb.circle": "Circle",
  "crumb.notifications": "Notifications",

  // Notifications (bell + panel)
  "notif.title": "Notifications",
  "notif.ariaUnread": "Notifications, {count} unread",
  "notif.markAllRead": "Mark all read",
  "notif.seeAll": "See all notifications",
  "notif.all": "All",
  "notif.unread": "Unread",
  "notif.read": "Read",
  "notif.filterAria": "Notification filter",
  "notif.viewProfile": "View {name}'s profile",

  // Common
  "common.cancel": "Cancel",
  "common.retry": "Retry",
  "common.loading": "Loading…",

  // Settings index
  "settings.title": "Settings",
  "settings.subtitle": "Pick a category to manage it.",
  "settings.profile.label": "Profile",
  "settings.profile.desc": "Your photo and skills",
  "settings.appearance.label": "Appearance",
  "settings.appearance.desc": "Theme for this device",
  "settings.language.label": "Language",
  "settings.language.desc": "Language for the app interface",
  "settings.help.label": "Help Center",
  "settings.help.desc": "How Underflow works",
  "settings.account.label": "Account",
  "settings.account.desc": "Sign-in method and log out",

  // Settings > Appearance
  "settings.appearance.title": "Appearance",
  "settings.appearance.description":
    "Choose how Underflow looks on this device. System follows your device setting.",
  "settings.appearance.theme": "Theme",

  // Settings > Language
  "settings.language.title": "Language",
  "settings.language.description":
    "Choose the language for the Underflow interface on this device. It changes right away and is saved for your next visit.",
  "settings.language.en": "English",
  "settings.language.id": "Bahasa Indonesia",
  "settings.language.note":
    "Some parts of the app are still being translated and may show in English for now.",

  // Settings > Account
  "settings.account.title": "Account",
  "settings.account.description": "The account you are signed in with.",
  "settings.account.username": "Username",
  "settings.account.email": "Email",
  "settings.account.signInMethod": "Sign-in method",
  "settings.account.password": "Password",
  "settings.account.loading": "Loading your account…",

  // Settings > Profile
  "settings.profile.title": "Profile",
  "settings.profile.description":
    "Your photo and skills show on your profile and next to your applications.",
  "settings.profile.changePhoto": "Change photo",
  "settings.profile.uploading": "Uploading…",
  "settings.profile.photoHint": "JPG, PNG, WebP or GIF, up to 5 MB.",
  "settings.profile.yourSkills": "Your skills",
  "settings.profile.loadingSkills": "Loading your skills…",
  "settings.profile.standardRolesNote":
    "Standard roles, shared by everyone. They cannot be removed.",
  "settings.profile.noSkillsYet":
    "No personal skills yet. Add the ones you want to be found for.",
  "settings.profile.addSkillPlaceholder": "Add a skill, e.g. Figma",
  "settings.profile.add": "Add",
  "settings.profile.adding": "Adding…",
  "settings.profile.removePrompt": "Remove “{name}” from your skills?",
  "settings.profile.remove": "Remove",
  "settings.profile.removing": "Removing…",
  "settings.profile.photoUpdated": "Profile photo updated",
  "settings.profile.notImage": "That file is not an image.",
  "settings.profile.photoTooLarge": "Photo is too large. Max 5 MB.",
  "settings.profile.couldNotLoadSkills": "Could not load your skills.",
  "settings.profile.couldNotUpdatePhoto": "Could not update your photo.",
  "settings.profile.couldNotAddSkill": "Could not add that skill.",
  "settings.profile.couldNotRemoveSkill": "Could not remove that skill.",

  // Settings > Help Center
  "settings.help.title": "Help Center",
  "settings.help.description": "How the main flows in Underflow work.",
  "settings.help.q1": "How do I join a project?",
  "settings.help.a1":
    "Open a project on the Collaborations page and press Apply. Add a short message so the owner knows what you bring. The owner reviews your application in their Inbox; once you are accepted, the project appears in your My Collaborations.",
  "settings.help.q2": "How do I start a project?",
  "settings.help.a2":
    "Press New Project on the Collaborations page. Describe what you are building, add the roles you need as skills, and set the team size and a due date. Applications land in your Inbox, where you can accept or decline them.",
  "settings.help.q3": "What happens after I am accepted?",
  "settings.help.a3":
    "You become a member of the project. From My Collaborations you can open the project's Circle, a private space for the team with an announcements channel and a general channel.",
  "settings.help.q4": "Where do I manage applications?",
  "settings.help.a4":
    "In the Inbox. Applications live there as conversations with the applicant, and the application card inside carries the Accept and Decline actions. Your own sent applications show their status in the same place.",
  "settings.help.q5": "How do I change my photo or skills?",
  "settings.help.a5":
    "From the Settings page, open Profile. A new photo and skill changes apply everywhere right away: your profile, your applications, and the member lists of your projects.",

  // Feed
  "feed.postSomething": "Post Something",
  "feed.noPostsTitle": "No posts yet",
  "feed.noPostsBody": "Updates from people in your projects appear here.",
  "feed.comment": "Comment",
  "feed.writeComment": "Write your comment",
  "feed.viewProfile": "View {name}'s profile",
  "feed.commentOnPost": "Comment on post by {name}",
  "feed.postOptions": "Post options",
  "feed.reportPost": "Report post",
  "feed.editPost": "Edit post",
  "feed.deletePost": "Delete post",
  "feed.reportedNotice": "You reported this {noun}.",
  "feed.postNoun": "post",
  "feed.commentNoun": "comment",

  // Auth
  "auth.headline1": "Find your team.",
  "auth.headline2": "Build something real.",
  "auth.welcomeBack": "Welcome back",
  "auth.loginSubtitle": "Log in to your account",
  "auth.dontHaveAccount": "Don't have an account?",
  "auth.signUp": "Sign up",
  "auth.username": "Username",
  "auth.password": "Password",
  "auth.logIn": "Log in",
  "auth.loggingIn": "Logging in…",
  "auth.createTitle": "Create your account",
  "auth.createSubtitle": "Join Underflow to find your team",
  "auth.alreadyHaveAccount": "Already have an account?",
  "auth.email": "Email",
  "auth.passwordHint": "At least 8 characters",
  "auth.createAccount": "Create account",
  "auth.creatingAccount": "Creating your account…",
  "auth.continueWithGoogle": "Continue with Google",
  "auth.suspendedSubtitle": "Your account was suspended by the moderation team",
  "auth.logOutTitle": "Log out?",
  "auth.logOutBody": "You'll need to log in again to continue.",
  "auth.tagline":
    "Underflow matches students by skill and ambition, not by who they already know.",
  "auth.accountSuspended": "Account suspended",
  "auth.backToLogin": "Back to log in",
  "auth.yourPassword": "Your password",
  "auth.orContinueWith": "or continue with",
  "auth.signingIn": "Signing in…",
  "auth.googleFailed": "Google sign-in failed. Try again.",
  "auth.reason": "Reason",
  "auth.noReason": "No reason was provided.",
  "auth.appealSubtitle":
    "Think this was a mistake? Tell the moderation team why. You can appeal once.",
  "auth.appealPending":
    "Your appeal is being reviewed by the moderation team. If it is accepted, your account will be reactivated and you can log in again.",
  "auth.decisionNote": "Decision note: {note}",
  "auth.remainsSuspended": "Your account remains suspended.",
  "auth.appealAccepted": "Your appeal was accepted. Try logging in again.",
  "auth.couldNotSendAppeal": "Could not send your appeal. Try again.",
  "auth.usernameHint":
    "3–20 lowercase letters, numbers, dots, underscores, or dashes.",
  "auth.checkForm": "Check the form and try again.",
  "auth.serverUnreachable":
    "Can't reach the server. Check your connection and try again.",
  "notif.emptyAll": "No notifications. Activity from your projects appears here.",
  "notif.emptyUnread": "No unread notifications.",
  "notif.emptyRead": "No read notifications. Notifications you open move here.",
  "notif.emptyShort": "No notifications.",
  "common.delete": "Delete",
  "common.undo": "Undo",
  "feed.deletePostTitle": "Delete this post?",
  "feed.deletePostBody":
    "This post will be removed from the feed for everyone. This can't be undone.",
  "feed.reportedReview": "Our team will review it.",
  "feed.sendComment": "Send comment",
  "auth.suspendedOn": "Suspended on {date}",
  "auth.appealTitle": "Appeal this suspension",
  "auth.appealPasswordPlaceholder": "Re-enter your password to verify it is you",
  "auth.appealMessagePlaceholder": "Explain your situation",
  "auth.sendAppeal": "Send appeal",
  "auth.sending": "Sending…",
  "auth.appealSent": "Appeal sent. The moderation team will review it.",
  "auth.appealDenied": "Your appeal was denied.",
} as const;

export type DictKey = keyof typeof en;

export const id: Record<DictKey, string> = {
  // Sidebar / navigation
  "nav.sectionDashboard": "Dasbor",
  "nav.sectionTools": "Alat",
  "nav.feeds": "Beranda",
  "nav.tasks": "Tugas",
  "nav.collaborations": "Kolaborasi",
  "nav.circle": "Circle",
  "nav.inbox": "Kotak Masuk",
  "nav.myCollaborations": "Kolaborasi Saya",
  "nav.admin": "Admin",
  "nav.setting": "Pengaturan",
  "nav.theme": "Tema",
  "nav.expandSidebar": "Bentangkan sidebar",
  "nav.collapseSidebar": "Ciutkan sidebar",
  "nav.viewYourProfile": "Lihat profil kamu",
  "nav.logOut": "Keluar",

  // Theme toggle
  "theme.light": "Terang",
  "theme.system": "Sistem",
  "theme.dark": "Gelap",
  "theme.aria": "Tema",
  "theme.modeAria": "Tema {label}",
  "theme.switchAria": "Tema: {current}. Ganti ke {next}",

  // TopBar + breadcrumbs
  "topbar.openMenu": "Buka menu",
  "topbar.backTo": "Kembali ke {label}",
  "crumb.dashboard": "Dasbor",
  "crumb.feed": "Beranda",
  "crumb.settings": "Pengaturan",
  "crumb.appearance": "Tampilan",
  "crumb.profile": "Profil",
  "crumb.account": "Akun",
  "crumb.helpCenter": "Pusat Bantuan",
  "crumb.language": "Bahasa",
  "crumb.collaborations": "Kolaborasi",
  "crumb.myCollaborations": "Kolaborasi Saya",
  "crumb.inbox": "Kotak Masuk",
  "crumb.circle": "Circle",
  "crumb.notifications": "Notifikasi",

  // Notifications (bell + panel)
  "notif.title": "Notifikasi",
  "notif.ariaUnread": "Notifikasi, {count} belum dibaca",
  "notif.markAllRead": "Tandai semua dibaca",
  "notif.seeAll": "Lihat semua notifikasi",
  "notif.all": "Semua",
  "notif.unread": "Belum dibaca",
  "notif.read": "Dibaca",
  "notif.filterAria": "Filter notifikasi",
  "notif.viewProfile": "Lihat profil {name}",

  // Common
  "common.cancel": "Batal",
  "common.retry": "Coba lagi",
  "common.loading": "Memuat…",

  // Settings index
  "settings.title": "Pengaturan",
  "settings.subtitle": "Pilih kategori untuk mengaturnya.",
  "settings.profile.label": "Profil",
  "settings.profile.desc": "Foto dan keahlian kamu",
  "settings.appearance.label": "Tampilan",
  "settings.appearance.desc": "Tema untuk perangkat ini",
  "settings.language.label": "Bahasa",
  "settings.language.desc": "Bahasa untuk tampilan aplikasi",
  "settings.help.label": "Pusat Bantuan",
  "settings.help.desc": "Cara kerja Underflow",
  "settings.account.label": "Akun",
  "settings.account.desc": "Metode masuk dan keluar",

  // Settings > Appearance
  "settings.appearance.title": "Tampilan",
  "settings.appearance.description":
    "Pilih tampilan Underflow di perangkat ini. Sistem mengikuti pengaturan perangkat kamu.",
  "settings.appearance.theme": "Tema",

  // Settings > Language
  "settings.language.title": "Bahasa",
  "settings.language.description":
    "Pilih bahasa untuk tampilan Underflow di perangkat ini. Langsung berubah dan tersimpan untuk kunjungan berikutnya.",
  "settings.language.en": "English",
  "settings.language.id": "Bahasa Indonesia",
  "settings.language.note":
    "Beberapa bagian aplikasi masih diterjemahkan dan untuk sementara mungkin tampil dalam Bahasa Inggris.",

  // Settings > Account
  "settings.account.title": "Akun",
  "settings.account.description": "Akun yang sedang kamu pakai untuk masuk.",
  "settings.account.username": "Nama pengguna",
  "settings.account.email": "Email",
  "settings.account.signInMethod": "Metode masuk",
  "settings.account.password": "Kata sandi",
  "settings.account.loading": "Memuat akun kamu…",

  // Settings > Profile
  "settings.profile.title": "Profil",
  "settings.profile.description":
    "Foto dan keahlian kamu tampil di profil dan di samping lamaran kamu.",
  "settings.profile.changePhoto": "Ganti foto",
  "settings.profile.uploading": "Mengunggah…",
  "settings.profile.photoHint": "JPG, PNG, WebP atau GIF, maksimal 5 MB.",
  "settings.profile.yourSkills": "Keahlian kamu",
  "settings.profile.loadingSkills": "Memuat keahlian kamu…",
  "settings.profile.standardRolesNote":
    "Peran standar, dipakai bersama oleh semua orang. Tidak bisa dihapus.",
  "settings.profile.noSkillsYet":
    "Belum ada keahlian pribadi. Tambahkan keahlian yang ingin kamu temukan.",
  "settings.profile.addSkillPlaceholder": "Tambah keahlian, mis. Figma",
  "settings.profile.add": "Tambah",
  "settings.profile.adding": "Menambahkan…",
  "settings.profile.removePrompt": "Hapus “{name}” dari keahlian kamu?",
  "settings.profile.remove": "Hapus",
  "settings.profile.removing": "Menghapus…",
  "settings.profile.photoUpdated": "Foto profil diperbarui",
  "settings.profile.notImage": "File itu bukan gambar.",
  "settings.profile.photoTooLarge": "Foto terlalu besar. Maksimal 5 MB.",
  "settings.profile.couldNotLoadSkills": "Tidak bisa memuat keahlian kamu.",
  "settings.profile.couldNotUpdatePhoto": "Tidak bisa memperbarui foto kamu.",
  "settings.profile.couldNotAddSkill": "Tidak bisa menambahkan keahlian itu.",
  "settings.profile.couldNotRemoveSkill": "Tidak bisa menghapus keahlian itu.",

  // Settings > Help Center
  "settings.help.title": "Pusat Bantuan",
  "settings.help.description": "Cara kerja alur utama di Underflow.",
  "settings.help.q1": "Bagaimana cara bergabung ke proyek?",
  "settings.help.a1":
    "Buka proyek di halaman Kolaborasi lalu tekan Apply. Tambahkan pesan singkat supaya pemilik tahu apa yang kamu bawa. Pemilik meninjau lamaran kamu di Kotak Masuk mereka; setelah diterima, proyeknya muncul di Kolaborasi Saya.",
  "settings.help.q2": "Bagaimana cara memulai proyek?",
  "settings.help.a2":
    "Tekan New Project di halaman Kolaborasi. Jelaskan apa yang sedang kamu bangun, tambahkan peran yang kamu butuhkan sebagai keahlian, lalu atur ukuran tim dan tenggatnya. Lamaran masuk ke Kotak Masuk kamu, tempat kamu bisa menerima atau menolaknya.",
  "settings.help.q3": "Apa yang terjadi setelah saya diterima?",
  "settings.help.a3":
    "Kamu menjadi anggota proyek itu. Dari Kolaborasi Saya, kamu bisa membuka Circle proyeknya, ruang privat untuk tim dengan kanal pengumuman dan kanal umum.",
  "settings.help.q4": "Di mana saya mengelola lamaran?",
  "settings.help.a4":
    "Di Kotak Masuk. Lamaran tinggal di sana sebagai percakapan dengan pelamar, dan kartu lamaran di dalamnya membawa tombol Accept dan Decline. Lamaran yang kamu kirim sendiri juga tampil statusnya di tempat yang sama.",
  "settings.help.q5": "Bagaimana cara mengganti foto atau keahlian saya?",
  "settings.help.a5":
    "Dari halaman Pengaturan, buka Profil. Foto baru dan perubahan keahlian langsung berlaku di mana pun: profil kamu, lamaran kamu, dan daftar anggota proyek kamu.",

  // Feed
  "feed.postSomething": "Posting Sesuatu",
  "feed.noPostsTitle": "Belum ada postingan",
  "feed.noPostsBody": "Kabar dari orang-orang di proyek kamu muncul di sini.",
  "feed.comment": "Komentar",
  "feed.writeComment": "Tulis komentar kamu",
  "feed.viewProfile": "Lihat profil {name}",
  "feed.commentOnPost": "Komentari postingan {name}",
  "feed.postOptions": "Opsi postingan",
  "feed.reportPost": "Laporkan postingan",
  "feed.editPost": "Edit postingan",
  "feed.deletePost": "Hapus postingan",
  "feed.reportedNotice": "Kamu melaporkan {noun} ini.",
  "feed.postNoun": "postingan",
  "feed.commentNoun": "komentar",

  // Auth
  "auth.headline1": "Temukan timmu.",
  "auth.headline2": "Bangun sesuatu yang nyata.",
  "auth.welcomeBack": "Selamat datang kembali",
  "auth.loginSubtitle": "Masuk ke akun kamu",
  "auth.dontHaveAccount": "Belum punya akun?",
  "auth.signUp": "Daftar",
  "auth.username": "Nama pengguna",
  "auth.password": "Kata sandi",
  "auth.logIn": "Masuk",
  "auth.loggingIn": "Sedang masuk…",
  "auth.createTitle": "Buat akun kamu",
  "auth.createSubtitle": "Gabung Underflow untuk menemukan timmu",
  "auth.alreadyHaveAccount": "Sudah punya akun?",
  "auth.email": "Email",
  "auth.passwordHint": "Minimal 8 karakter",
  "auth.createAccount": "Buat akun",
  "auth.creatingAccount": "Membuat akun kamu…",
  "auth.continueWithGoogle": "Lanjutkan dengan Google",
  "auth.suspendedSubtitle": "Akun kamu ditangguhkan oleh tim moderasi",
  "auth.logOutTitle": "Keluar?",
  "auth.logOutBody": "Kamu harus masuk lagi untuk melanjutkan.",
  "auth.tagline":
    "Underflow mencocokkan mahasiswa berdasarkan keahlian dan ambisi, bukan berdasarkan siapa yang sudah mereka kenal.",
  "auth.accountSuspended": "Akun ditangguhkan",
  "auth.backToLogin": "Kembali ke masuk",
  "auth.yourPassword": "Kata sandi kamu",
  "auth.orContinueWith": "atau lanjutkan dengan",
  "auth.signingIn": "Sedang masuk…",
  "auth.googleFailed": "Gagal masuk dengan Google. Coba lagi.",
  "auth.reason": "Alasan",
  "auth.noReason": "Tidak ada alasan yang diberikan.",
  "auth.appealSubtitle":
    "Merasa ini kesalahan? Beri tahu tim moderasi alasannya. Kamu bisa mengajukan banding satu kali.",
  "auth.appealPending":
    "Banding kamu sedang ditinjau oleh tim moderasi. Jika diterima, akun kamu akan diaktifkan lagi dan kamu bisa masuk kembali.",
  "auth.decisionNote": "Catatan keputusan: {note}",
  "auth.remainsSuspended": "Akun kamu tetap ditangguhkan.",
  "auth.appealAccepted": "Banding kamu diterima. Coba masuk lagi.",
  "auth.couldNotSendAppeal": "Tidak bisa mengirim banding kamu. Coba lagi.",
  "auth.usernameHint":
    "3–20 huruf kecil, angka, titik, garis bawah, atau tanda hubung.",
  "auth.checkForm": "Periksa lagi formulirnya dan coba lagi.",
  "auth.serverUnreachable":
    "Tidak bisa terhubung ke server. Periksa koneksi kamu dan coba lagi.",
  "notif.emptyAll": "Belum ada notifikasi. Aktivitas dari proyek kamu muncul di sini.",
  "notif.emptyUnread": "Tidak ada notifikasi yang belum dibaca.",
  "notif.emptyRead":
    "Tidak ada notifikasi yang sudah dibaca. Notifikasi yang kamu buka pindah ke sini.",
  "notif.emptyShort": "Belum ada notifikasi.",
  "common.delete": "Hapus",
  "common.undo": "Urungkan",
  "feed.deletePostTitle": "Hapus postingan ini?",
  "feed.deletePostBody":
    "Postingan ini akan dihapus dari beranda untuk semua orang. Ini tidak bisa dibatalkan.",
  "feed.reportedReview": "Tim kami akan meninjaunya.",
  "feed.sendComment": "Kirim komentar",
  "auth.suspendedOn": "Ditangguhkan pada {date}",
  "auth.appealTitle": "Ajukan banding atas penangguhan ini",
  "auth.appealPasswordPlaceholder": "Masukkan lagi kata sandi kamu untuk verifikasi",
  "auth.appealMessagePlaceholder": "Jelaskan situasinya",
  "auth.sendAppeal": "Kirim banding",
  "auth.sending": "Mengirim…",
  "auth.appealSent": "Banding terkirim. Tim moderasi akan meninjaunya.",
  "auth.appealDenied": "Banding kamu ditolak.",
};
