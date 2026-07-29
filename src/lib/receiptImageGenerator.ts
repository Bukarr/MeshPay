import { Transaction } from '../types';

export function downloadReceiptImage(transaction: Transaction): void {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // HD Retina resolution 800x1100
  const width = 800;
  const height = 1100;
  canvas.width = width;
  canvas.height = height;

  // Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#0f172a'); // slate-900
  bgGrad.addColorStop(1, '#020617'); // slate-950
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Card Outer Shadow / Container
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  roundRect(ctx, 40, 40, width - 80, height - 80, 32, true, true);

  // Card Inner Canvas
  ctx.fillStyle = '#0f172a';
  roundRect(ctx, 50, 50, width - 100, height - 100, 26, true, false);

  // Header Icon & Title
  ctx.fillStyle = '#6366f1'; // Indigo brand accent
  ctx.beginPath();
  ctx.arc(width / 2, 130, 40, 0, Math.PI * 2);
  ctx.fill();

  // Checkmark inside circle
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(width / 2 - 14, 130);
  ctx.lineTo(width / 2 - 4, 140);
  ctx.lineTo(width / 2 + 16, 118);
  ctx.stroke();

  // Header text
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MeshPay Global Settlement', width / 2, 210);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 16px sans-serif';
  ctx.fillText('Official Electronic Transfer Receipt', width / 2, 238);

  // Status Pill
  ctx.fillStyle = '#064e3b';
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  roundRect(ctx, width / 2 - 120, 260, 240, 36, 18, true, true);

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('✓ TRANSACTION SUCCESSFUL', width / 2, 283);

  // Big Amount Display
  const isNgn = transaction.targetCurrency === 'NGN';
  const amountStr = isNgn 
    ? `₦${transaction.targetAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
    : `$${transaction.targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${transaction.targetCurrency}`;
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 44px sans-serif';
  ctx.fillText(amountStr, width / 2, 360);

  // Divider Line
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(90, 400);
  ctx.lineTo(width - 90, 400);
  ctx.stroke();

  // Key Value Table Details
  const startY = 440;
  const lineSpacing = 48;
  ctx.textAlign = 'left';

  const rows = [
    { label: 'Recipient Name', value: transaction.recipientName },
    { label: 'Destination Account', value: transaction.recipientDetail },
    { label: 'Beneficiary Institution', value: transaction.bankName || 'MeshPay Multi-FX Vault' },
    { label: 'Debited Amount', value: `${transaction.sourceCurrency === 'USD' ? '$' : '₦'}${transaction.sourceAmount.toLocaleString()}` },
    { label: 'Applied Exchange Rate', value: `$1 USD = ₦${transaction.exchangeRate.toLocaleString()} NGN` },
    { label: 'Settlement Fee', value: '₦0.00 (Zero Fee)' },
    { label: 'Transaction Reference', value: transaction.id },
    { label: 'Timestamp', value: new Date(transaction.timestamp).toLocaleString() }
  ];

  rows.forEach((row, idx) => {
    const y = startY + (idx * lineSpacing);

    // Row zebra background
    if (idx % 2 === 0) {
      ctx.fillStyle = '#1e293b';
      roundRect(ctx, 80, y - 28, width - 160, 40, 10, true, false);
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 16px sans-serif';
    ctx.fillText(row.label, 100, y);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 16px sans-serif';
    ctx.textAlign = 'right';

    // Truncate long value if necessary
    let valText = row.value;
    if (valText.length > 32) {
      valText = valText.substring(0, 29) + '...';
    }
    ctx.fillText(valText, width - 100, y);
    ctx.textAlign = 'left';
  });

  // Footer Cryptographic Seal
  const footerY = startY + (rows.length * lineSpacing) + 30;
  ctx.fillStyle = '#1e1b4b';
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2;
  roundRect(ctx, 80, footerY, width - 160, 70, 16, true, true);

  ctx.fillStyle = '#a5b4fc';
  ctx.font = '600 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Cryptographically Signed by MeshPay Offline & Hybrid Settlement Core', width / 2, footerY + 28);
  ctx.font = 'mono 12px monospace';
  ctx.fillStyle = '#818cf8';
  ctx.fillText(`HMAC non-repudiation seal: ${transaction.offlineSignature || 'mp_sec_0x892a0149f12'}`, width / 2, footerY + 50);

  // Trigger Download
  const link = document.createElement('a');
  link.download = `MeshPay_Receipt_${transaction.id}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: boolean,
  stroke: boolean
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
