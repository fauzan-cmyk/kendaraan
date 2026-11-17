async function panggil(alamat, metode = "GET", isi) {
  const respon = await fetch("/api/" + alamat, {
    method: metode,
    headers: { "Content-Type": "application/json" },
    body: isi ? JSON.stringify(isi) : undefined
  });
  const hasil = await respon.json();
  if (!respon.ok) {
    throw new Error(hasil.pesan);
  }
  return hasil;
}

const rupiah = (angka) => "Rp " + Number(angka).toLocaleString("id-ID");

const filter = (form) => "?" + new URLSearchParams(new FormData(form));

function teks(isi) {
  const div = document.createElement("div");
  div.textContent = isi;
  return div.innerHTML;
}

async function keluar() {
  await panggil("auth/logout", "POST");
  location.href = "login.html";
}

const GAYA = {
  kartu: "rounded-kartu border border-slate-200 bg-white p-[22px]",
  form: "flex flex-wrap items-end gap-3.5",
  label: "flex flex-col gap-1.5 text-[13px] font-bold text-slate-700",
  isian: "h-[42px] rounded-isian border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900",
  tombol: "h-[42px] cursor-pointer rounded-isian bg-kuning px-5 text-sm font-extrabold text-navy hover:bg-kuning-muda",
  tombolReset: "h-[42px] cursor-pointer rounded-isian bg-slate-100 px-5 text-sm font-extrabold text-slate-700 hover:bg-slate-200",
  tabel: "w-full border-collapse text-sm " +
    "[&_th]:border-b [&_th]:border-slate-200 [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-bold [&_th]:text-slate-500 " +
    "[&_td]:whitespace-nowrap [&_td]:border-b [&_td]:border-slate-100 [&_td]:px-3 [&_td]:py-3.5 [&_td]:align-middle"
};

function pasang(selektor, kelas) {
  document.querySelectorAll(selektor).forEach((el) => el.classList.add(...kelas.split(" ")));
}
pasang("[data-kartu]", GAYA.kartu);
pasang("form", GAYA.form);
pasang("form label", GAYA.label);
pasang("form input, form select", GAYA.isian);
pasang("form button:not([type=reset])", GAYA.tombol);
pasang("form button[type=reset]", GAYA.tombolReset);
pasang("table", GAYA.tabel);

const IKON = {
  kendaraan: '<circle cx="6" cy="16" r="3"/><circle cx="18" cy="16" r="3"/><path d="M6 16l4-7h5l3 7M10 9H8"/>',
  transaksi: '<path d="M4 7h16v11H4z"/><path d="M16 12h4"/>',
  tanggal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
  naik: '<path d="M4 18l5-6 4 3 6-8"/>'
};

const svg = (isi, ukuran = 18) =>
  `<svg width="${ukuran}" height="${ukuran}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${isi}</svg>`;

const BADGE = {
  LONG: ["bg-green-100 text-green-800", "bg-green-500"],
  MEDIUM: ["bg-amber-100 text-amber-800", "bg-amber-500"],
  SHORT: ["bg-slate-100 text-slate-700", "bg-slate-400"],
  Lunas: ["bg-green-100 text-green-800", "bg-green-500"],
  Sebagian: ["bg-sky-100 text-sky-800", "bg-sky-500"],
  Pending: ["bg-amber-100 text-amber-800", "bg-amber-500"],
  Tersedia: ["bg-green-100 text-green-800", "bg-green-500"],
  "Sedang digunakan": ["bg-red-100 text-red-800", "bg-red-500"],
  Nonaktif: ["bg-slate-100 text-slate-700", "bg-slate-400"],
  Ditahan: ["bg-amber-100 text-amber-800", "bg-amber-500"],
  Dikembalikan: ["bg-green-100 text-green-800", "bg-green-500"]
};

function badge(label) {
  const [pil, titik] = BADGE[label] || BADGE.SHORT;
  return `<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${pil}"><span class="size-[7px] rounded-full ${titik}"></span>${label}</span>`;
}

const AVATAR = [
  "bg-amber-100 text-amber-800", "bg-blue-100 text-blue-800", "bg-green-100 text-green-800",
  "bg-pink-100 text-pink-800", "bg-violet-100 text-violet-800"
];

function avatar(nama) {
  const warna = AVATAR[nama.charCodeAt(0) % AVATAR.length];
  return `<span class="inline-flex items-center gap-2.5">
    <span class="flex size-9 items-center justify-center rounded-full text-sm font-extrabold ${warna}">${teks(nama[0].toUpperCase())}</span>
    <b>${teks(nama)}</b></span>`;
}

const MENU = [
  ["rental", "Rental"], ["kendaraan", "Kendaraan"], ["penyewa", "Penyewa"],
  ["transaksi", "Transaksi"], ["tambah-kendaraan", "Tambah kendaraan"]
];
const TAUTAN = "block rounded-isian px-3.5 py-[11px] text-sm font-semibold";

document.getElementById("menu").innerHTML = `
  <div class="flex flex-col items-center gap-2">
    <div class="h-24 w-full overflow-hidden rounded-isian bg-white"><img src="img/logo.jpg" alt="Logo" class="size-full scale-150 object-contain" /></div>
    <span class="text-sm font-extrabold text-white">Rental Kendaraan</span>
  </div>
  <nav class="flex flex-col gap-1">` +
  MENU.map(([file, nama]) => {
    const aktif = location.pathname.endsWith("/" + file + ".html");
    return `<a href="${file}.html" class="${TAUTAN} ${aktif ? "bg-navy-aktif text-white shadow-[inset_3px_0_0_var(--color-kuning)]" : "text-slate-400 hover:bg-navy-aktif/60"}">${nama}</a>`;
  }).join("") +
  `</nav>
  <div class="mt-auto flex flex-col gap-1">
    <div id="peran" class="px-3.5 pb-1"></div>
    <a href="#" onclick="keluar()" class="${TAUTAN} text-slate-400 hover:bg-navy-aktif/60">Keluar</a>
  </div>`;

const PERAN = { admin: "bg-kuning text-navy", user: "bg-slate-700 text-slate-100" };

panggil("auth/saya").then((saya) => {
  document.getElementById("peran").innerHTML = `
    <div class="truncate text-sm font-semibold text-white">${teks(saya.username)}</div>
    <span class="mt-1 inline-block rounded px-2 py-0.5 text-[11px] font-extrabold ${PERAN[saya.peran] || PERAN.user}">(${saya.peran.toUpperCase()})</span>`;
}).catch(() => {});


const header = document.getElementById("header");
header.className = "mb-7 flex flex-wrap items-center justify-between gap-3";
header.innerHTML = `
  <div><h1 class="text-[26px] font-extrabold">${header.dataset.judul}</h1>
    <p class="mt-1 text-sm text-slate-500">${header.dataset.sub}</p></div>
  <span class="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-600">
    ${svg(IKON.tanggal, 16)}${new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</span>`;

document.querySelector("main").className = "min-w-0 max-w-[1500px] flex-1 p-9";