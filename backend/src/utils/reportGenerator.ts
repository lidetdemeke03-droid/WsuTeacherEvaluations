// Use require to avoid missing type dependency at compile time in environments where pdfkit isn't installed yet
const PDFDocument: any = require('pdfkit');
import fs from 'fs';
import path from 'path';

interface ReportData {
  teacherName: string;
  departmentName?: string;
  periodName: string;
  courses?: string[];
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

export const generatePDF = async (
  teacherId: string,
  data: ReportData,
  type: 'print' | 'email'
): Promise<string> => {
  const safeName = `${data.teacherName.replace(/[^a-z0-9]/gi, '_')}_${data.periodName.replace(/[^a-z0-9]/gi, '_')}`;
  const fileName = `${safeName}_${type}_${Date.now()}.pdf`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // ======= HEADER =======
    if (fs.existsSync(LOGO_PATH)) {
      try {
        const logoWidth = 80;
        const logoX = (doc.page.width - logoWidth) / 2;
        const logoY = 40;
        doc.image(LOGO_PATH, logoX, logoY, { width: logoWidth });
        doc.y = logoY + 100;
      } catch (e) {}
    } else {
      doc.y = 70;
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor('#1f2937')
      .text('Wolaita Sodo University', { align: 'center' });
    doc
      .moveDown(0.4)
      .font('Helvetica')
      .fontSize(14)
      .fillColor('#2563eb')
      .text('Teacher Performance Evaluation Report', { align: 'center', underline: true });

    // Divider line
    doc.moveDown(1);
    doc
      .moveTo(60, doc.y)
      .lineTo(doc.page.width - 60, doc.y)
      .lineWidth(1.2)
      .strokeColor('#2563eb')
      .stroke();
    doc.moveDown(1);

    // ======= TEACHER INFO =======
    const teacherDisplayName = (data.teacherName || '').toUpperCase();
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#111827')
      .text(`${teacherDisplayName}`, { continued: true })
      .font('Helvetica')
      .fillColor('#374151')
      .text(`  •  ${data.departmentName || ''}`);
    doc.font('Helvetica').text(`Period: ${data.periodName}`);
    if (data.courses?.length) {
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text('Courses:');
      doc.font('Helvetica').fontSize(10).fillColor('#374151').list(data.courses.slice(0, 10));
    }
    doc.moveDown(1);

    // ======= METRICS TABLE (CENTERED, NEAT) =======
    const metrics = [
      { label: 'Student Evaluation (50%)', value: `${Math.round(data.studentAvg)}%` },
      { label: 'Peer Evaluation (35%)', value: `${Math.round(data.peerAvg)}%` },
      { label: 'Department Head (15%)', value: `${Math.round(data.deptAvg)}%` },
      { label: 'Final Weighted Score', value: `${Math.round(data.finalScore * 100) / 100}%` },
    ];

    const tableStartY = doc.y + 10;
    const tableWidth = 360; // fixed central width
    const tableX = (doc.page.width - tableWidth) / 2;
    const rowHeight = 22;

    // Background box
    const boxHeight = rowHeight * metrics.length + 30;
    doc
      .rect(tableX - 20, tableStartY - 10, tableWidth + 40, boxHeight)
      .fillOpacity(0.05)
      .fill('#2563eb')
      .fillOpacity(1);

    // Table content
    doc.font('Helvetica').fontSize(10).fillColor('#111827');
    metrics.forEach((m, i) => {
      const y = tableStartY + i * rowHeight;
      doc
        .font('Helvetica-Bold')
        .fillColor('#2563eb')
        .text(m.label, tableX, y, { width: tableWidth / 1.6 });
      doc
        .font('Helvetica')
        .fillColor('#111827')
        .text(m.value, tableX + tableWidth / 1.6 + 10, y, { width: 80, align: 'right' });
    });

    doc.y = tableStartY + boxHeight + 15;

    // ======= SUMMARY METRICS (CENTERED) =======
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#111827')
      .text('Summary Metrics', { align: 'center', underline: true });
    doc.moveDown(0.6);

    doc
      .font('Helvetica')
      .fontSize(10.5)
      .fillColor('#374151')
      .text(
        `Total Student Respondents: ${data.studentRespondents}\nTotal Peer Respondents: ${data.peerRespondents}\nEvaluation Completed On: ${new Date().toLocaleDateString()}`,
        { align: 'center' }
      );

    doc.moveDown(1.5);

    // ======= EMAIL MODE (DETAIL VIEW) =======
    if (type === 'email') {
      doc.addPage();

      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#2563eb')
        .text('📊 Performance Analytics', { align: 'center', underline: true });

      doc.moveDown(1);

      const chartWidth = doc.page.width - 160;
      const barHeight = 14;
      const gap = 18;
      const startYBar = doc.y + 10;

      const bars = [
        { label: 'Student', value: data.studentAvg, color: '#3b82f6' },
        { label: 'Peer', value: data.peerAvg, color: '#10b981' },
        { label: 'Department', value: data.deptAvg, color: '#f59e0b' },
        { label: 'Final', value: data.finalScore, color: '#ef4444' },
      ];

      bars.forEach((b, i) => {
        const y = startYBar + i * (barHeight + gap);
        doc.fontSize(10).fillColor('#111827').text(`${b.label}: ${Math.round(b.value)}%`, 80, y);
        doc.rect(180, y, (b.value / 100) * chartWidth, barHeight).fill(b.color);
      });

      doc.moveDown(4);
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#2563eb')
        .text('💬 Top Feedback Highlights', { align: 'center', underline: true });
      doc.moveDown(0.8);

      const tc = data.topComments || {};
      const writeComments = (title: string, arr?: string[]) => {
        if (!arr?.length) return;
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text(title, { align: 'left' });
        doc.font('Helvetica').fontSize(10).fillColor('#374151').list(arr.slice(0, 5));
        doc.moveDown(0.8);
      };

      writeComments('Student - Strengths', tc.studentStrengths);
      writeComments('Student - Improvements', tc.studentImprovements);
      writeComments('Peer - Strengths', tc.peerStrengths);
      writeComments('Peer - Improvements', tc.peerImprovements);
      writeComments('Department Head Comments', tc.deptComments);

      doc.moveDown(2);
      doc
        .fontSize(9)
        .fillColor('#6b7280')
        .text(`Generated by ${data.generatedByName || 'Admin'} on ${new Date().toLocaleString()}`, {
          align: 'right',
        });
    } else {
      doc.moveDown(4);
      doc
        .font('Helvetica-Oblique')
        .fontSize(9)
        .fillColor('#6b7280')
        .text(`Generated by ${data.generatedByName || 'Admin'} on ${new Date().toLocaleString()}`, {
          align: 'center',
        });
    }

    // ======= FOOTER =======
    const footerY = doc.page.height - 50;
    doc
      .moveTo(60, footerY)
      .lineTo(doc.page.width - 60, footerY)
      .strokeColor('#d1d5db')
      .lineWidth(1)
      .stroke();

    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', (err) => reject(err));
  });
};

export default { generatePDF };
