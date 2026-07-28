import { Router, Request, Response } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import * as demandService from '../services/demandService.js';
import type { Demand } from '../types.js';
import { COLUMN_LABELS } from '../types.js';

export const exportRouter = Router();

function getDemandsForExport(): Demand[] {
  return demandService.getAllDemands();
}

exportRouter.get('/csv', (_req: Request, res: Response) => {
  const demands = getDemandsForExport();
  const headers = ['ID', 'Título', 'Cliente', 'Responsável', 'Categoria', 'Prioridade', 'Status', 'Data Criação', 'Prazo', 'Data Conclusão', 'Observações'];
  const rows = demands.map(d => [
    d.id, d.titulo, d.cliente, d.responsavel, d.categoria, d.prioridade,
    COLUMN_LABELS[d.status], d.data_criacao, d.prazo ?? '', d.data_conclusao ?? '', d.observacoes
  ]);

  const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const bom = '\uFEFF';

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=demandas-arka.csv');
  res.send(bom + csv);
});

exportRouter.get('/excel', async (_req: Request, res: Response) => {
  const demands = getDemandsForExport();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Demandas ARKA');

  sheet.columns = [
    { header: 'ID', key: 'id', width: 18 },
    { header: 'Título', key: 'titulo', width: 30 },
    { header: 'Cliente', key: 'cliente', width: 20 },
    { header: 'Responsável', key: 'responsavel', width: 20 },
    { header: 'Categoria', key: 'categoria', width: 15 },
    { header: 'Prioridade', key: 'prioridade', width: 12 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Data Criação', key: 'data_criacao', width: 14 },
    { header: 'Prazo', key: 'prazo', width: 14 },
    { header: 'Data Conclusão', key: 'data_conclusao', width: 14 },
    { header: 'Observações', key: 'observacoes', width: 30 },
  ];

  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066FF' } };

  demands.forEach(d => {
    sheet.addRow({
      id: d.id,
      titulo: d.titulo,
      cliente: d.cliente,
      responsavel: d.responsavel,
      categoria: d.categoria,
      prioridade: d.prioridade,
      status: COLUMN_LABELS[d.status],
      data_criacao: d.data_criacao,
      prazo: d.prazo ?? '',
      data_conclusao: d.data_conclusao ?? '',
      observacoes: d.observacoes,
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=demandas-arka.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

exportRouter.get('/pdf', (_req: Request, res: Response) => {
  const demands = getDemandsForExport();
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=demandas-arka.pdf');
  doc.pipe(res);

  doc.fontSize(20).fillColor('#0066FF').text('ARKA TECNOLOGIA - Relatório de Demandas', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).fillColor('#333').text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
  doc.moveDown(2);

  const colWidths = [70, 120, 80, 80, 60, 55, 70, 65, 65];
  const headers = ['ID', 'Título', 'Cliente', 'Responsável', 'Categoria', 'Prioridade', 'Status', 'Criação', 'Prazo'];
  let y = doc.y;

  doc.fontSize(8).fillColor('#FFFFFF');
  let x = 40;
  headers.forEach((h, i) => {
    doc.rect(x, y, colWidths[i], 18).fill('#0066FF');
    doc.fillColor('#FFFFFF').text(h, x + 2, y + 5, { width: colWidths[i] - 4 });
    x += colWidths[i];
  });

  y += 18;
  demands.forEach((d, idx) => {
    if (y > 520) {
      doc.addPage();
      y = 40;
    }
    const bg = idx % 2 === 0 ? '#F5F5F5' : '#FFFFFF';
    x = 40;
    const values = [d.id, d.titulo, d.cliente, d.responsavel, d.categoria, d.prioridade, COLUMN_LABELS[d.status], d.data_criacao, d.prazo ?? ''];
    values.forEach((v, i) => {
      doc.rect(x, y, colWidths[i], 16).fill(bg);
      doc.fillColor('#333').text(String(v).substring(0, 25), x + 2, y + 4, { width: colWidths[i] - 4 });
      x += colWidths[i];
    });
    y += 16;
  });

  doc.end();
});
