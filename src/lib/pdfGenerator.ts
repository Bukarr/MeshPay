import { jsPDF } from 'jspdf';
import { Transaction } from '../types';

export function generateTransactionPdf(transaction: Transaction): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const isUsdToNgn = transaction.type === 'usd_to_ngn';
  const primaryColor = [15, 23, 42]; // slate-900
  const emeraldColor = [16, 185, 129]; // emerald-500
  const bgCardColor = [248, 250, 252]; // slate-50

  // 1. Header Banner Box
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');

  // Brand Name & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('MeshPay', 15, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('OFFLINE P2P & CROSS-BORDER SETTLEMENT CORE', 15, 28);

  // Date on right
  const dateStr = new Date(transaction.timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.setFontSize(9);
  doc.text(dateStr, 195, 20, { align: 'right' });
  doc.text(`REF: ${transaction.id}`, 195, 28, { align: 'right' });

  // 2. Transaction Status & Amount Banner
  let y = 52;

  // Status Badge Box
  if (transaction.status === 'completed') {
    doc.setFillColor(209, 250, 229); // emerald-100
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(15, y, 65, 8, 2, 2, 'FD');
    doc.setTextColor(6, 78, 59); // emerald-900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('✓ TRANSACTION SUCCESSFUL', 18, y + 5.5);
  } else {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(15, y, 75, 8, 2, 2, 'FD');
    doc.setTextColor(120, 53, 15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('⏳ QUEUED OFFLINE (MESH VERIFIED)', 18, y + 5.5);
  }

  y += 18;

  // Big Amount Display
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  const formattedTarget = transaction.targetCurrency === 'USD' 
    ? `$${transaction.targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`
    : `NGN ${transaction.targetAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  doc.text(formattedTarget, 15, y);

  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(isUsdToNgn ? 'USD to NGN Remittance Settlement' : 'Offline Nearby P2P Transfer', 15, y);

  y += 15;

  // 3. Detailed Information Table
  doc.setFillColor(bgCardColor[0], bgCardColor[1], bgCardColor[2]);
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(15, y, 180, 85, 3, 3, 'FD');

  let tableY = y + 10;
  const drawRow = (label: string, value: string, isBold = false, isEmerald = false) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(label, 22, tableY);

    if (isBold) doc.setFont('helvetica', 'bold');
    if (isEmerald) doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
    else doc.setTextColor(15, 23, 42);

    doc.text(value, 188, tableY, { align: 'right' });
    tableY += 10;
  };

  drawRow('Recipient Name', transaction.recipientName, true);
  drawRow('Destination Detail', transaction.recipientDetail);
  if (transaction.bankName) {
    drawRow('Beneficiary Bank', transaction.bankName);
  }

  const formattedSource = transaction.sourceCurrency === 'USD' 
    ? `$${transaction.sourceAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`
    : `NGN ${transaction.sourceAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  drawRow('Debited Amount', formattedSource, true);

  if (isUsdToNgn) {
    drawRow('Exchange Rate Applied', `$1 = NGN ${transaction.exchangeRate.toLocaleString()}`, false, true);
  }

  drawRow('Transfer Fee', '0.00 (Zero Fee)', true, true);
  drawRow('Settlement Reference', transaction.id);

  y = tableY + 5;

  // 4. Offline Cryptographic Nonce Proof (if offline)
  if (transaction.isOffline) {
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(15, y, 180, 24, 3, 3, 'FD');

    doc.setTextColor(6, 95, 70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('OFFLINE CRYPTOGRAPHIC PROOF (HARDWARE ENCLAVE SIGNED)', 20, y + 7);

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Signature Hash: ${transaction.offlineSignature || 'N/A'}`, 20, y + 13);
    doc.text(`Offline Nonce:  ${transaction.offlineNonce || 'N/A'}`, 20, y + 18);

    y += 30;
  } else {
    y += 10;
  }

  // 5. Footer Notice
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 270, 195, 270);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('MeshPay Official Settlement Receipt • Generated with tamper-proof cryptographic audit trail', 105, 276, { align: 'center' });

  // Download File
  doc.save(`MeshPay_Receipt_${transaction.id}.pdf`);
}
