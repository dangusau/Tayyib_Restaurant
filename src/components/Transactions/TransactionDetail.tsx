import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Transaction, PurchaseItem, Expense } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatting';
import Button from '../Common/Button';

type TransactionWithRelations = Transaction & {
  purchase_items: PurchaseItem[];
  expenses: Expense[];
};

// Helper to load an image and return a base64 data URL
async function getBase64Image(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const [txn, setTxn] = useState<TransactionWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, purchase_items(*), expenses(*)')
        .eq('id', id)
        .single();

      if (!error && data) {
        setTxn(data as TransactionWithRelations);
      }
      setLoading(false);
    }
    fetch();
  }, [id]);

  const generatePDF = useCallback(async () => {
    if (!txn) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = margin;

    // ---------- Logo & Header ----------
    try {
      const logoBase64 = await getBase64Image('/tayyib.jpg');
      doc.addImage(logoBase64, 'JPEG', margin, yPos, 25, 10);   // 25mm wide, 10mm high
    } catch {
      // If logo fails to load, just continue without it
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Tayyib Restaurant', margin + 28, yPos + 7);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Transaction Receipt`, margin + 28, yPos + 13);
    yPos += 20;

    // ---------- Summary Table ----------
    const summaryRows = [
      ['Date', formatDate(txn.transaction_date)],
      ['Type', txn.pos_total < 0 ? 'Expense' : 'Transaction'],
      ['POS Total', formatCurrency(txn.pos_total)],
      ['Meal Tickets', txn.meal_tickets.toString()],
      ['Cash Received', formatCurrency(txn.cash_received)],
      ['Previous Balance', formatCurrency(txn.previous_balance)],
      ['Total Spent', formatCurrency(txn.total_spent)],
      ['Cash Balance', formatCurrency(txn.cash_balance)],
    ];
    if (txn.notes) summaryRows.push(['Notes', txn.notes]);

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      body: summaryRows,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 35 },
        1: { cellWidth: 'auto' },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;

    // ---------- Purchase Items (if any) ----------
    if (txn.purchase_items && txn.purchase_items.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Purchase Items', margin, yPos);
      yPos += 6;

      autoTable(doc, {
        startY: yPos,
        margin: { left: margin, right: margin },
        head: [['Item', 'Qty', 'Unit', 'Unit Price', 'Total']],
        body: txn.purchase_items.map((item) => [
          item.item_name,
          item.quantity.toString(),
          item.unit,
          formatCurrency(item.unit_price),
          formatCurrency(item.total_price!),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [128, 0, 32] }, // primary maroon
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { halign: 'center', cellWidth: 15 },
          2: { halign: 'center', cellWidth: 20 },
          3: { halign: 'right', cellWidth: 25 },
          4: { halign: 'right', cellWidth: 25 },
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // ---------- Expenses ----------
    if (txn.expenses && txn.expenses.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Expenses', margin, yPos);
      yPos += 6;

      autoTable(doc, {
        startY: yPos,
        margin: { left: margin, right: margin },
        head: [['Description', 'Category', 'Amount']],
        body: txn.expenses.map((exp) => [
          exp.description,
          exp.category,
          formatCurrency(exp.amount),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [128, 0, 32] },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { halign: 'center', cellWidth: 30 },
          2: { halign: 'right', cellWidth: 25 },
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // ---------- Footer ----------
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} by Tayyib Restaurant`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );

    // Save the PDF
    doc.save(`tayyib-transaction-${txn.id.slice(0, 8)}.pdf`);
  }, [txn]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!txn) {
    return <div className="p-8 text-center">Transaction not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Link to="/transactions">
          <Button variant="secondary">← Back to List</Button>
        </Link>
        <Button variant="primary" onClick={generatePDF}>
          Download PDF
        </Button>
      </div>

      {/* Visual receipt – same as before */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow space-y-4">
        {/* … (keep the existing visual receipt unchanged) … */}
        <div className="border-b pb-3 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Transaction Receipt</h2>
            <p className="text-sm text-gray-500">{formatDate(txn.transaction_date)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">ID: {txn.id.slice(0, 8)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><span className="text-xs text-gray-500">POS Total</span><p className="font-medium">{formatCurrency(txn.pos_total)}</p></div>
          <div><span className="text-xs text-gray-500">Meal Tickets</span><p className="font-medium">{txn.meal_tickets}</p></div>
          <div><span className="text-xs text-gray-500">Cash Received</span><p className="font-medium">{formatCurrency(txn.cash_received)}</p></div>
          <div><span className="text-xs text-gray-500">Prev. Balance</span><p className="font-medium">{formatCurrency(txn.previous_balance)}</p></div>
          <div><span className="text-xs text-gray-500">Total Spent</span><p className="font-medium">{formatCurrency(txn.total_spent)}</p></div>
          <div><span className="text-xs text-gray-500">Cash Balance</span><p className="font-medium text-primary">{formatCurrency(txn.cash_balance)}</p></div>
          {txn.notes && <div className="col-span-2"><span className="text-xs text-gray-500">Notes</span><p className="text-sm">{txn.notes}</p></div>}
        </div>

        {txn.purchase_items && txn.purchase_items.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2">Purchase Items</h3>
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left">Item</th>
                  <th className="px-2 py-1">Qty</th>
                  <th className="px-2 py-1">Unit</th>
                  <th className="px-2 py-1">Price</th>
                  <th className="px-2 py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {txn.purchase_items.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-2 py-1">{item.item_name}</td>
                    <td className="px-2 py-1 text-center">{item.quantity}</td>
                    <td className="px-2 py-1 text-center">{item.unit}</td>
                    <td className="px-2 py-1 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="px-2 py-1 text-right font-medium">{formatCurrency(item.total_price!)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {txn.expenses && txn.expenses.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2">Expenses</h3>
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left">Description</th>
                  <th className="px-2 py-1">Category</th>
                  <th className="px-2 py-1">Amount</th>
                </tr>
              </thead>
              <tbody>
                {txn.expenses.map((ex, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-2 py-1">{ex.description}</td>
                    <td className="px-2 py-1 text-center">{ex.category}</td>
                    <td className="px-2 py-1 text-right font-medium">{formatCurrency(ex.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}