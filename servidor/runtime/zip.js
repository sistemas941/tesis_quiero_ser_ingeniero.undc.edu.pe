'use strict';
/**
 * Lectura y escritura de archivos ZIP (docx, xlsx y paquetes de migracion) sin dependencias externas.
 * Solo admite los metodos "almacenado" (0) y "deflate" (8), que son los que usan Word, Excel y Google.
 */
const zlib = require('zlib');

function crc32(buf) { return zlib.crc32(buf) >>> 0; }

/** partes: [{ nombre, datos: Buffer|string }] -> Buffer */
function crearZip(partes) {
  const locales = [];
  const central = [];
  let desplazamiento = 0;
  const fecha = fechaDos(new Date());
  for (const p of partes) {
    const nombre = Buffer.from(p.nombre, 'utf8');
    const datos = Buffer.isBuffer(p.datos) ? p.datos : Buffer.from(String(p.datos), 'utf8');
    const comprimido = zlib.deflateRawSync(datos, { level: 6 });
    const usar = comprimido.length < datos.length;
    const cuerpo = usar ? comprimido : datos;
    const crc = crc32(datos);
    const loc = Buffer.alloc(30);
    loc.writeUInt32LE(0x04034b50, 0); loc.writeUInt16LE(20, 4); loc.writeUInt16LE(0x0800, 6);
    loc.writeUInt16LE(usar ? 8 : 0, 8); loc.writeUInt16LE(fecha.hora, 10); loc.writeUInt16LE(fecha.dia, 12);
    loc.writeUInt32LE(crc, 14); loc.writeUInt32LE(cuerpo.length, 18); loc.writeUInt32LE(datos.length, 22);
    loc.writeUInt16LE(nombre.length, 26); loc.writeUInt16LE(0, 28);
    locales.push(loc, nombre, cuerpo);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(0x0800, 8);
    cen.writeUInt16LE(usar ? 8 : 0, 10); cen.writeUInt16LE(fecha.hora, 12); cen.writeUInt16LE(fecha.dia, 14);
    cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(cuerpo.length, 20); cen.writeUInt32LE(datos.length, 24);
    cen.writeUInt16LE(nombre.length, 28); cen.writeUInt32LE(desplazamiento, 42);
    central.push(cen, nombre);
    desplazamiento += 30 + nombre.length + cuerpo.length;
  }
  const tamCentral = central.reduce((s, b) => s + b.length, 0);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0); fin.writeUInt16LE(partes.length, 8); fin.writeUInt16LE(partes.length, 10);
  fin.writeUInt32LE(tamCentral, 12); fin.writeUInt32LE(desplazamiento, 16);
  return Buffer.concat([...locales, ...central, fin]);
}

function fechaDos(d) {
  return { hora: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), dia: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate() };
}

/** Buffer -> [{ nombre, datos: Buffer }] (se ignoran las carpetas) */
function leerZip(buf) {
  let fin = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) { if (buf.readUInt32LE(i) === 0x06054b50) { fin = i; break; } }
  if (fin < 0) throw new Error('El archivo no es un ZIP válido.');
  const total = buf.readUInt16LE(fin + 10);
  let p = buf.readUInt32LE(fin + 16);
  const salida = [];
  for (let k = 0; k < total; k++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('ZIP dañado (directorio central).');
    const metodo = buf.readUInt16LE(p + 10);
    const tamC = buf.readUInt32LE(p + 20);
    const lnom = buf.readUInt16LE(p + 28), lext = buf.readUInt16LE(p + 30), lcom = buf.readUInt16LE(p + 32);
    const off = buf.readUInt32LE(p + 42);
    const nombre = buf.toString('utf8', p + 46, p + 46 + lnom);
    p += 46 + lnom + lext + lcom;
    if (nombre.endsWith('/')) continue;
    const lnl = buf.readUInt16LE(off + 26), lel = buf.readUInt16LE(off + 28);
    const ini = off + 30 + lnl + lel;
    const crudo = buf.subarray(ini, ini + tamC);
    let datos;
    if (metodo === 0) datos = Buffer.from(crudo);
    else if (metodo === 8) datos = zlib.inflateRawSync(crudo);
    else throw new Error('ZIP con compresión no admitida (' + metodo + ') en ' + nombre);
    salida.push({ nombre, datos });
  }
  return salida;
}

module.exports = { crearZip, leerZip };
