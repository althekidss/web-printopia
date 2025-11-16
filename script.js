// ==========================
// app.js — Web Layanan Fotokopi
// ==========================
const express = require("express");
const multer = require("multer");
const path = require("path");
const QRCode = require("qrcode");
const app = express();
const PORT = 3000;

// ======== Konfigurasi Upload ========
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ======== Middleware ========
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ======== Route Halaman Utama ========
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Layanan Fotokopi Modern</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
<style>
  body { font-family: 'Inter', sans-serif; background: linear-gradient(to bottom right, #f0f4ff, #ffffff); }
  .card { background: white; border-radius: 1rem; box-shadow: 0 10px 20px rgba(0,0,0,0.05); padding: 1.5rem; }
  .logo { font-weight: 800; font-size: 1.5rem; color: #2563eb; }
</style>
</head>
<body class="min-h-screen p-6">

<header class="flex items-center justify-between mb-8">
  <div class="flex items-center gap-3">
    <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">FP</div>
    <div class="logo">FastPrint Center</div>
  </div>
  <a id="waBtn" href="#" target="_blank" class="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700">Chat WhatsApp</a>
</header>

<main class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
  <!-- Form -->
  <section class="lg:col-span-2 card">
    <h2 class="text-2xl font-semibold mb-4">Form Pemesanan Fotokopi</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium">Nama</label>
        <input id="nama" class="w-full border rounded p-2 mt-1" placeholder="Nama Anda" />
      </div>

      <div>
        <label class="block text-sm font-medium">Nomor WhatsApp</label>
        <input id="wa" class="w-full border rounded p-2 mt-1" placeholder="+628..." value="+6283192009696" />
      </div>

      <div>
        <label class="block text-sm font-medium">Jumlah Halaman</label>
        <input id="halaman" type="number" min="1" value="1" class="w-full border rounded p-2 mt-1" />
      </div>

      <div>
        <label class="block text-sm font-medium">Jumlah Salinan</label>
        <input id="salinan" type="number" min="1" value="1" class="w-full border rounded p-2 mt-1" />
      </div>

      <div>
        <label class="block text-sm font-medium">Jenis Cetak</label>
        <select id="warna" class="w-full border rounded p-2 mt-1">
          <option value="bw">Hitam Putih</option>
          <option value="color">Berwarna</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium">Ukuran Kertas</label>
        <select id="ukuran" class="w-full border rounded p-2 mt-1">
          <option value="A4">A4</option>
          <option value="A3">A3</option>
        </select>
      </div>

      <div class="flex items-center gap-2 mt-2">
        <input type="checkbox" id="duplex" />
        <label for="duplex" class="text-sm">Cetak bolak-balik (Duplex)</label>
      </div>

      <div class="flex items-center gap-2 mt-2">
        <input type="checkbox" id="jilid" />
        <label for="jilid" class="text-sm">Tambah Jilid (Rp 5.000)</label>
      </div>
    </div>

    <div class="mt-6">
      <label class="block text-sm font-medium">Upload File (ukuran bebas)</label>
      <form id="uploadForm" enctype="multipart/form-data">
        <input id="file" name="file" type="file" multiple class="mt-2 w-full border p-2 rounded bg-gray-50" />
      </form>
      <div id="preview" class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3"></div>
    </div>
  </section>

  <!-- Ringkasan -->
  <aside class="card flex flex-col justify-between">
    <div>
      <h3 class="text-xl font-semibold mb-4">Ringkasan Harga</h3>
      <div class="space-y-2 text-gray-700">
        <p>Harga per halaman: <b id="hargaHalaman">Rp 0</b></p>
        <p>Total: <b id="totalHarga" class="text-2xl text-blue-700">Rp 0</b></p>
      </div>
    </div>

    <div class="mt-4 space-y-2">
      <button id="bayarQR" class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Bayar via QRIS</button>
      <button id="pesanWA" class="w-full border border-green-600 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100">Pesan via WhatsApp</button>
    </div>

    <div id="qrcode" class="mt-4 flex justify-center"></div>
  </aside>
</main>

<footer class="text-center text-sm text-gray-500 mt-8">© 2025 FastPrint Center — Layanan Fotokopi Modern</footer>

<script>
const hargaConfig = {
  bw_A4: 200,
  color_A4: 1000,
  bw_A3: 300,
  color_A3: 1500,
  jilid: 5000
};

function formatRupiah(num){ return "Rp " + num.toLocaleString("id-ID"); }

function hitungHarga(){
  const halaman = parseInt(document.getElementById('halaman').value) || 0;
  const salinan = parseInt(document.getElementById('salinan').value) || 0;
  const warna = document.getElementById('warna').value;
  const ukuran = document.getElementById('ukuran').value;
  const duplex = document.getElementById('duplex').checked;
  const jilid = document.getElementById('jilid').checked;

  let perHal = hargaConfig[\\${warna}_\${ukuran}\];
  if(duplex) perHal *= 0.85; // diskon 15% bolak-balik
  let total = perHal * halaman * salinan;
  if(jilid) total += hargaConfig.jilid;

  document.getElementById('hargaHalaman').innerText = formatRupiah(perHal);
  document.getElementById('totalHarga').innerText = formatRupiah(total);
  return total;
}

// Auto update harga
["halaman","salinan","warna","ukuran","duplex","jilid"].forEach(id=>{
  document.getElementById(id).addEventListener("input", hitungHarga);
  document.getElementById(id).addEventListener("change", hitungHarga);
});

// Upload preview
document.getElementById("file").addEventListener("change", e=>{
  const preview = document.getElementById("preview");
  preview.innerHTML = "";
  for(const f of e.target.files){
    const reader = new FileReader();
    reader.onload = ev=>{
      const img = document.createElement("img");
      img.src = ev.target.result;
      img.className = "rounded shadow";
      preview.appendChild(img);
    };
    reader.readAsDataURL(f);
  }
});

// WA
document.getElementById("pesanWA").addEventListener("click", ()=>{
  const total = hitungHarga();
  const nama = document.getElementById("nama").value || "-";
  const phone = document.getElementById("wa").value.replace(/[^\\d+]/g,"");
  const pesan = \Halo, saya \${nama} ingin pesan fotokopi. Total harga: \${formatRupiah(total)}\;
  window.open(\https://wa.me/\${phone}?text=\${encodeURIComponent(pesan)}\, "_blank");
});

// QRIS
document.getElementById("bayarQR").addEventListener("click", ()=>{
  const total = hitungHarga();
  const payload = \FASTPRINT|AMOUNT:\${total}|REF:\${Date.now()}\;
  axios.post("/qris", { payload }).then(res=>{
    document.getElementById("qrcode").innerHTML = "<img src='"+res.data.qr+"' class='mx-auto' />";
  });
});

// jalankan awal
hitungHarga();
</script>

</body>
</html>
`);
});

// ======== Endpoint QRIS Dinamis ========
app.post("/qris", async (req, res) => {
  const { payload } = req.body;
  try {
    const qr = await QRCode.toDataURL(payload);
    res.json({ qr });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ======== Jalankan Server ========
app.listen(PORT, () => {
  console.log(\🚀 Server berjalan di http://localhost:\${PORT}\);
});