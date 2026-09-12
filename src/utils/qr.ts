import QRCode from 'qrcode';

export async function createQRCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 340,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('QR code generation failed:', err);
    return '';
  }
}

// Generate UPI payment URI
export function generateUPIUri(params: {
  upiId: string;
  payeeName: string;
  amount: number;
  currency?: string;
  transactionNote?: string;
}): string {
  const { upiId, payeeName, amount, currency = 'INR', transactionNote = 'Event Registration' } = params;
  const encodedName = encodeURIComponent(payeeName);
  const encodedNote = encodeURIComponent(transactionNote);
  return `upi://pay?pa=${upiId}&pn=${encodedName}&am=${amount}&cu=${currency}&tn=${encodedNote}`;
}
