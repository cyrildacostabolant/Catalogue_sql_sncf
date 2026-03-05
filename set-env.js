const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, 'src', 'environments', 'env.ts');
const dir = path.dirname(envFile);

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const content = `
export const env = {
  SUPABASE_URL: '${process.env.SUPABASE_URL || ''}',
  SUPABASE_ANON_KEY: '${process.env.SUPABASE_ANON_KEY || ''}',
  GEMINI_API_KEY: '${process.env.GEMINI_API_KEY || ''}'
};
`;

fs.writeFileSync(envFile, content);
console.log('Environment file generated successfully.');
