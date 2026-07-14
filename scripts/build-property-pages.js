/**
 * BRACAMONTE — Generador de páginas estáticas por inmueble
 *
 * Lee el catálogo público desde Apps Script y genera una carpeta real
 * por inmueble en /inmuebles/{slug}/index.html, con las etiquetas Open Graph
 * que WhatsApp/Facebook necesitan para mostrar foto + título al compartir.
 *
 * Se ejecuta automáticamente vía GitHub Actions (ver .github/workflows/build-pages.yml),
 * pero también puedes correrlo a mano con: node scripts/build-property-pages.js
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_URL = process.env.SCRIPT_URL || ''; // se inyecta desde GitHub Actions Secrets
const SITE_URL = 'https://grupobracamonte.com';
const OUT_DIR = path.join(__dirname, '..', 'inmuebles');

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function propertySlug(p) {
  return `${slugify(`${p.tipo} ${p.loc} ${p.op}`)}-${p.codigo}`.toLowerCase();
}

function autoDesc(p) {
  const partes = [`${p.tipo || 'Inmueble'} en ${p.loc || 'ubicación a confirmar'}${p.ciudad ? ', ' + p.ciudad : ''}.`];
  const attrs = [];
  if (p.hab) attrs.push(`${p.hab} habitaciones`);
  if (p.ban) attrs.push(`${p.ban} baños`);
  if (p.m2c) attrs.push(`${p.m2c} de construcción`);
  if (attrs.length) partes.push(`Cuenta con ${attrs.join(', ')}.`);
  if (p.op) partes.push(`Disponible en ${p.op.toLowerCase()}.`);
  return partes.join(' ');
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderPage(p, slug) {
  const url = `${SITE_URL}/inmuebles/${slug}/`;
  const desc = escapeHtml((p.descripcion && p.descripcion.trim()) ? p.descripcion : autoDesc(p));
  const title = escapeHtml(`${p.tipo || 'Inmueble'} en ${p.loc || ''}${p.ciudad ? ', ' + p.ciudad : ''} · Bracamonte Inmobiliaria`);
  const photos = p.fotos || [];
  const ogImage = photos[0] || `${SITE_URL}/icon-512.png`;
  const waNum = (p.telefonoAsesora || '584140000000').replace(/\D/g, '');
  const waMsg = encodeURIComponent(`Me interesa éste inmueble COD ${p.codigo} ${url}`);
  const waLink = `https://wa.me/${waNum}?text=${waMsg}`;

  const gallery = photos.length
    ? `<div class="gal">${photos.map(f => `<img src="${f}" loading="lazy" alt="${title}">`).join('')}</div>`
    : `<div class="gal-empty">🏠</div>`;

  const attrs = [];
  if (p.hab) attrs.push(`🛏️ ${p.hab} habitaciones`);
  if (p.ban) attrs.push(`🚿 ${p.ban} baños`);
  if (p.m2c) attrs.push(`📐 ${p.m2c}`);
  if (p.op) attrs.push(`🏷️ ${p.op}`);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">

<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${ogImage}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="Bracamonte Inmobiliaria">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${ogImage}">

<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@700&display=swap" rel="stylesheet">
<style>
:root{--naranja:#FB9A00;--dark:#023341;--terciario:#FD5E02;--crema:#FCF5E3;--white:#FFFFFF;--mid:#5C6B70;--border:#E7E0CC}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Barlow',sans-serif;background:var(--crema);color:var(--dark)}
.wrap{max-width:640px;margin:0 auto;padding:0 0 40px}
nav{background:var(--dark);padding:16px 20px}
nav a{color:white;text-decoration:none;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:17px;display:flex;align-items:center;gap:8px}
.gal{display:grid;grid-template-columns:1fr;gap:2px}
.gal img{width:100%;aspect-ratio:4/3;object-fit:cover}
.gal-empty{aspect-ratio:4/3;background:var(--dark);display:flex;align-items:center;justify-content:center;font-size:44px;opacity:.4}
.body{padding:22px 20px}
.loc{font-size:12px;color:var(--terciario);font-weight:700;text-transform:uppercase;letter-spacing:.5px}
h1{font-family:'Barlow Condensed',sans-serif;font-size:28px;margin-top:4px}
.ubic{font-size:14px;color:var(--mid);margin-top:4px}
.attrs{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
.attrs span{background:white;border:1px solid var(--border);padding:7px 12px;border-radius:8px;font-size:13px}
.desc{margin-top:18px;font-size:14px;line-height:1.7}
.cta{display:flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:white;text-decoration:none;padding:14px;border-radius:10px;font-weight:600;margin-top:24px}
.back{display:block;text-align:center;margin-top:16px;color:var(--mid);font-size:13px;text-decoration:none}
</style>
</head>
<body>
<nav><a href="${SITE_URL}/">🏠 Bracamonte Inmobiliaria</a></nav>
<div class="wrap">
  ${gallery}
  <div class="body">
    <div class="loc">${escapeHtml(p.ciudad || '')}</div>
    <h1>${escapeHtml(p.tipo || 'Inmueble')}</h1>
    <div class="ubic">📍 ${escapeHtml(p.loc || '')}</div>
    <div class="attrs">${attrs.map(a => `<span>${a}</span>`).join('')}</div>
    <p class="desc">${desc}</p>
    <a class="cta" href="${waLink}" target="_blank">💬 Escribir por WhatsApp</a>
    <a class="back" href="${SITE_URL}/#listings">← Ver todos los inmuebles</a>
  </div>
</div>
</body>
</html>`;
}

async function main() {
  if (!SCRIPT_URL) {
    console.error('Falta la variable de entorno SCRIPT_URL. Configúrala como Secret en GitHub Actions.');
    process.exit(1);
  }

  const res = await fetch(`${SCRIPT_URL}?action=publicList`);
  const json = await res.json();
  if (json.status !== 'ok') throw new Error('Apps Script respondió con error: ' + json.msg);
  const listings = json.data || [];

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const slugsUsadas = new Set();
  for (const p of listings) {
    if (!p.codigo) continue;
    let slug = propertySlug(p);
    if (slugsUsadas.has(slug)) slug += '-' + Math.random().toString(36).slice(2, 5);
    slugsUsadas.add(slug);

    const dir = path.join(OUT_DIR, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), renderPage(p, slug));
    console.log('Generado:', slug);
  }

  console.log(`Listo: ${listings.length} páginas generadas en /inmuebles`);
}

main().catch(err => { console.error(err); process.exit(1); });
