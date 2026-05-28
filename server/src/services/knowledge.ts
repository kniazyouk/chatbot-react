import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_AI_PATH = path.resolve(__dirname, '../../../DB-AI');

export function getKnowledgeBase(): string {
  if (!fs.existsSync(DB_AI_PATH)) {
    console.warn('DB-AI directory not found at:', DB_AI_PATH);
    return 'No knowledge base directory configured.';
  }

  const files = fs.readdirSync(DB_AI_PATH);
  let context = '';

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.md' || ext === '.txt') {
      try {
        const content = fs.readFileSync(path.join(DB_AI_PATH, file), 'utf-8');
        context += `\n\n--- Document: ${file} ---\n${content}`;
      } catch (err) {
        console.error(`Failed to read document ${file}:`, err);
      }
    }
  }

  if (!context) {
    return 'No documents found in the knowledge base.';
  }

  return context.trim();
}
