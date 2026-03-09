import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Tournament, Participant } from '@/types/tournament';
import { toast } from 'sonner';

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const exportToPDF = async (tournament: Tournament) => {
    if (!exportRef.current) {
      toast.error('No se pudo exportar. Intenta de nuevo.');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading('Generando PDF...');

    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      // Agregar título
      pdf.setFontSize(16);
      pdf.text(tournament.name, 10, 10);
      pdf.setFontSize(10);
      pdf.text(`Exportado: ${new Date().toLocaleDateString()}`, 10, 15);

      pdf.addImage(imgData, 'PNG', imgX, imgY + 10, imgWidth * ratio, imgHeight * ratio);

      const fileName = `${tournament.name.replace(/\s+/g, '_')}_bracket.pdf`;
      pdf.save(fileName);

      toast.success('PDF descargado correctamente', { id: toastId });
    } catch (error) {
      console.error('Error exportando PDF:', error);
      toast.error('Error al generar PDF', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };


  const exportParticipantsToExcel = (tournament: Tournament, participants: Participant[]) => {
    setIsExporting(true);

    try {
      const csvContent = [
        ['#', 'Nombre', 'Ciudad/Club', 'Orden', 'Estado', 'Partidos Jugados', 'Victorias', 'Derrotas', 'Empates', 'Puntos a Favor', 'Puntos en Contra'],
        ...participants.map((p, i) => [
          i + 1,
          p.name,
          p.email || '-',
          p.seed || i + 1,
          p.status === 'active' ? 'Activo' : p.status === 'eliminated' ? 'Eliminado' : 'Retirado',
          p.stats?.matchesPlayed || 0,
          p.stats?.wins || 0,
          p.stats?.losses || 0,
          p.stats?.draws || 0,
          p.stats?.pointsFor || 0,
          p.stats?.pointsAgainst || 0
        ])
      ]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${tournament.name.replace(/\s+/g, '_')}_resultados.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Lista de participantes descargada');
    } catch (error) {
      console.error('Error exportando CSV:', error);
      toast.error('Error al exportar participantes');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportRef,
    isExporting,
    exportToPDF,
    exportParticipantsToExcel,
  };
}
