import jsPDF from 'jspdf';

interface ReceiptData {
  paymentId: string;
  storeName: string;
  storeEmail: string | null;
  amount: number;
  monthsPaid: number;
  newExpirationDate: string;
  notes?: string | null;
}

export const generateReceiptPDF = (data: ReceiptData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [37, 99, 235]; // Blue
  const textColor: [number, number, number] = [31, 41, 55];
  const mutedColor: [number, number, number] = [107, 114, 128];
  
  let y = 20;
  
  // Header background
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Company name
  doc.setTextColor(...primaryColor);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Caiman POS Connect', pageWidth / 2, y, { align: 'center' });
  
  y += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text('Sistema de Punto de Venta', pageWidth / 2, y, { align: 'center' });
  
  // Receipt title
  y += 25;
  doc.setFillColor(...primaryColor);
  doc.rect(0, y - 5, pageWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RECIBO DE PAGO', pageWidth / 2, y + 3, { align: 'center' });
  
  // Receipt details section
  y += 25;
  doc.setTextColor(...textColor);
  
  // Folio
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Folio:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.paymentId.substring(0, 8).toUpperCase(), 60, y);
  
  // Date
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha de Emisión:', 110, y);
  doc.setFont('helvetica', 'normal');
  const now = new Date();
  doc.text(now.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }), 155, y);
  
  // Divider
  y += 10;
  doc.setDrawColor(229, 231, 235);
  doc.line(20, y, pageWidth - 20, y);
  
  // Client section
  y += 15;
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(20, y - 5, pageWidth - 40, 30, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('DATOS DEL CLIENTE', 25, y + 3);
  
  y += 12;
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Establecimiento:', 25, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.storeName, 70, y);
  
  if (data.storeEmail) {
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Email:', 25, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.storeEmail, 70, y);
  }
  
  // Concept section
  y += 25;
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(20, y - 5, pageWidth - 40, 45, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('CONCEPTO', 25, y + 3);
  
  y += 12;
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');
  doc.text('Servicio de Suscripción Sistema POS', 25, y);
  
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Período:', 25, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.monthsPaid} ${data.monthsPaid === 1 ? 'mes' : 'meses'}`, 55, y);
  
  // Amount - prominent display
  y += 25;
  doc.setFillColor(...primaryColor);
  doc.roundedRect(20, y - 5, pageWidth - 40, 25, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MONTO TOTAL:', 30, y + 8);
  
  doc.setFontSize(18);
  const formattedAmount = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(data.amount);
  doc.text(formattedAmount, pageWidth - 30, y + 10, { align: 'right' });
  
  // Expiration info
  y += 35;
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(20, y - 5, pageWidth - 40, 20, 3, 3, 'F');
  
  doc.setTextColor(22, 163, 74); // Green
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Próximo Vencimiento:', 25, y + 6);
  
  const expirationDate = new Date(data.newExpirationDate);
  doc.setFont('helvetica', 'normal');
  doc.text(expirationDate.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), 80, y + 6);
  
  // Notes if present
  if (data.notes) {
    y += 25;
    doc.setTextColor(...mutedColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(`Notas: ${data.notes}`, 20, y);
  }
  
  // Footer
  y = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(229, 231, 235);
  doc.line(20, y, pageWidth - 20, y);
  
  y += 10;
  doc.setTextColor(...mutedColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('¡Gracias por su preferencia!', pageWidth / 2, y, { align: 'center' });
  
  y += 7;
  doc.setFontSize(8);
  doc.text('Caiman POS Connect - Sistema de Punto de Venta', pageWidth / 2, y, { align: 'center' });
  
  return doc;
};

export const downloadReceiptPDF = (data: ReceiptData): void => {
  const doc = generateReceiptPDF(data);
  const fileName = `recibo-${data.paymentId.substring(0, 8)}-${data.storeName.replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
};

export const getReceiptBlobURL = (data: ReceiptData): string => {
  const doc = generateReceiptPDF(data);
  return doc.output('bloburl').toString();
};
