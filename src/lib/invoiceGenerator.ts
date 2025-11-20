import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
}

interface InvoiceData {
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  paymentMethod?: string;
  date: string;
}

export const generateInvoicePDF = (data: InvoiceData): jsPDF => {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(79, 70, 229); // Indigo
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('INVOICE', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('Dynamic Product Intelligence', 105, 30, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Invoice details
  doc.setFontSize(10);
  doc.text(`Invoice #: ${data.orderNumber}`, 20, 50);
  doc.text(`Date: ${new Date(data.date).toLocaleDateString('en-IN')}`, 20, 56);
  
  if (data.customerName) {
    doc.text(`Customer: ${data.customerName}`, 20, 62);
  }
  if (data.customerPhone) {
    doc.text(`Phone: ${data.customerPhone}`, 20, 68);
  }
  
  // Items table
  const tableData = data.items.map(item => [
    item.product_name,
    item.quantity.toString(),
    `₹${item.unit_price.toFixed(2)}`,
    `${item.tax_rate}%`,
    `₹${item.tax_amount.toFixed(2)}`,
    `₹${item.total_amount.toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: 75,
    head: [['Product', 'Qty', 'Price', 'Tax Rate', 'Tax', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' }
    }
  });
  
  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.text(`Subtotal:`, 140, finalY);
  doc.text(`₹${data.subtotal.toFixed(2)}`, 190, finalY, { align: 'right' });
  
  doc.text(`GST/Tax:`, 140, finalY + 6);
  doc.text(`₹${data.taxAmount.toFixed(2)}`, 190, finalY + 6, { align: 'right' });
  
  if (data.discount > 0) {
    doc.text(`Discount:`, 140, finalY + 12);
    doc.text(`-₹${data.discount.toFixed(2)}`, 190, finalY + 12, { align: 'right' });
  }
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  const totalY = data.discount > 0 ? finalY + 18 : finalY + 12;
  doc.text(`Total Amount:`, 140, totalY);
  doc.text(`₹${data.totalAmount.toFixed(2)}`, 190, totalY, { align: 'right' });
  
  // Payment method
  if (data.paymentMethod) {
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Payment Method: ${data.paymentMethod}`, 140, totalY + 8);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for your business!', 105, 280, { align: 'center' });
  doc.text('This is a GST-compliant invoice', 105, 285, { align: 'center' });
  
  return doc;
};

export const downloadInvoice = (data: InvoiceData) => {
  const doc = generateInvoicePDF(data);
  doc.save(`invoice-${data.orderNumber}.pdf`);
};

export const getInvoiceBase64 = (data: InvoiceData): string => {
  const doc = generateInvoicePDF(data);
  return doc.output('datauristring').split(',')[1];
};
