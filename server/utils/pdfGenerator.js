/**
 * PDF Report Generator
 * Generates downloadable compliance report PDFs using PDFKit.
 */

const PDFDocument = require('pdfkit');

/**
 * Generate a PDF buffer from a compliance report object
 * @param {Object} report - Compliance report from complianceEngine
 * @returns {Promise<Buffer>} PDF file buffer
 */
function generatePDF(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const orange = '#E97C00';
    const dark = '#1A1A1A';
    const gray = '#666666';
    const lightGray = '#999999';

    // ── Header ──────────────────────────────────────────
    doc.fontSize(24).fillColor(orange).text('TAUMOEBA FILTER', { align: 'center' });
    doc.fontSize(11).fillColor(gray).text('Compliance-Driven Food Waste Management System', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(14).fillColor(dark).text('Compliance Report', { align: 'center' });
    doc.moveDown(0.8);

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(2).stroke(orange);
    doc.moveDown(0.8);

    // ── Report Metadata ─────────────────────────────────
    doc.fontSize(9).fillColor(lightGray);
    doc.text(`Report ID: ${report.reportId}`, 50);
    doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`);
    doc.text(`Compliance Status: ${report.complianceStatus}`);
    doc.moveDown(1);

    // ── Section: Batch Information ──────────────────────
    sectionHeader(doc, 'Batch Information', orange);
    infoLine(doc, 'Batch ID', report.batch.batchId);
    infoLine(doc, 'Status', report.batch.status.toUpperCase());
    infoLine(doc, 'Created', new Date(report.batch.createdAt).toLocaleString());
    doc.moveDown(0.8);

    // ── Section: Donor Information ──────────────────────
    sectionHeader(doc, 'Donor Information', orange);
    infoLine(doc, 'Business Name', report.donor.businessName);
    infoLine(doc, 'Business Type', report.donor.businessType);
    infoLine(doc, 'Location', report.donor.location);
    infoLine(doc, 'Email', report.donor.email);
    doc.moveDown(0.8);

    // ── Section: Food Details ───────────────────────────
    sectionHeader(doc, 'Food Details', orange);
    infoLine(doc, 'Category', report.foodDetails.category.toUpperCase());
    infoLine(doc, 'Quantity', `${report.foodDetails.quantity} meals`);
    infoLine(doc, 'Prepared At', new Date(report.foodDetails.preparationTime).toLocaleString());
    infoLine(doc, 'Expires At', new Date(report.foodDetails.expiryTime).toLocaleString());
    doc.moveDown(0.8);

    // ── Section: Risk Assessment ────────────────────────
    sectionHeader(doc, 'Risk Assessment', orange);
    const riskColor =
      report.riskAssessment.riskLevel === 'LOW' ? '#22C55E' :
      report.riskAssessment.riskLevel === 'MEDIUM' ? '#F59E0B' : '#EF4444';
    doc.fontSize(12).fillColor(riskColor).text(`Risk Level: ${report.riskAssessment.riskLevel}`);
    doc.fontSize(10).fillColor(dark).text(report.riskAssessment.classification);
    doc.moveDown(0.8);

    // ── Section: Cost Estimation ────────────────────────
    sectionHeader(doc, 'Cost Estimation', orange);
    infoLine(doc, 'Cost per Meal', `₹${report.costEstimate.costPerMeal}`);
    infoLine(doc, 'Total Value', `₹${report.costEstimate.totalValue}`);
    doc.moveDown(0.8);

    // ── Section: Proof Record ───────────────────────────
    sectionHeader(doc, 'Proof Record', orange);
    infoLine(doc, 'Image URL', report.proof.imageUrl);
    infoLine(doc, 'Timestamp', new Date(report.proof.timestamp).toLocaleString());
    infoLine(doc, 'Immutable', report.proof.immutable ? 'Yes' : 'No');
    doc.moveDown(1.5);

    // ── Footer ──────────────────────────────────────────
    doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1).stroke(orange);
    doc.moveDown(0.5);
    doc.fontSize(7).fillColor(lightGray).text(report.disclaimer, { align: 'center' });

    doc.end();
  });
}

function sectionHeader(doc, title, color) {
  doc.fontSize(13).fillColor(color).text(title);
  doc.moveDown(0.2);
}

function infoLine(doc, label, value) {
  doc.fontSize(10).fillColor('#333333').text(`${label}: `, { continued: true });
  doc.fillColor('#1A1A1A').text(String(value));
}

module.exports = { generatePDF };
