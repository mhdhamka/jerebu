import DOMPurify from 'dompurify';

/**
 * Sanitizes user input string using DOMPurify with strict HTML tags filtering.
 * Prevents Stored XSS from crowdsourced reports and map popup descriptions.
 */
export function sanitizeHtml(dirtyText) {
  if (!dirtyText) return '';
  if (typeof dirtyText !== 'string') return String(dirtyText);

  return DOMPurify.sanitize(dirtyText, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span'],
    ALLOWED_ATTR: ['class']
  });
}

/**
 * Strips all HTML entirely and safely escapes text.
 */
export function escapeText(text) {
  if (!text) return '';
  const str = String(text);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize an entire report object before display or map rendering.
 */
export function sanitizeReport(report) {
  if (!report) return report;
  return {
    ...report,
    area_name: escapeText(report.area_name || report.areaName),
    description: sanitizeHtml(report.description),
    city: escapeText(report.city),
    smell_level: escapeText(report.smell_level || report.smellLevel),
    symptoms: Array.isArray(report.symptoms) ? report.symptoms.map(s => escapeText(s)) : []
  };
}
