# 自媒体违规审核

用来审核抖音、视频号的短视频文案、直播话术、标题封面、简介、评论区、私信客服话术和商品详情页，输出**风险等级 + 命中依据 + 合规改写**，也能指导违规后的处理和申诉。

**适用于所有 AI Agent**：Claude Code、Codex、Cursor、Gemini CLI、OpenCode 等编程 Agent，ChatGPT、豆包、Kimi、Coze、Dify 等聊天平台，也可以**在终端里直接调用**。

## 一行安装

**装进 AI Agent**（交互式选择要装到哪些 Agent）：

```bash
npx skills add Liuguanyi2125/zimeiti-weigui-shenhe
```

装到全部 Agent、全局生效、跳过确认：

```bash
npx skills add Liuguanyi2125/zimeiti-weigui-shenhe -g -a '*' -y
```

装完在 Agent 里直接说「帮我审核这段直播话术」「这句话会不会违规」即可。

**终端直接用**（不用安装）：

```bash
npx github:Liuguanyi2125/zimeiti-weigui-shenhe scan -t "学完月入10万，加V私信我"
```

**装成全局命令 `weigui`**：

```bash
npm i -g github:Liuguanyi2125/zimeiti-weigui-shenhe
```

只需要 Node.js 18+，没有任何第三方依赖。

## 能力

- 按身份层次判断尺度：短视频 → 直播 → 挂车 → 投流，越往后越严
- 三层排雷：关键词抓取、语境叠加、人工巡查
- 覆盖直播 12 项审核范围：封面、标题、话术、贴片、连麦、评论区、背景等
- 定级：一 / 二 / 三级违规，以及隐形限流
- 广告法极限词，以及电商违规营销（诱导好评、诱骗秒杀、违规买赠等）
- 违规后的处理守则和申诉模板

## 在各种 Agent 里使用

| 环境 | 用法 |
|---|---|
| Claude Code、Codex、Cursor、Gemini CLI、OpenCode 等支持 Skills 的 Agent | `npx skills add Liuguanyi2125/zimeiti-weigui-shenhe` |
| 读取 `AGENTS.md` 的 Agent | 在本仓库目录里打开，或把 `AGENTS.md` 的内容加进你项目的规则文件 |
| ChatGPT、豆包、Kimi、Coze、Dify、GPTs 等聊天或搭建平台 | 运行 `weigui system \| pbcopy`，把完整系统提示词粘贴到「系统提示词 / 角色设定 / 知识库」里 |

## 终端命令

以下用 `weigui` 表示。没有全局安装时，把它换成 `npx github:Liuguanyi2125/zimeiti-weigui-shenhe`。

```bash
# 关键词初筛：离线，不需要任何 AI
weigui scan 文案.txt
weigui scan -t "学完月入10万，加V私信我"

# 完整审核：自动调用本机的 claude / codex / gemini
weigui review 文案.txt --scene 直播 --platform 视频号
cat 口播稿.txt | weigui review - --scene 挂车 --carrier 口播

# 指定任意 Agent：只要它能从标准输入读提示词
weigui review 文案.txt --agent codex
weigui review 文案.txt --agent 'ollama run qwen3'

# 只输出拼好的提示词，交给别的工具处理
weigui review 文案.txt --print-prompt > prompt.md

# 生成申诉文案
weigui appeal --platform 视频号 --violation "直播引导私下交易，禁播1天" \
  --actions "删除了简介里的微信号，整改了直播话术" --account 我的账号

# 输出完整系统提示词，用于粘贴到聊天平台
weigui system > 系统提示词.md

# 把 skill 装进各 AI Agent（等同 npx skills add）
weigui install
```

参数说明：
- `--scene`：短视频 / 直播 / 挂车 / 投流，默认按直播从严
- `--platform`：抖音 / 视频号 / 全部
- `--agent`：auto / claude / codex / gemini / 自定义命令

## 结构

```
SKILL.md                 主提示词：流程、定级、输出格式、改写原则
AGENTS.md                通用 Agent 入口
references/rules.md      规则全集（平台规则条款 + 实操经验）
references/lexicon.md    高危词库与替代说法
references/appeal.md     违规后处理与申诉模板
scripts/rules.json       关键词初筛规则（CLI 与 scan.py 共用）
scripts/scan.py          关键词初筛（Python 版，供能执行命令的 Agent 使用）
bin/weigui.js            终端命令 weigui
```

## 免责声明

内容依据平台公开规则和实操经验整理。平台规则随时更新，请以抖音、微信视频号官方最新公告为准。本项目只用于帮助内容合规，不提供任何规避审核的方法。

## License

MIT
