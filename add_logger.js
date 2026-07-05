const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('route.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const routes = walk('src/app/api');

routes.forEach(route => {
  let content = fs.readFileSync(route, 'utf8');
  
  if (route.includes('api/admin/logs')) return; // ignore the logs endpoint

  let modified = false;

  // Find all export async function GET/POST/PUT/DELETE(req: Request... and insert await logApiActivity(req);
  // Note: some have (req: Request), some have (req: Request, { params }: ...) and some have ()
  // For those with no req parameter, we must add it: export async function GET(req: Request)
  
  const regex = /export async function (GET|POST|PUT|DELETE)\(([^)]*)\)\s*{/g;
  
  content = content.replace(regex, (match, method, params) => {
    modified = true;
    if (params.trim() === '') {
      return `export async function ${method}(req: Request) {\n  await logApiActivity(req);`;
    }
    
    // If it has req: Request, just insert
    if (params.includes('req: Request')) {
      return `export async function ${method}(${params}) {\n  await logApiActivity(req);`;
    }
    
    // fallback
    return match;
  });
  
  if (modified) {
    if (!content.includes('logApiActivity')) {
      const relativePath = path.relative(path.dirname(route), 'src/utils/logger').replace(/\\/g, '/');
      content = `import { logApiActivity } from '${relativePath}';\n` + content;
    }
    fs.writeFileSync(route, content);
    console.log(`Updated ${route}`);
  }
});
