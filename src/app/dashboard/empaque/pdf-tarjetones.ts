/**
 * PDF Tarjetones — Client-side PDF generation for pallet and box labels.
 * Opens a print-friendly window that the user can print/save as PDF.
 */

import type { SerializedBox, SerializedPallet } from './types';

const baseStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4; margin: 10mm; }
  body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; color: #1a1a1a; }
  .card { page-break-inside: avoid; border: 2px solid #333; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
  .card-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 12px; }
  .card-header h1 { font-size: 22px; font-weight: 800; letter-spacing: 1px; }
  .card-header .code { font-size: 28px; font-weight: 900; font-family: monospace; }
  .logo-area { font-size: 14px; font-weight: 700; color: #16a34a; text-transform: uppercase; letter-spacing: 2px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; }
  .field { margin-bottom: 4px; }
  .field .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; font-weight: 600; }
  .field .value { font-size: 14px; font-weight: 600; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
  .badge-export { background: #dbeafe; color: #1e40af; }
  .badge-internal { background: #f3f4f6; color: #374151; }
  .divider { border-top: 1px dashed #ccc; margin: 12px 0; }
  .boxes-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
  .boxes-table th { text-align: left; padding: 6px 8px; border-bottom: 2px solid #333; font-weight: 700; text-transform: uppercase; font-size: 10px; color: #666; }
  .boxes-table td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
  .boxes-table tr:last-child td { border-bottom: none; }
  .footer { text-align: center; font-size: 10px; color: #999; margin-top: 8px; }
  .weight-big { font-size: 32px; font-weight: 900; font-family: monospace; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`;

function openPrintWindow(html: string, title: string) {
  const win = window.open('', '_blank');
  if (!win) {
    alert('No se pudo abrir la ventana de impresión. Verifique que los pop-ups estén habilitados.');
    return;
  }
  win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>${baseStyles}</style>
</head>
<body>
  ${html}
  <script>window.onload = function() { window.print(); };<\/script>
</body>
</html>`);
  win.document.close();
}

/**
 * Generate a printable tarjetón for a single box.
 */
export function printBoxTarjeton(box: SerializedBox) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(box.code)}&size=120x120&format=svg`;

  const html = `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="logo-area">Seedor</div>
          <h1 style="margin-top: 4px;">Tarjetón de Caja</h1>
        </div>
        <div style="text-align: right; display: flex; align-items: flex-start; gap: 12px;">
          <div>
            <div class="code">${box.code}</div>
          </div>
          <img src="${qrUrl}" alt="QR ${box.code}" style="width: 80px; height: 80px;" />
        </div>
      </div>
      <div class="grid">
        <div class="field">
          <div class="label">Producto</div>
          <div class="value">${box.product}</div>
        </div>
        <div class="field">
          <div class="label">Calibre</div>
          <div class="value">${box.caliber}</div>
        </div>
        <div class="field">
          <div class="label">Categoría</div>
          <div class="value">${box.category}</div>
        </div>
        <div class="field">
          <div class="label">Peso Neto</div>
          <div class="value weight-big">${box.weightKg} kg</div>
        </div>
        ${box.producer ? `<div class="field"><div class="label">Productor</div><div class="value">${box.producer}</div></div>` : ''}
        ${box.packagingCode ? `<div class="field"><div class="label">Código Envase</div><div class="value">${box.packagingCode}</div></div>` : ''}
        ${box.palletCode ? `<div class="field"><div class="label">Pallet</div><div class="value">${box.palletCode}</div></div>` : ''}
        <div class="field">
          <div class="label">Fecha</div>
          <div class="value">${new Date(box.createdAt).toLocaleDateString('es-AR')}</div>
        </div>
      </div>
      <div class="footer">Generado por Seedor · ${new Date().toLocaleString('es-AR')}</div>
    </div>
  `;
  openPrintWindow(html, `Caja ${box.code}`);
}

/**
 * Generate a printable tarjetón for a pallet (includes list of boxes).
 */
export function printPalletTarjeton(pallet: SerializedPallet) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(pallet.code)}&size=120x120&format=svg`;

  const boxRows = pallet.boxes
    .map(
      (b) => `
      <tr>
        <td style="font-family: monospace; font-weight: 600;">${b.code}</td>
        <td>${b.product}</td>
        <td>${b.caliber}</td>
        <td>${b.category}</td>
        <td style="text-align: right; font-weight: 600;">${b.weightKg} kg</td>
      </tr>`
    )
    .join('');

  const html = `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="logo-area">Seedor</div>
          <h1 style="margin-top: 4px;">Tarjetón de Pallet</h1>
        </div>
        <div style="text-align: right; display: flex; align-items: flex-start; gap: 12px;">
          <div>
            <div class="code">${pallet.code}</div>
            <div style="font-size: 12px; color: #666;">Pallet #${pallet.number}</div>
          </div>
          <img src="${qrUrl}" alt="QR ${pallet.code}" style="width: 80px; height: 80px;" />
        </div>
      </div>
      <div class="grid">
        <div class="field">
          <div class="label">Peso Total</div>
          <div class="value weight-big">${pallet.totalWeight.toLocaleString('es-AR')} kg</div>
        </div>
        <div class="field">
          <div class="label">Cantidad de Cajas</div>
          <div class="value" style="font-size: 28px; font-weight: 900;">${pallet.boxCount}</div>
        </div>
        ${pallet.destination ? `<div class="field"><div class="label">Destino</div><div class="value">${pallet.destination}</div></div>` : ''}
        ${pallet.operatorName ? `<div class="field"><div class="label">Operador</div><div class="value">${pallet.operatorName}</div></div>` : ''}
        <div class="field">
          <div class="label">Fecha de Armado</div>
          <div class="value">${new Date(pallet.createdAt).toLocaleDateString('es-AR')}</div>
        </div>
      </div>

      <div class="divider"></div>

      <h3 style="font-size: 13px; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; color: #666;">Detalle de Cajas</h3>
      <table class="boxes-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Producto</th>
            <th>Calibre</th>
            <th>Categoría</th>
            <th style="text-align: right;">Peso</th>
          </tr>
        </thead>
        <tbody>
          ${boxRows}
        </tbody>
      </table>

      <div class="footer">Generado por Seedor · ${new Date().toLocaleString('es-AR')}</div>
    </div>
  `;
  openPrintWindow(html, `Pallet ${pallet.code}`);
}

/**
 * Generate tarjetones for multiple boxes in a single print page.
 */
export function printMultipleBoxTarjetones(boxes: SerializedBox[]) {
  const cards = boxes
    .map((box) => {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(box.code)}&size=80x80&format=svg`;
      return `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="logo-area" style="font-size: 11px;">Seedor</div>
            <div style="font-size: 10px; color: #666; margin-top: 2px;">Tarjetón de Caja</div>
          </div>
          <div style="text-align: right; display: flex; align-items: flex-start; gap: 8px;">
            <div class="code" style="font-size: 20px;">${box.code}</div>
            <img src="${qrUrl}" alt="QR" style="width: 50px; height: 50px;" />
          </div>
        </div>
        <div class="grid">
          <div class="field"><div class="label">Producto</div><div class="value">${box.product}</div></div>
          <div class="field"><div class="label">Calibre</div><div class="value">${box.caliber}</div></div>
          <div class="field"><div class="label">Categoría</div><div class="value">${box.category}</div></div>
          <div class="field"><div class="label">Peso</div><div class="value" style="font-size: 20px; font-weight: 900;">${box.weightKg} kg</div></div>
          ${box.producer ? `<div class="field"><div class="label">Productor</div><div class="value">${box.producer}</div></div>` : ''}
          <div class="field"><div class="label">Fecha</div><div class="value">${new Date(box.createdAt).toLocaleDateString('es-AR')}</div></div>
        </div>
      </div>`;
    })
    .join('');
  openPrintWindow(cards, `Tarjetones de Cajas (${boxes.length})`);
}
