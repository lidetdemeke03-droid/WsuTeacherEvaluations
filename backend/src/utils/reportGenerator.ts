// Use require to avoid missing type dependency at compile time in environments where pdfkit isn't installed yet
const PDFDocument: any = require('pdfkit');
import fs from 'fs';
import path from 'path';

interface ReportData {
  teacherName: string;
  departmentName?: string;
  periodName: string;
  studentAvg: number;
  peerAvg: number;
  deptAvg: number;
  finalScore: number;
  studentRespondents: number;
  peerRespondents: number;
  topComments?: {
    studentStrengths?: string[];
    studentImprovements?: string[];
    peerStrengths?: string[];
    peerImprovements?: string[];
    deptComments?: string[];
  };
  generatedByName?: string;
}

// Ensure output directory exists
const OUTPUT_DIR = path.resolve(__dirname, '../../storage/reports');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Try locate logo from frontend HomePage import path
const LOGO_PATH = path.resolve(__dirname, '../../../pages/logo.png');

export const generatePDF = async (teacherId: string, data: ReportData, type: 'print' | 'email') : Promise<string> => {
  // File name
  const safeName = `${data.teacherName.replace(/[^a-z0-9]/gi, '_')}_${data.periodName.replace(/[^a-z0-9]/gi, '_')}`;
  const fileName = `${safeName}_${type}_${Date.now()}.pdf`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header: logo and university name
    if (fs.existsSync(LOGO_PATH)) {
      try {
        doc.image(LOGO_PATH, doc.page.width / 2 - 36, 40, { width: 72 });
      } catch (e) {
        // ignore image errors
      }
    }

    doc.fontSize(14).font('Helvetica-Bold').text('Wolaita Sodo University', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(12).font('Helvetica').text(`Teacher Performance Evaluation Report`, { align: 'center' });
    doc.moveDown(1);

    // Teacher details
    doc.fontSize(11).font('Helvetica-Bold').text(`${data.teacherName}`, { continued: true }).font('Helvetica').text(`  •  ${data.departmentName || ''}`);
    doc.text(`Period: ${data.periodName}`);
    doc.moveDown(0.5);

    // Summary table like layout
    const startX = doc.x;
    const tableY = doc.y;

    const metrics = [
      { label: 'Student Evaluation (50%)', value: `${Math.round(data.studentAvg)}%` },
      { label: 'Peer Evaluation (35%)', value: `${Math.round(data.peerAvg)}%` },
      { label: 'Department Head (15%)', value: `${Math.round(data.deptAvg)}%` },
      { label: 'Final Weighted Score', value: `${Math.round(data.finalScore * 100) / 100}%` },
    ];

    // Draw simple table
    const labelX = startX;
    const valueX = doc.page.width - doc.page.margins.right - 100;

    metrics.forEach((m) => {
      doc.font('Helvetica').fontSize(10).text(m.label, labelX, doc.y);
      doc.font('Helvetica-Bold').text(m.value, valueX, doc.y);
      doc.moveDown(0.8);
    });

    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).text(`Total Student Respondents: ${data.studentRespondents}`);
    doc.text(`Total Peer Respondents: ${data.peerRespondents}`);
    doc.text(`Evaluation Completed On: ${new Date().toLocaleDateString()}`);

    doc.moveDown(1);

    if (type === 'email') {
      // Add extra sections: comments and simple bar chart
      doc.addPage();
      doc.fontSize(12).font('Helvetica-Bold').text('📊 Analytics', { underline: true });
      doc.moveDown(0.5);

      // Simple Bar Chart
      const chartX = doc.x;
      const chartY = doc.y;
      const chartWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const barMax = 100;
      const barHeight = 12;
      const gap = 10;

      const bars = [
        { label: 'Student', value: data.studentAvg },
        { label: 'Peer', value: data.peerAvg },
        { label: 'Dept', value: data.deptAvg },
        { label: 'Final', value: data.finalScore }
      ];

      bars.forEach(b => {
        doc.font('Helvetica').fontSize(10).text(`${b.label}: ${Math.round(b.value)}%`);
        const currentY = doc.y + 2;
        const width = Math.max((b.value / barMax) * (chartWidth - 120), 10);
        doc.rect(doc.x + 100, currentY, width, barHeight).fill('#3b82f6');
        doc.fillColor('black');
        doc.moveDown(1.6);
      });

      doc.moveDown(1);
      doc.fontSize(12).font('Helvetica-Bold').text('💬 Feedback', { underline: true });
      doc.moveDown(0.5);

      const tc = data.topComments || {};
      const writeComments = (title: string, arr?: string[]) => {
        if (!arr || arr.length === 0) return;
        doc.font('Helvetica-Bold').fontSize(10).text(title);
        doc.font('Helvetica').fontSize(10).list(arr.slice(0,5));
        doc.moveDown(0.5);
      };

      writeComments('Student - Strengths', tc.studentStrengths);
      writeComments('Student - Improvements', tc.studentImprovements);
      writeComments('Peer - Strengths', tc.peerStrengths);
      writeComments('Peer - Improvements', tc.peerImprovements);
      writeComments('Department Head Comments', tc.deptComments);

      doc.moveDown(1);
      doc.fontSize(10).text('Generated by ' + (data.generatedByName || 'Admin') + ' on ' + new Date().toLocaleString());
    } else {
      doc.moveDown(2);
      doc.fontSize(10).text('Footer: Generated by ' + (data.generatedByName || 'Admin') + ' on ' + new Date().toLocaleString());
    }

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', (err) => reject(err));
  });
};

export default { generatePDF };
