import { Chart, registerables } from 'chart.js';
import { Canvas } from 'canvas';

// Register Chart.js components
Chart.register(...registerables);

export interface SprintChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface VelocityChartData {
  sprints: string[];
  completed: number[];
  estimated: number[];
  velocity: number[];
}

export class ChartGenerator {
  private static readonly COLORS = {
    primary: '#1e40af',
    secondary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    light: '#f3f4f6',
    dark: '#374151'
  };

  /**
   * Generate a velocity chart showing completed vs estimated story points
   */
  static async generateVelocityChart(data: VelocityChartData): Promise<Buffer> {
    const canvas = new Canvas(600, 400);
    const ctx = canvas.getContext('2d');

    const chart = new Chart(ctx as any, {
      type: 'bar',
      data: {
        labels: data.sprints,
        datasets: [
          {
            label: 'Completed Points',
            data: data.completed,
            backgroundColor: this.COLORS.success,
            borderColor: this.COLORS.success,
            borderWidth: 1
          },
          {
            label: 'Estimated Points',
            data: data.estimated,
            backgroundColor: this.COLORS.primary,
            borderColor: this.COLORS.primary,
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Sprint Velocity Overview',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Story Points'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Sprint'
            }
          }
        }
      }
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        const buffer = canvas.toBuffer('image/png');
        chart.destroy();
        resolve(buffer);
      }, 100);
    });
  }

  /**
   * Generate a pie chart for epic breakdown
   */
  static async generateEpicBreakdownChart(data: SprintChartData): Promise<Buffer> {
    const canvas = new Canvas(500, 400);
    const ctx = canvas.getContext('2d');

    const chart = new Chart(ctx as any, {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.datasets[0].data,
          backgroundColor: [
            this.COLORS.primary,
            this.COLORS.secondary,
            this.COLORS.success,
            this.COLORS.warning,
            this.COLORS.danger
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Epic Breakdown',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'right'
          }
        }
      }
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        const buffer = canvas.toBuffer('image/png');
        chart.destroy();
        resolve(buffer);
      }, 100);
    });
  }

  /**
   * Generate a line chart for quality metrics over time
   */
  static async generateQualityTrendChart(data: SprintChartData): Promise<Buffer> {
    const canvas = new Canvas(600, 400);
    const ctx = canvas.getContext('2d');

    const chart = new Chart(ctx as any, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: data.datasets[0].label,
          data: data.datasets[0].data,
          borderColor: this.COLORS.primary,
          backgroundColor: this.COLORS.primary + '20',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Quality Metrics Trend',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Quality Score (%)'
            }
          }
        }
      }
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        const buffer = canvas.toBuffer('image/png');
        chart.destroy();
        resolve(buffer);
      }, 100);
    });
  }

  /**
   * Generate a radar chart for team performance metrics
   */
  static async generateTeamPerformanceChart(data: SprintChartData): Promise<Buffer> {
    const canvas = new Canvas(500, 500);
    const ctx = canvas.getContext('2d');

    const chart = new Chart(ctx as any, {
      type: 'radar',
      data: {
        labels: data.labels,
        datasets: [{
          label: data.datasets[0].label,
          data: data.datasets[0].data,
          backgroundColor: this.COLORS.primary + '40',
          borderColor: this.COLORS.primary,
          borderWidth: 2,
          pointBackgroundColor: this.COLORS.primary,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Team Performance Overview',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20
            }
          }
        }
      }
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        const buffer = canvas.toBuffer('image/png');
        chart.destroy();
        resolve(buffer);
      }, 100);
    });
  }
} 