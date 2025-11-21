#!/usr/bin/env node

/**
 * 自动生成架构文档的文件列表
 * 用于确保文档与实际文件结构同步
 */

const fs = require('fs');
const path = require('path');

const GAMES = ['othello', 'majiang', 'tic-tac-toe'];
const DOCS_DIR = path.join(__dirname, '../../docs');
const SRC_DIR = path.join(__dirname, '../../src');

/**
 * 获取目录下的所有 TypeScript 文件
 */
function getTypeScriptFiles(dir, baseDir = dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (entry.isDirectory()) {
      // 跳过 node_modules 和 models 目录
      if (entry.name === 'node_modules' || entry.name === 'models') {
        continue;
      }
      files.push(...getTypeScriptFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(relativePath.replace(/\\/g, '/'));
    }
  }
  
  return files.sort();
}

/**
 * 生成文件列表 Markdown
 */
function generateFileListMarkdown(game, files) {
  const sections = {};
  
  // 按目录分组
  for (const file of files) {
    const parts = file.split('/');
    // 如果文件在根目录（只有文件名，没有目录），归类为 'root'
    // 否则使用第一个目录名作为 section
    const section = parts.length > 1 ? parts[0] : 'root';
    
    if (!sections[section]) {
      sections[section] = [];
    }
    sections[section].push(file);
  }
  
  let markdown = '## 📋 文件清单\n\n';
  markdown += '> **注意**：此列表由脚本自动生成，最后更新于 ' + new Date().toISOString().split('T')[0] + '\n';
  markdown += '> \n';
  markdown += '> 如需更新，请运行：`npm run docs:update-file-list`\n\n';
  
  // 按目录输出
  const sectionOrder = ['core', 'config', 'strategy', 'ui', 'tools', 'tests'];
  for (const section of sectionOrder) {
    if (sections[section]) {
      markdown += `### ${section}/\n\n`;
      for (const file of sections[section]) {
        markdown += `- \`${file}\` ✅\n`;
      }
      markdown += '\n';
    }
  }
  
  // 其他目录（排除 root）
  for (const section of Object.keys(sections).sort()) {
    if (!sectionOrder.includes(section) && section !== 'root') {
      markdown += `### ${section}/\n\n`;
      for (const file of sections[section]) {
        markdown += `- \`${file}\` ✅\n`;
      }
      markdown += '\n';
    }
  }
  
  // 根目录文件（如果有）
  if (sections['root'] && sections['root'].length > 0) {
    markdown += `### 根目录\n\n`;
    for (const file of sections['root']) {
      markdown += `- \`${file}\` ✅\n`;
    }
    markdown += '\n';
  }
  
  return markdown;
}

/**
 * 更新架构文档
 */
function updateArchitectureDoc(game) {
  const docPath = path.join(DOCS_DIR, game, 'FOLDER_STRUCTURE.md');
  if (!fs.existsSync(docPath)) {
    console.log(`⚠️  文档不存在: ${docPath}`);
    return;
  }
  
  const gameDir = path.join(SRC_DIR, game);
  if (!fs.existsSync(gameDir)) {
    console.log(`⚠️  游戏目录不存在: ${gameDir}`);
    return;
  }
  
  const files = getTypeScriptFiles(gameDir);
  const fileListMarkdown = generateFileListMarkdown(game, files);
  
  let content = fs.readFileSync(docPath, 'utf-8');
  
  // 查找并替换文件清单部分
  // 先删除所有现有的文件清单部分（可能有重复）
  const fileListRegex = /## 📋 文件清单[\s\S]*?(?=## 📊 实际结构验证|## 🔗 相关文档|$)/g;
  content = content.replace(fileListRegex, '');
  
  // 在实际结构验证之前插入新的文件清单
  const validationRegex = /## 📊 实际结构验证/;
  if (validationRegex.test(content)) {
    content = content.replace(validationRegex, fileListMarkdown + '\n\n## 📊 实际结构验证');
  } else {
    // 在文档末尾添加
    content += '\n\n' + fileListMarkdown;
  }
  
  fs.writeFileSync(docPath, content, 'utf-8');
  console.log(`✅ 已更新: ${docPath}`);
  console.log(`   找到 ${files.length} 个 TypeScript 文件`);
}

// 主函数
function main() {
  const game = process.argv[2];
  
  if (game && GAMES.includes(game)) {
    updateArchitectureDoc(game);
  } else if (game === 'all') {
    for (const g of GAMES) {
      updateArchitectureDoc(g);
    }
  } else {
    console.log('用法: node generate-file-list.js <game|all>');
    console.log('游戏: ' + GAMES.join(', '));
  }
}

main();

