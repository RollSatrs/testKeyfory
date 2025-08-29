#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const replacements = [
  { from: "status: 'available'", to: "status: MATERIAL_STATUS.AVAILABLE" },
  { from: "status: 'used'", to: "status: MATERIAL_STATUS.USED" },
  { from: "status: 'replaced'", to: "status: MATERIAL_STATUS.REPLACED" },
  { from: '{ status: "available" }', to: '{ status: MATERIAL_STATUS.AVAILABLE }' },
  { from: '{ status: "used" }', to: '{ status: MATERIAL_STATUS.USED }' },
  { from: '{ status: "replaced" }', to: '{ status: MATERIAL_STATUS.REPLACED }' },
  { from: "status === 'available'", to: "status === MATERIAL_STATUS.AVAILABLE" },
  { from: "status === 'used'", to: "status === MATERIAL_STATUS.USED" },
  { from: "status === 'replaced'", to: "status === MATERIAL_STATUS.REPLACED" },
  { from: "status !== 'available'", to: "status !== MATERIAL_STATUS.AVAILABLE" },
  { from: "status !== 'used'", to: "status !== MATERIAL_STATUS.USED" },
  { from: "status !== 'replaced'", to: "status !== MATERIAL_STATUS.REPLACED" },
  { from: "where: { status: 'available' }", to: "where: { status: MATERIAL_STATUS.AVAILABLE }" },
  { from: "where: { status: 'used' }", to: "where: { status: MATERIAL_STATUS.USED }" }
];

function addImportIfNeeded(content, filePath) {
  if (content.includes('MATERIAL_STATUS') && !content.includes("import { MATERIAL_STATUS }") && !content.includes("import {MATERIAL_STATUS}")) {
    const lines = content.split('\n');
    let insertIndex = 0;

    // Найти последний import
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        insertIndex = i + 1;
      }
    }

    const importLine = "import { MATERIAL_STATUS } from '../../../constants/statusConstants.js';";
    lines.splice(insertIndex, 0, importLine);
    return lines.join('\n');
  }
  return content;
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    for (const replacement of replacements) {
      if (content.includes(replacement.from)) {
        content = content.replaceAll(replacement.from, replacement.to);
        changed = true;
        console.log(`✅ Заменено в ${filePath}: ${replacement.from} -> ${replacement.to}`);
      }
    }

    if (changed) {
      content = addImportIfNeeded(content, filePath);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`📝 Файл обновлен: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Ошибка обработки ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);

      if (file.isDirectory() && file.name !== 'node_modules' && file.name !== '.git') {
        processDirectory(fullPath);
      } else if (file.isFile() && file.name.endsWith('.js')) {
        processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Ошибка обработки папки ${dirPath}:`, error.message);
  }
}

console.log('🚀 Начинаю обновление статусов материалов...');
processDirectory('./api');
console.log('✅ Обновление завершено!');
