// On-device résumé text extraction. The file never leaves the browser — we read
// the bytes locally and pull plain text out of a PDF (pdf.js) or a .docx (mammoth).
// Returns the raw text; all matching/scoring happens downstream in resumeMatch.js.

import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth/mammoth.browser.js';

// pdf.js needs its worker. Vite resolves the asset URL; one global assignment.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

async function extractPdf(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((it) => it.str).join(' '));
  }
  return pages.join('\n');
}

async function extractDocx(arrayBuffer) {
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value;
}

function kindOf(file) {
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  if (name.endsWith('.pdf') || type === 'application/pdf') return 'pdf';
  if (
    name.endsWith('.docx') ||
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
    return 'docx';
  if (name.endsWith('.doc')) return 'legacy-doc';
  return 'unknown';
}

/**
 * Extract plain text from a résumé File. Throws a friendly Error for unsupported
 * formats or empty/parse-failed documents.
 */
export async function extractResumeText(file) {
  const kind = kindOf(file);
  if (kind === 'legacy-doc') {
    throw new Error('Legacy .doc isn’t supported — please export to PDF or .docx.');
  }
  if (kind === 'unknown') {
    throw new Error('Unsupported file. Upload a PDF or Word (.docx) résumé.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const text = kind === 'pdf' ? await extractPdf(arrayBuffer) : await extractDocx(arrayBuffer);

  const cleaned = (text || '').replace(/\s+/g, ' ').trim();
  if (cleaned.length < 40) {
    throw new Error(
      'Couldn’t read enough text — a scanned/image-only PDF won’t parse. Try a text-based export.'
    );
  }
  return cleaned;
}
