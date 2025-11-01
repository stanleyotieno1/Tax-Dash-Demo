import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-risk-analysis',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './risk-analysis.html',
  styleUrls: ['./risk-analysis.scss']
})
export class RiskAnalysis implements OnInit, AfterViewInit {
  private riskTrendChart: Chart | null = null;
  private sparklineChart: Chart | null = null;

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initRiskTrendChart();
    this.initSparklineChart();
  }

  private initRiskTrendChart(): void {
    const canvas = document.getElementById('riskTrendChart') as HTMLCanvasElement;
   if (!(canvas instanceof HTMLCanvasElement)) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.riskTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Turnover',
            data: [45, 52, 48, 65, 68, 72, 70, 68, 65, 62, 58, 55],
            borderColor: '#FFA502',
            backgroundColor: 'rgba(255, 165, 2, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#FFA502',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          {
            label: 'Payroll',
            data: [20, 22, 21, 23, 24, 25, 24, 23, 22, 21, 20, 19],
            borderColor: '#00B894',
            backgroundColor: 'rgba(0, 184, 148, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#00B894',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          {
            label: 'VAT',
            data: [55, 58, 62, 68, 75, 78, 82, 85, 88, 86, 83, 80],
            borderColor: '#FF6B6B',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#FF6B6B',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          {
            label: 'Refunds',
            data: [30, 32, 35, 38, 42, 45, 48, 50, 52, 54, 56, 58],
            borderColor: '#6C5CE7',
            backgroundColor: 'rgba(108, 92, 231, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#6C5CE7',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(45, 52, 54, 0.95)',
            padding: 12,
            borderColor: '#E8EBF0',
            borderWidth: 1,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            displayColors: true,
            boxPadding: 6,
            callbacks: {
              label: (context) => {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += context.parsed.y + ' Risk Index';
                return label;
              },
              afterLabel: (context) => {
                const value = context.parsed.y ?? 0;
                if (value >= 70) return '🔴 High Risk';
                if (value >= 40) return '🟡 Medium Risk';
                return '🟢 Low Risk';
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 12,
                weight: 500
              },
              color: '#636E72'
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: '#F8F9FC',
              lineWidth: 1
            },
            ticks: {
              font: {
                size: 12,
                weight: 500
              },
              color: '#636E72',
              callback: (value) => value + ''
            }
          }
        }
      }
    });
  }

  private initSparklineChart(): void {
    const canvas = document.getElementById('sparklineChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.sparklineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Risk Score',
            data: [65, 68, 62, 70, 68, 65, 62],
            borderColor: '#6C5CE7',
            backgroundColor: 'rgba(108, 92, 231, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#6C5CE7',
            pointBorderColor: '#fff',
            pointBorderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(45, 52, 54, 0.95)',
            padding: 8,
            titleFont: {
              size: 12
            },
            bodyFont: {
              size: 11
            },
            displayColors: false
          }
        },
        scales: {
          x: {
            display: false
          },
          y: {
            display: false,
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.riskTrendChart) {
      this.riskTrendChart.destroy();
    }
    if (this.sparklineChart) {
      this.sparklineChart.destroy();
    }
  }
}