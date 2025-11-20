import { IEntityItem } from "../interfaces/IEntity";
import { IPayout } from "../interfaces/IPayout";

export const onDownloadReceipt = async (entity: IEntityItem, item: IPayout ) => {

  try {
    // show("Generating Receipt",  "Your payout receipt is being prepared...", "info",
    // );

    // Generate receipt content using the item data
    const receiptContent = generateReceiptContent(item);
    
    // Create PDF blob (you can use a PDF generation library like jsPDF)
    // For this example, I'll show both PDF and HTML approaches
    
    // Option 1: Generate PDF using jsPDF (if you have it installed)
    // const pdfBlob = await generatePDFReceipt(item, receiptContent);
    
    // Option 2: Generate HTML receipt that can be printed
    const htmlReceipt = generateHTMLReceipt(entity, item, receiptContent);
    
    // For HTML approach - open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlReceipt);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load then trigger print
      setTimeout(() => {
        printWindow.print();
        // Optional: close window after print
        // setTimeout(() => printWindow.close(), 1000);
      }, 500);
    }


  } catch (error: any) {
    console.error("Error generating payout receipt:", error);
  }
};

// Helper function to generate receipt content from item data
const generateReceiptContent = (item: IPayout) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return {
    reference: item.reference,
    accountName: item.payout_account.account_name,
    accountNumber: item.payout_account.account_number,
    bank: item.payout_account.bank,
    accountType: item.payout_account.account_type,
    amount: `${item.currency} ${parseFloat(item.amount).toLocaleString()}`,
    status: item.status,
    requestDate: formatDate(item.created),
    completionDate: item.time_completed ? formatDate(item.time_completed) : 'N/A',
    requestNote: item.request_note || 'No additional notes'
  };
};

// Generate HTML receipt for printing
const generateHTMLReceipt = (entity: IEntityItem, item: IPayout, content: any) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payout Receipt - ${content.reference}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 40px; 
          color: #333;
          line-height: 1.6;
        }
        .receipt-container {
          max-width: 600px;
          margin: 0 auto;
          border: 2px solid #000;
          padding: 30px;
          background: #fff;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .receipt-title {
          font-size: 20px;
          color: #666;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-weight: bold;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
          margin-bottom: 10px;
          font-size: 16px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .label {
          font-weight: bold;
          color: #666;
        }
        .value {
          text-align: right;
        }
        .status-${item.status.toLowerCase()} {
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 12px;
          display: inline-block;
        }
        .status-successful { background: #d4edda; color: #155724; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 12px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div class="company-name">${entity.name || 'Entity Name'}</div>
          <div class="receipt-title">PAYOUT RECEIPT</div>
        </div>
        
        <div class="section">
          <div class="section-title">Transaction Details</div>
          <div class="row">
            <span class="label">Reference Number:</span>
            <span class="value">${content.reference}</span>
          </div>
          <div class="row">
            <span class="label">Date & Time:</span>
            <span class="value">${content.requestDate}</span>
          </div>
          <div class="row">
            <span class="label">Status:</span>
            <span class="value">
              <span class="status-${content.status.toLowerCase()}">${content.status}</span>
            </span>
          </div>
          ${content.completionDate !== 'N/A' ? `
          <div class="row">
            <span class="label">Completed:</span>
            <span class="value">${content.completionDate}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="section">
          <div class="section-title">Payment Details</div>
          <div class="row">
            <span class="label">Amount:</span>
            <span class="value" style="font-size: 18px; font-weight: bold;">${content.amount}</span>
          </div>
          <div class="row">
            <span class="label">Account Name:</span>
            <span class="value">${content.accountName}</span>
          </div>
          <div class="row">
            <span class="label">Account Number:</span>
            <span class="value">${content.accountNumber}</span>
          </div>
          <div class="row">
            <span class="label">Bank:</span>
            <span class="value">${content.bank}</span>
          </div>
          <div class="row">
            <span class="label">Account Type:</span>
            <span class="value">${content.accountType}</span>
          </div>
        </div>
        
        ${content.requestNote !== 'No additional notes' ? `
        <div class="section">
          <div class="section-title">Additional Notes</div>
          <div>${content.requestNote}</div>
        </div>
        ` : ''}
        
        <div class="footer">
          <div>This is an computer-generated receipt. No signature is required.</div>
          <div>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Print Receipt
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
            Close Window
          </button>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const convertToCSV = async (data: any[], headers: { key: string; label: string }[]) => {
  const csvHeaders = headers.map(header => header.label).join(',');
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = getNestedValue(row, header.key);
      // Escape quotes and wrap in quotes if contains comma or quotes
      const escapedValue = String(value || '').replace(/"/g, '""');
      return escapedValue.includes(',') ? `"${escapedValue}"` : escapedValue;
    }).join(',');
  }).join('\n');

  return `${csvHeaders}\n${csvRows}`;
};

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : '';
  }, obj);
};

export const downloadCSV = async (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
