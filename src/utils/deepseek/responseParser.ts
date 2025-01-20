export function extractJSONFromResponse(content: string): any {
  try {
    // First try direct JSON parsing
    const result = JSON.parse(content);
    
    // Validate basic structure
    if (typeof result !== 'object' || result === null) {
      throw new Error('Response is not a valid JSON object');
    }
    
    return result;
  } catch (error) {
    // If direct parsing fails, try to find and clean JSON content
    const jsonMatch = content.match(/\{(?:[^{}]|{[^{}]*})*\}/);
    if (!jsonMatch) {
      throw new Error('No se encontró una estructura JSON válida en la respuesta');
    }

    try {
      const cleaned = jsonMatch[0]
        .replace(/[\u201C\u201D]/g, '"') // Replace curly quotes
        .replace(/[\u2018\u2019]/g, "'") // Replace curly apostrophes
        .replace(/\n/g, ' ')            // Remove newlines
        .replace(/\s+/g, ' ')           // Normalize spaces
        .replace(/,\s*}/g, '}')         // Remove trailing commas
        .replace(/,\s*]/g, ']')         // Remove trailing commas in arrays
        .trim();

      const result = JSON.parse(cleaned);

      // Validate basic structure
      if (typeof result !== 'object' || result === null) {
        throw new Error('La respuesta no es un objeto JSON válido');
      }

      return result;
    } catch (error) {
      throw new Error('Error al procesar la respuesta JSON. Por favor, intente nuevamente.');
    }
  }
}