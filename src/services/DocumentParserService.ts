import LlamaCloud from '@llamaindex/llama-cloud';

export class DocumentParserService {
  /**
   * Helper to parse PDF via LlamaCloud (Agentic OCR)
   */
  async parsePdfWithLlamaCloud(fileBuffer: Buffer): Promise<string> {
    if (!process.env.LLAMA_CLOUD_API_KEY) {
      return '';
    }
    try {
      const client = new LlamaCloud({ apiKey: process.env.LLAMA_CLOUD_API_KEY });
      const fileBlob = new Blob([new Uint8Array(fileBuffer)]);
      const fileForUpload = new File([fileBlob], 'document.pdf', { type: 'application/pdf' });
      
      const result = await client.parsing.parse({
        tier: 'agentic',
        version: 'latest',
        upload_file: fileForUpload,
        expand: ['markdown_full', 'text_full']
      });
      return result.markdown_full || result.text_full || '';
    } catch (err) {
      console.error('LlamaCloud parsing failed, falling back:', err);
      return '';
    }
  }

  /**
   * Parses the text out of a document/PDF using LlamaCloud with a local fallback
   */
  async extractTextFromPdf(fileBuffer: Buffer): Promise<{ text: string, numPages: number }> {
    let pdfText = await this.parsePdfWithLlamaCloud(fileBuffer);
    let numPages = 1;

    if (!pdfText) {
      try {
        // Fallback to pdf-parse if LlamaCloud fails or key is missing
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(fileBuffer);
        pdfText = data.text;
        numPages = data.numpages;
      } catch (err) {
        console.error('Error parsing PDF file:', err);
        throw new Error('Failed to read PDF file format');
      }
    }

    return { text: pdfText, numPages };
  }
}

export const documentParserService = new DocumentParserService();
