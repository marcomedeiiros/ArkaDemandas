import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Stats } from '../types';

export async function exportDashboardPdf(stats: Stats | null, periodLabel: string = 'Todos') {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Header Background Accent
    doc.setFillColor(15, 18, 24);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Title Bar
    doc.setFillColor(0, 102, 255);
    doc.rect(margin, margin, pageWidth - margin * 2, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('ARKA TECNOLOGIA', margin, margin + 12);

    doc.setFontSize(14);
    doc.setTextColor(77, 148, 255);
    doc.text('Relatório Executivo de Demandas & Métricas', margin, margin + 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}  |  Período: ${periodLabel}`, margin, margin + 27);

    let currentY = margin + 35;

    // ── Section 1: KPI Summary Cards ──
    if (stats) {
      doc.setFillColor(21, 25, 34);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, 25, 3, 3, 'F');

      const kpis = [
        { label: 'Total', value: stats.total, color: [244, 63, 94] },
        { label: 'Novas', value: stats.novas, color: [0, 102, 255] },
        { label: 'Andamento', value: stats.emAndamento, color: [139, 92, 246] },
        { label: 'Aguardando', value: stats.aguardando, color: [245, 158, 11] },
        { label: 'Revisão', value: stats.emRevisao, color: [6, 182, 212] },
        { label: 'Concluídas', value: stats.concluidas, color: [34, 197, 94] },
        { label: 'Taxa Conclusão', value: `${stats.taxaConclusao}%`, color: [74, 222, 128] },
      ];

      const cardWidth = (pageWidth - margin * 2 - (kpis.length - 1) * 3) / kpis.length;
      kpis.forEach((kpi, i) => {
        const x = margin + i * (cardWidth + 3);
        doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(String(kpi.value), x + cardWidth / 2, currentY + 12, { align: 'center' });

        doc.setTextColor(160, 160, 160);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(kpi.label, x + cardWidth / 2, currentY + 19, { align: 'center' });
      });

      currentY += 32;
    }

    // ── Section 2: Capture Dashboard Charts from HTML Canvas ──
    const dashboardContainer = document.getElementById('dashboard-container');
    
    if (dashboardContainer) {
      // Find all chart cards / canvas elements
      const chartCards = dashboardContainer.querySelectorAll<HTMLElement>('.glass-card, .chart-card-container');

      if (chartCards.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text('Gráficos e Análises Visuais (Chart.js)', margin, currentY);
        currentY += 6;

        let itemsOnRow = 0;
        const gridWidth = (pageWidth - margin * 2 - 8) / 2; // 2 columns
        const gridHeight = 58;

        for (let i = 0; i < chartCards.length; i++) {
          const cardEl = chartCards[i];
          
          try {
            const canvas = await html2canvas(cardEl, {
              scale: 2,
              backgroundColor: '#151922',
              logging: false,
              useCORS: true,
            });

            const imgData = canvas.toDataURL('image/png');
            const col = itemsOnRow % 2;
            const x = margin + col * (gridWidth + 8);

            // Check if page overflow
            if (currentY + gridHeight > pageHeight - margin) {
              doc.addPage();
              doc.setFillColor(15, 18, 24);
              doc.rect(0, 0, pageWidth, pageHeight, 'F');
              currentY = margin + 10;
              itemsOnRow = 0;
            }

            doc.addImage(imgData, 'PNG', x, currentY, gridWidth, gridHeight);

            if (col === 1) {
              currentY += gridHeight + 6;
            }
            itemsOnRow++;
          } catch (err) {
            console.error('Error capturing chart card:', err);
          }
        }
      }
    }

    doc.save(`Relatorio-Demandas-ARKA-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar relatório em PDF. Certifique-se de que os gráficos estão visíveis.');
  }
}
