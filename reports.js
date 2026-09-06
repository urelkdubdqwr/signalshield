import crypto from 'node:crypto';

const reports = new Map();

export function createReport(report) {
  const id = crypto.createHash('sha256').update(`${Date.now()}:${JSON.stringify(report)}`).digest('hex').slice(0, 12);
  reports.set(id, report);
  return id;
}

export function getReport(id) {
  return reports.get(id) || null;
}
