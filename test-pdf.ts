import * as pdf from 'pdf-parse';
const pdfParse = (pdf as any).default || pdf;
console.log(typeof pdfParse);
