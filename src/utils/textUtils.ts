export function cleanupText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/[\t\f\r ]+/g, ' ')
    // Normalize line endings
    .split(/\n+/)
    // Remove empty lines and trim each line
    .map(line => line.trim())
    .filter(Boolean)
    // Join with clear line separators
    .join('\n');
}

export function extractTableStructure(text: string): string[] {
  const lines = text.split(/\n+/).map(line => line.trim());
  const tableRows: string[] = [];
  let inTable = false;
  let headerPattern: RegExp | null = null;

  for (const line of lines) {
    // Skip empty lines
    if (!line) continue;

    // Look for table headers
    if (!inTable) {
      if (/(?:CODIGO|CODE|ITEM|DESCRIPCION|DESCRIPTION|CANTIDAD|QTY|PRECIO|PRICE)/i.test(line)) {
        inTable = true;
        headerPattern = new RegExp(line.split(/\s+/).map(word => `(?:${word})`).join('\\s+'), 'i');
        tableRows.push(line);
        continue;
      }
    }

    // Process table rows
    if (inTable) {
      const parts = line.split(/\s+/).filter(Boolean);
      const hasNumbers = parts.some(part => /^[\d,.]+$/.test(part.replace(/[$%]/g, '')));
      const matchesHeader = headerPattern?.test(line);

      // Skip if it's another header row
      if (matchesHeader) continue;

      // Add row if it has numbers and enough parts
      if (hasNumbers && parts.length >= 3) {
        tableRows.push(line);
      } else {
        // If we find a line that doesn't look like a table row, check if it might be
        // a continuation of the previous description
        const lastRow = tableRows[tableRows.length - 1];
        if (lastRow && !/^[\d,.]+/.test(line)) {
          tableRows[tableRows.length - 1] = `${lastRow} ${line}`;
        } else {
          inTable = false;
        }
      }
    }
  }

  return tableRows;
}

export function normalizeSpacing(text: string): string {
  return text
    // Convert tabs and multiple spaces to single space
    .replace(/[\t ]+/g, ' ')
    // Ensure space around common separators
    .replace(/([:|;])/g, ' $1 ')
    // Remove spaces around currency symbols
    .replace(/\s*([$€£¥])\s*/g, '$1')
    // Normalize decimal separators
    .replace(/,(\d{2}(?!\d))/g, '.$1')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    // Ensure space between numbers and text
    .replace(/(\d)([A-Za-z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .trim();
}

export function findTaxId(text: string): string | null {
  const patterns = [
    // RNC format (Dominican Republic)
    /\b[0-9]{2}-[0-9]{2}-[0-9]{5}-[0-9]\b/,
    // RUC format (Peru, Ecuador)
    /\b[0-9]{11}\b/,
    // NIT format (Colombia)
    /\b[0-9]{9}-[0-9]\b/,
    // Generic Tax ID formats
    /\b[A-Z]{1,2}[0-9]{9,12}\b/,
    /\b[0-9]{9,12}\b/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}