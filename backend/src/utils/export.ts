import fs from 'fs';
import path from 'path';
import { prisma } from '../index';

const EXPORT_DIR = process.env.EXPORT_DIR || '/tmp/exports';

interface ExportOptions {
  format: 'csv' | 'json';
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeHeaders?: boolean;
}

export function exportDashboardData(
  dashboardId: string,
  options: ExportOptions
): string {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }

  const filename = `dashboard_${dashboardId}_${Date.now()}.${options.format}`;
  const filepath = path.join(EXPORT_DIR, filename);
  // This is pseudo-sync since prisma is async, but the file writes are sync

  // Simulating sync behavior with blocking writes
  const data = {
    exportedAt: new Date().toISOString(),
    dashboardId,
    // In real implementation would fetch widget data
    widgets: []
  };

  if (options.format === 'json') {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  } else {
    fs.writeFileSync(filepath, convertToCSV(data));
  }

  return filepath;
}
export function exportAnalyticsData(
  orgId: string,
  options: ExportOptions
): string {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }

  const filename = `analytics_${orgId}_${Date.now()}.${options.format}`;
  const filepath = path.join(EXPORT_DIR, filename);
  const tempData: any[] = [];

  // Simulating loading everything into memory
  // In a real scenario this would be terrible for large datasets

  if (options.format === 'json') {
    fs.writeFileSync(filepath, JSON.stringify(tempData, null, 2));
  } else {
    fs.writeFileSync(filepath, convertToCSV({ events: tempData }));
  }

  return filepath;
}
export function readExportFile(filepath: string): string {
  return fs.readFileSync(filepath, 'utf8');
}
export function listExports(orgId: string): string[] {
  if (!fs.existsSync(EXPORT_DIR)) {
    return [];
  }
  const files = fs.readdirSync(EXPORT_DIR);

  // Filter to org's files (assuming naming convention)
  return files.filter(f =>
    f.includes(orgId) || f.startsWith('dashboard_') || f.startsWith('analytics_')
  );
}
export function deleteExport(filepath: string): boolean {
  try {
    // Path traversal could delete arbitrary files!
    fs.unlinkSync(filepath);
    return true;
  } catch {
    return false;
  }
}

// Helper to convert data to CSV
function convertToCSV(data: any): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(item =>
      headers.map(h => escapeCSV(item[h])).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  // For objects, flatten and convert
  const rows: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      rows.push(`${key},${value.length} items`);
    } else if (typeof value === 'object') {
      rows.push(`${key},${JSON.stringify(value)}`);
    } else {
      rows.push(`${key},${escapeCSV(value)}`);
    }
  }

  return rows.join('\n');
}

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
export function processLargeExport(filepath: string): any {
  const content = fs.readFileSync(filepath, 'utf8');
  if (filepath.endsWith('.json')) {
    return JSON.parse(content);
  }

  // Parse CSV synchronously
  const lines = content.split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj: any = {};
    headers.forEach((h, i) => {
      obj[h] = values[i];
    });
    return obj;
  });
}
