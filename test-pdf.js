const fs = require('fs');
const pdfParse = require('pdf-parse');

async function test() {
  const buffer = fs.readFileSync('package.json');
  try {
    const data = await pdfParse(buffer);
    console.log("Success:", data.text);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
