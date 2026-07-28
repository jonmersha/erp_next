import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface POItem {
  item_name: string;
  quantity: number;
  price: number;
}

export interface PODetails {
  id: string;
  createdAt: string;
  totalAmount: number;
  status: string;
}

export interface SupplierDetails {
  name: string;
  contact: string;
  email: string;
}

export const generatePurchaseOrderPDF = (
  poDetails: PODetails,
  supplier: SupplierDetails,
  items: POItem[],
  companyName: string = 'Acme Corp'
) => {
  const doc = new jsPDF();

  // Document Title
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text('PURCHASE ORDER', 105, 20, { align: 'center' });

  // Company Info (Left)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 14, 40);
  doc.setFont('helvetica', 'normal');
  doc.text('123 Industrial Way', 14, 45);
  doc.text('Manufacturing City, MC 12345', 14, 50);

  // PO Details (Right)
  doc.setFont('helvetica', 'bold');
  doc.text('PO Number:', 130, 40);
  doc.text('Date:', 130, 45);
  doc.text('Status:', 130, 50);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`#${poDetails.id.split('-')[0].toUpperCase()}`, 160, 40);
  doc.text(new Date(poDetails.createdAt).toLocaleDateString(), 160, 45);
  doc.text(poDetails.status.toUpperCase(), 160, 50);

  // Supplier Info (Below Company Info)
  doc.setFont('helvetica', 'bold');
  doc.text('Vendor:', 14, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(supplier.name, 14, 70);
  doc.text(supplier.contact || 'No Contact Provided', 14, 75);
  doc.text(supplier.email || 'No Email Provided', 14, 80);

  // Items Table
  const tableColumn = ["Item Description", "Quantity", "Unit Price", "Line Total"];
  const tableRows: any[] = [];

  items.forEach(item => {
    const itemData = [
      item.item_name || 'Unknown Item',
      item.quantity,
      `$${Number(item.price).toFixed(2)}`,
      `$${(item.quantity * item.price).toFixed(2)}`
    ];
    tableRows.push(itemData);
  });

  autoTable(doc, {
    startY: 90,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount:', 130, finalY + 15);
  doc.text(`$${Number(poDetails.totalAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}`, 160, finalY + 15);

  // Signatures
  doc.setFontSize(10);
  doc.text('Authorized Signature:', 14, finalY + 40);
  doc.line(14, finalY + 50, 70, finalY + 50);

  // Save the PDF
  doc.save(`PO-${poDetails.id.split('-')[0].toUpperCase()}.pdf`);
};
