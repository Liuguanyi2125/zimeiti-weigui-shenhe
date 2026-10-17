#!/usr/bin/env node
// weigui —— 自媒体违规审核命令行工具（抖音 / 视频号）。只依赖 Node.js 18+，无第三方包。
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { parseArgs } = require('node:util');

const ROOT = path.resolve(__dirname, '..');
const REF = path.join(ROOT, 'references');
const REPO = 'Liuguanyi2125/zimeiti-weigui-shenhe';
const SCENES = ['短视频', '直播', '挂车', '投流'];
const PLATFORMS = ['抖音', '视频号', '全部'];

// 各 Agent CLI 的非交互调用方式：提示词统一走 stdin
const AGENTS = {
  claude: ['claude', ['-p']],
  codex: ['codex', ['exec', '-']],
  gemini: ['gemini', []],
};

const HELP = `weigui —— 自媒体违规审核（抖音 / 视频号）

用法:
  weigui scan    [文件|-] [-t 文本]                  关键词初筛（离线，不需要 AI）
  weigui review  [文件|-] [-t 文本] [选项]           完整审核，交给本机 AI Agent
  weigui appeal  -v "违规情况" [选项]                 生成申诉文案
  weigui system                                       输出完整系统提示词（粘贴到任意 AI 平台）
  weigui install [skills 参数]                        把 skill 安装到各 AI Agent（npx skills add）
  weigui path                                         输出 skill 所在目录

review / appeal 选项:
  -a, --agent <名称|命令>   auto（默认，依次找 claude/codex/gemini）、claude、codex、gemini，
                            或任意从标准输入读提示词的命令，如 'ollama run qwen3'
  -p, --platform <平台>     抖音 | 视频号 | 全部（默认）
      --print-prompt        只输出拼好的提示词，不调用 Agent
review 选项:
  -s, --scene <层次>        短视频 | 直播（默认）| 挂车 | 投流
  -c, --carrier <载体>      口播 / 标题 / 简介 / 评论区 / 私信 / 商详页 …
appeal 选项:
  -v, --violation <内容>    违规通知内容与处罚（必填）
      --actions <内容>      已完成的整改
      --account <账号名>    --date <日期>

示例:
  npx zimeiti-weigui-shenhe scan -t "学完月入10万，加V私信我"
  weigui review 文案.txt --scene 直播 --platform 视频号
  cat 口播稿.txt | weigui review - --agent 'ollama run qwen3'
  weigui appeal -v "直播引导私下交易，禁播1天" --actions "删除了简介里的微信号"
`;

const read = (p) => fs.readFileSync(p, 'utf8');
const die = (msg, code = 1) => { process.stderr.write(msg + '\n'); process.exit(code); };

// ---------- 关键词初筛（规则与 scripts/scan.py 共用 scripts/rules.json） ----------
const RULES = JSON.parse(read(path.join(ROOT, 'scripts', 'rules.json')));
const ORDER = { '🔴': 0, '🟠': 1, '🟡': 2, '⚪': 3 };

function scan(text) {
  const hits = [];
  text.split(/\r?\n/).forEach((line, i) => {
    for (const r of RULES) {
      for (const m of line.matchAll(new RegExp(r.pattern, 'g'))) {
        hits.push({ line: i + 1, ...r, word: m[0], text: line.trim() });
      }
    }
  });
  return hits;
}

function formatHits(hits) {
  if (!hits.length) return '✅ 关键词初筛未命中（仍需做语境识别和 12 范围检查）';
  hits.sort((a, b) => ORDER[a.level] - ORDER[b.level] || a.line - b.line);
  const out = [`命中 ${hits.length} 处：`, '', '| 行 | 等级 | 类别 | 命中 | 建议 | 原句 |', '|---|---|---|---|---|---|'];
  for (const h of hits) {
    const snippet = [...h.text].length <= 40 ? h.text : [...h.text].slice(0, 40).join('') + '…';
    out.push(`| ${h.line} | ${h.level} | ${h.category} | ${h.word} | ${h.tip} | ${snippet} |`);
  }
  out.push('', '注：初筛有误报/漏报，最终结论需结合场景（短视频/直播/挂车/投流）和上下文判断。');
  return out.join('\n');
}

// ---------- 提示词 ----------
function skillBody() {
  let text = read(path.join(ROOT, 'SKILL.md'));
  if (text.startsWith('---')) text = text.split('---').slice(2).join('---');
  return text.trim();
}

function systemPrompt(includeAppeal = true) {
  const parts = [
    '你是抖音 / 视频号内容合规审核专家。严格按下面的工作说明和参考资料工作。参考资料已全部附在下方，不需要再读取任何文件。',
    '# 工作说明\n\n' + skillBody(),
    '# 参考资料：rules.md\n\n' + read(path.join(REF, 'rules.md')),
    '# 参考资料：lexicon.md\n\n' + read(path.join(REF, 'lexicon.md')),
  ];
  if (includeAppeal) parts.push('# 参考资料：appeal.md\n\n' + read(path.join(REF, 'appeal.md')));
  return parts.join('\n\n---\n\n');
}

function readInput(file, text) {
  if (text) return text;
  if (!file || file === '-') {
    if (process.stdin.isTTY) die('请提供文件路径、-t 文本，或通过管道输入文本');
    return fs.readFileSync(0, 'utf8');
  }
  return read(file);
}

function onPath(cmd) {
  const probe = process.platform === 'win32' ? 'where' : 'which';
  return spawnSync(probe, [cmd], { stdio: 'ignore' }).status === 0;
}

function runAgent(agent, prompt) {
  if (agent === 'auto') {
    agent = Object.keys(AGENTS).find((name) => onPath(AGENTS[name][0]));
    if (!agent) {
      die('没找到可用的 Agent CLI（claude / codex / gemini）。\n'
        + "可用 --agent '<命令>' 指定任意从标准输入读提示词的命令，或用 --print-prompt 输出提示词自行粘贴。");
    }
  }
  process.stderr.write(`→ 调用 ${agent} 审核中…\n\n`);
  const opts = { input: prompt, stdio: ['pipe', 'inherit', 'inherit'], maxBuffer: 64 * 1024 * 1024 };
  const res = AGENTS[agent]
    ? spawnSync(AGENTS[agent][0], AGENTS[agent][1], { ...opts, shell: process.platform === 'win32' })
    : spawnSync(agent, { ...opts, shell: true });
  if (res.error) die(`调用失败：${res.error.message}`);
  process.exit(res.status ?? 1);
}

function deliver(values, prompt) {
  if (values['print-prompt']) process.stdout.write(prompt + '\n');
  else runAgent(values.agent, prompt);
}

// ---------- 子命令 ----------
const COMMON = {
  text: { type: 'string', short: 't' },
  agent: { type: 'string', short: 'a', default: 'auto' },
  platform: { type: 'string', short: 'p', default: '全部' },
  'print-prompt': { type: 'boolean' },
};

function parse(args, extra = {}) {
  try {
    return parseArgs({ args, options: { ...COMMON, ...extra }, allowPositionals: true });
  } catch (e) {
    die(e.message + '\n\n运行 weigui --help 查看用法');
  }
}

function check(name, value, choices) {
  if (!choices.includes(value)) die(`--${name} 只能是：${choices.join(' / ')}`);
}

const commands = {
  scan(args) {
    const { values, positionals } = parse(args);
    console.log(formatHits(scan(readInput(positionals[0], values.text))));
  },

  review(args) {
    const { values, positionals } = parse(args, {
      scene: { type: 'string', short: 's', default: '直播' },
      carrier: { type: 'string', short: 'c' },
    });
    check('scene', values.scene, SCENES);
    check('platform', values.platform, PLATFORMS);
    const content = readInput(positionals[0], values.text);
    const task = [
      '# 本次任务：违规审核', '',
      `- 平台：${values.platform}`,
      `- 身份层次：${values.scene}`,
      `- 内容载体：${values.carrier || '未说明，请按内容判断'}`, '',
      '请按「工作说明」里的审核流程和输出格式，完整输出：审核结论、逐条命中表、语境/组合风险、非话术项提醒、改写后全文。直接输出结果，不要提问。', '',
      '## 关键词初筛结果（脚本自动生成，可能有误报漏报，仅供参考）', '',
      formatHits(scan(content)), '',
      '## 待审核内容', '',
      `<content>\n${content}\n</content>`,
    ].join('\n');
    deliver(values, systemPrompt(false) + '\n\n---\n\n' + task);
  },

  appeal(args) {
    const { values } = parse(args, {
      violation: { type: 'string', short: 'v' },
      actions: { type: 'string' },
      account: { type: 'string' },
      date: { type: 'string' },
    });
    if (!values.violation) die('appeal 需要 -v "违规通知内容与处罚"');
    check('platform', values.platform, PLATFORMS);
    const task = [
      '# 本次任务：撰写违规申诉', '',
      `- 平台：${values.platform}`,
      `- 账号名：${values.account || '【账号名】'}`,
      `- 违规日期：${values.date || '【日期】'}`,
      `- 违规情况 / 处罚：${values.violation}`,
      `- 已做的整改：${values.actions || '未提供（请列出建议整改清单，并在文案中留【】占位）'}`, '',
      '请按 appeal.md：先给出必须先完成的自查与材料清单，然后给出可直接提交的申诉文案（认错致歉 → 具体整改 → 承诺 → 请求解除），最后提醒注意事项。直接输出结果，不要提问。',
    ].join('\n');
    deliver(values, systemPrompt(true) + '\n\n---\n\n' + task);
  },

  system() {
    process.stdout.write(systemPrompt(true) + '\n');
  },

  install(args) {
    const res = spawnSync('npx', ['-y', 'skills', 'add', REPO, '-g', ...args],
      { stdio: 'inherit', shell: process.platform === 'win32' });
    process.exit(res.status ?? 1);
  },

  path() {
    console.log(ROOT);
  },
};

const [cmd, ...rest] = process.argv.slice(2);
if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'help') {
  process.stdout.write(HELP);
} else if (commands[cmd]) {
  commands[cmd](rest);
} else {
  die(`未知命令：${cmd}\n\n${HELP}`);
}
