import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { SkillMeta } from './skillsRegistry';

export interface SkillAdapter {
  name: string;
  detect(): boolean;
  install(skillName: string, content: string, meta: SkillMeta): void;
  remove(skillName: string): void;
  listInstalled(): string[];
}

// ClaudeCodeAdapter: installs to ~/.claude/plugins/valdi/skills/<name>/SKILL.md
const ClaudeCodeAdapter: SkillAdapter = {
  name: 'claude',
  detect() {
    const claudeDir = path.join(os.homedir(), '.claude');
    return fs.existsSync(claudeDir);
  },
  install(skillName: string, content: string, meta: SkillMeta) {
    const skillDir = path.join(os.homedir(), '.claude', 'plugins', 'valdi', 'skills', skillName);
    fs.mkdirSync(skillDir, { recursive: true });
    const frontmatter = `---\nname: ${meta.name}\ndescription: ${meta.description}\n---\n\n`;
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), frontmatter + content, 'utf8');
  },
  remove(skillName: string) {
    const skillDir = path.join(os.homedir(), '.claude', 'plugins', 'valdi', 'skills', skillName);
    if (fs.existsSync(skillDir)) {
      fs.rmSync(skillDir, { recursive: true, force: true });
    }
  },
  listInstalled() {
    const skillsDir = path.join(os.homedir(), '.claude', 'plugins', 'valdi', 'skills');
    if (!fs.existsSync(skillsDir)) return [];
    return fs
      .readdirSync(skillsDir)
      .filter((entry) => fs.statSync(path.join(skillsDir, entry)).isDirectory());
  },
};

// CursorAdapter: installs to ~/.cursor/rules/valdi-<name>.mdc (global)
const CursorAdapter: SkillAdapter = {
  name: 'cursor',
  detect() {
    const cursorDir = path.join(os.homedir(), '.cursor');
    return fs.existsSync(cursorDir);
  },
  install(skillName: string, content: string, meta: SkillMeta) {
    const rulesDir = path.join(os.homedir(), '.cursor', 'rules');
    fs.mkdirSync(rulesDir, { recursive: true });
    const frontmatter = `---\ndescription: ${meta.description}\nalwaysApply: false\n---\n\n`;
    fs.writeFileSync(path.join(rulesDir, `valdi-${skillName}.mdc`), frontmatter + content, 'utf8');
  },
  remove(skillName: string) {
    const filePath = path.join(os.homedir(), '.cursor', 'rules', `valdi-${skillName}.mdc`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  },
  listInstalled() {
    const rulesDir = path.join(os.homedir(), '.cursor', 'rules');
    if (!fs.existsSync(rulesDir)) return [];
    return fs
      .readdirSync(rulesDir)
      .filter((f) => f.startsWith('valdi-') && f.endsWith('.mdc'))
      .map((f) => f.replace(/^valdi-/u, '').replace(/\.mdc$/u, ''));
  },
};

// CopilotAdapter: appends to ./.github/copilot-instructions.md in CWD (project-scoped)
const CopilotAdapter: SkillAdapter = {
  name: 'copilot',
  detect() {
    const githubDir = path.join(process.cwd(), '.github');
    return fs.existsSync(githubDir);
  },
  install(skillName: string, content: string, _meta: SkillMeta) {
    const githubDir = path.join(process.cwd(), '.github');
    fs.mkdirSync(githubDir, { recursive: true });
    const instructionsFile = path.join(githubDir, 'copilot-instructions.md');
    const section = `\n\n## ${skillName}\n\n${content}`;
    if (fs.existsSync(instructionsFile)) {
      fs.appendFileSync(instructionsFile, section, 'utf8');
    } else {
      fs.writeFileSync(instructionsFile, `# Copilot Instructions${section}`, 'utf8');
    }
  },
  remove(skillName: string) {
    const instructionsFile = path.join(process.cwd(), '.github', 'copilot-instructions.md');
    if (!fs.existsSync(instructionsFile)) return;
    const contents = fs.readFileSync(instructionsFile, 'utf8');
    // Remove section starting with ## <skillName> up to next ## or end of file
    const sectionRegex = new RegExp(
      `\\n\\n## ${skillName}\\n[\\s\\S]*?(?=\\n\\n## |$)`,
      'u',
    );
    const updated = contents.replace(sectionRegex, '');
    fs.writeFileSync(instructionsFile, updated, 'utf8');
  },
  listInstalled() {
    const instructionsFile = path.join(process.cwd(), '.github', 'copilot-instructions.md');
    if (!fs.existsSync(instructionsFile)) return [];
    const contents = fs.readFileSync(instructionsFile, 'utf8');
    const matches = contents.match(/^## (valdi-\S+)/gmu);
    if (!matches) return [];
    return matches.map((m) => m.replace(/^## /u, ''));
  },
};

// GenericAdapter: installs to ~/.valdi/skills/<name>.md
const GenericAdapter: SkillAdapter = {
  name: 'generic',
  detect() {
    // Always available as a fallback
    return true;
  },
  install(skillName: string, content: string, _meta: SkillMeta) {
    const skillsDir = path.join(os.homedir(), '.valdi', 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(path.join(skillsDir, `${skillName}.md`), content, 'utf8');
  },
  remove(skillName: string) {
    const filePath = path.join(os.homedir(), '.valdi', 'skills', `${skillName}.md`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  },
  listInstalled() {
    const skillsDir = path.join(os.homedir(), '.valdi', 'skills');
    if (!fs.existsSync(skillsDir)) return [];
    return fs
      .readdirSync(skillsDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/u, ''));
  },
};

export const ALL_ADAPTERS: SkillAdapter[] = [
  ClaudeCodeAdapter,
  CursorAdapter,
  CopilotAdapter,
  GenericAdapter,
];

export function detectAdapters(): SkillAdapter[] {
  return ALL_ADAPTERS.filter((a) => a.detect());
}

export function getAdapterByName(name: string): SkillAdapter | undefined {
  return ALL_ADAPTERS.find((a) => a.name === name);
}
