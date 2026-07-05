import LlamaCloud from '@llamaindex/llama-cloud';

async function main() {
  if (!process.env.LLAMA_CLOUD_API_KEY) {
    console.error("API Key is missing from env!");
    return;
  }
  
  const client = new LlamaCloud({ apiKey: process.env.LLAMA_CLOUD_API_KEY });
  const buf = Buffer.from(
    '%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%EOF\n'
  );
  
  const fileBlob = new Blob([buf]);
  const fileForUpload = new File([fileBlob], 'document.pdf', { type: 'application/pdf' });
  
  try {
    console.log("Uploading and Parsing via LlamaCloud with Agentic tier...");
    const result = await client.parsing.parse({
      tier: 'agentic',
      version: 'latest',
      upload_file: fileForUpload,
      expand: ['markdown_full', 'text_full']
    });
    console.log("Parsing successful!");
    console.log("Extracted Markdown Length:", result.markdown_full?.length || 0);
    console.log("Extracted Text Length:", result.text_full?.length || 0);
  } catch(e) {
    console.error("Failed to parse via LlamaCloud:");
    console.error(e);
  }
}

main();
