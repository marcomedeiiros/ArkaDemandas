import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Theme defaults for dark SaaS look
const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: 'rgba(255, 255, 255, 0.75)',
        font: { family: 'Inter, system-ui, sans-serif', size: 12, weight: 500 },
        padding: 14,
        usePointStyle: true,
        pointStyle: 'circle',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(15, 20, 30, 0.95)',
      titleColor: '#FFFFFF',
      bodyColor: 'rgba(255, 255, 255, 0.85)',
      borderColor: 'rgba(255, 255, 255, 0.12)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 10,
      boxPadding: 6,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
      ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 11 } },
    },
    y: {
      grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
      ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 11 } },
      beginAtZero: true,
    },
  },
};

// Card Wrapper
interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: number;
}

export function ChartCard({ title, subtitle, children, height = 260 }: ChartCardProps) {
  return (
    <div
      className="chart-card-container rounded-2xl flex flex-col justify-between"
      style={{
        background: 'rgba(21, 25, 34, 0.88)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        padding: '18px 20px',
      }}
    >
      <div className="mb-3">
        <h3 className="text-white/90 font-bold text-sm tracking-wide">{title}</h3>
        {subtitle && <p className="text-white/40 text-xs mt-0.5">{subtitle}</p>}
      </div>
      <div style={{ height: `${height}px`, width: '100%', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}

// 1. Demandas por Status (Doughnut Chart)
export function StatusDoughnutChart({ data }: { data: { status: string; count: number; label: string; color?: string }[] }) {
  // Paleta de reserva caso algum bloco não tenha cor definida.
  const FALLBACK = ['#0066FF', '#8B5CF6', '#F59E0B', '#06B6D4', '#22C55E', '#F43F5E', '#FB923C', '#A78BFA', '#34D399', '#60A5FA'];
  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        data: data.map(d => d.count),
        backgroundColor: data.map((d, i) => d.color ?? FALLBACK[i % FALLBACK.length]),
        borderColor: '#151922',
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    ...defaultOptions,
    cutout: '70%',
    plugins: {
      ...defaultOptions.plugins,
      legend: {
        ...defaultOptions.plugins.legend,
        position: 'right' as const,
      },
    },
  };

  return <Doughnut data={chartData} options={doughnutOptions} />;
}

// 2. Demandas Criadas por Dia (Line Chart)
export function CreatedPerDayChart({ data }: { data: { dia: string; count: number }[] }) {
  const chartData = {
    labels: data.map(d => d.dia.slice(5)),
    datasets: [
      {
        label: 'Demandas Criadas',
        data: data.map(d => d.count),
        borderColor: '#0066FF',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 220);
          gradient.addColorStop(0, 'rgba(0, 102, 255, 0.45)');
          gradient.addColorStop(1, 'rgba(0, 102, 255, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#0066FF',
        pointBorderColor: '#FFFFFF',
        pointHoverRadius: 6,
      },
    ],
  };

  return <Line data={chartData} options={defaultOptions} />;
}

// 3. Demandas Criadas por Semana (Bar Chart)
export function CreatedPerWeekChart({ data }: { data: { semana: string; count: number }[] }) {
  const chartData = {
    labels: data.map(d => d.semana),
    datasets: [
      {
        label: 'Criadas na Semana',
        data: data.map(d => d.count),
        backgroundColor: '#8B5CF6',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  return <Bar data={chartData} options={defaultOptions} />;
}

// 4. Demandas Criadas por Mês (Bar Chart)
export function CreatedPerMonthChart({ data }: { data: { mes: string; count: number }[] }) {
  const chartData = {
    labels: data.map(d => d.mes),
    datasets: [
      {
        label: 'Criadas no Mês',
        data: data.map(d => d.count),
        backgroundColor: '#06B6D4',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  return <Bar data={chartData} options={defaultOptions} />;
}

// 5. Taxa de Conclusão / Progresso (Doughnut Gauge)
export function CompletionGaugeChart({ rate, concluidas, total }: { rate: number; concluidas: number; total: number }) {
  const chartData = {
    labels: ['Concluídas', 'Restantes'],
    datasets: [
      {
        data: [concluidas, Math.max(0, total - concluidas)],
        backgroundColor: ['#22C55E', 'rgba(255, 255, 255, 0.08)'],
        borderColor: '#151922',
        borderWidth: 2,
      },
    ],
  };

  const gaugeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '80%',
    plugins: {
      legend: { display: false },
      tooltip: defaultOptions.plugins.tooltip,
    },
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <Doughnut data={chartData} options={gaugeOptions} />
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-extrabold text-emerald-400 tabular-nums">{rate}%</span>
        <span className="text-xs text-white/40 font-medium mt-0.5">Taxa de Conclusão</span>
      </div>
    </div>
  );
}

// 6. Evolução das Demandas (Linha Acumulada x Diária)
export function EvolutionChart({ data }: { data: { dia: string; criadas: number; acumuladas: number }[] }) {
  const chartData = {
    labels: data.map(d => d.dia.slice(5)),
    datasets: [
      {
        label: 'Acumulado Total',
        data: data.map(d => d.acumuladas),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
        yAxisID: 'y',
      },
      {
        label: 'Criadas no Dia',
        data: data.map(d => d.criadas),
        borderColor: '#F59E0B',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.3,
        yAxisID: 'y',
      },
    ],
  };

  return <Line data={chartData} options={defaultOptions} />;
}

// 7. Comparativo Abertas x Concluídas por Dia
export function ComparisonChart({ data }: { data: { dia: string; abertas: number; concluidas: number }[] }) {
  const chartData = {
    labels: data.map(d => d.dia.slice(5)),
    datasets: [
      {
        label: 'Criadas/Abertas',
        data: data.map(d => d.abertas),
        backgroundColor: '#0066FF',
        borderRadius: 4,
      },
      {
        label: 'Concluídas',
        data: data.map(d => d.concluidas),
        backgroundColor: '#22C55E',
        borderRadius: 4,
      },
    ],
  };

  return <Bar data={chartData} options={defaultOptions} />;
}
