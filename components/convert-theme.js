const fs = require('fs');
const path = require('path');

const files = ['TeacherDashboard.tsx', 'AdminDashboard.tsx'];

const replacements = [
  [/glass-panel/g, 'bg-white shadow-sm border border-slate-200'],
  [/bg-slate-900\/[0-9]+/g, 'bg-white'],
  [/bg-slate-900/g, 'bg-white border border-slate-200 shadow-sm'],
  [/border-slate-900/g, 'border-slate-200'],
  [/border-slate-800(\/[0-9]+)?/g, 'border-slate-200'],
  [/text-white/g, 'text-slate-800'],
  [/text-slate-400/g, 'text-slate-500'],
  [/text-slate-300/g, 'text-slate-600'],
  [/text-indigo-400/g, 'text-blue-600'],
  [/text-indigo-500/g, 'text-blue-600'],
  [/text-indigo-300/g, 'text-blue-700'],
  [/bg-indigo-600/g, 'bg-blue-600'],
  [/hover:bg-indigo-500/g, 'hover:bg-blue-700'],
  [/bg-indigo-500\/10/g, 'bg-blue-50'],
  [/border-indigo-500\/20/g, 'border-blue-100'],
  [/text-emerald-400/g, 'text-emerald-600'],
  [/bg-emerald-500\/10/g, 'bg-emerald-50'],
  [/border-emerald-500\/20/g, 'border-emerald-100'],
  [/text-amber-400/g, 'text-amber-600'],
  [/bg-amber-500\/10/g, 'bg-amber-50'],
  [/border-amber-500\/20/g, 'border-amber-100'],
  [/text-rose-400/g, 'text-red-500'],
  [/text-red-400/g, 'text-red-500'],
  [/bg-slate-800/g, 'bg-slate-100'],
  [/hover:bg-slate-700/g, 'hover:bg-slate-200'],
  [/bg-slate-950/g, 'bg-[#f8f9fa]'],
  [/border-slate-700/g, 'border-slate-300'],
  [/text-slate-200/g, 'text-slate-700'],
  [/hover:text-white/g, 'hover:text-slate-900'],
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  replacements.forEach(([regex, replacement]) => {
    content = content.replace(regex, replacement);
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
