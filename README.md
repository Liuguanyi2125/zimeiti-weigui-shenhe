# 自媒体违规审核

用来审核**抖音、视频号、小红书、B站**的短视频文案、图文笔记、直播话术、标题封面、简介、评论区、私信客服话术和商品详情页，输出**风险等级 + 命中依据 + 合规改写**，也能指导违规后的处理和申诉。

**适用于所有 AI Agent**：Claude Code、Codex、Cursor、Gemini CLI、OpenCode 等编程 Agent，ChatGPT、豆包、Kimi、Coze、Dify 等聊天平台，也可以**在终端里直接调用**。

## 用法：两步

**第 1 步：安装**（一行命令，把 skill 装进你电脑上的 AI 工具）

```bash
npx zimeiti-weigui-shenhe
```

会装到 `~/.agents/skills`（Codex、Cursor、Gemini CLI、OpenCode 等通用目录），以及已安装的 Claude Code（`~/.claude/skills`）、Codex（`~/.codex/skills`）。再次运行就是更新，`npx zimeiti-weigui-shenhe uninstall` 卸载。只需要 Node.js 18+。

**第 2 步：在 AI 里直接提问**

打开 Claude Code、Codex 等 AI 工具（比如在终端输入 `claude`），把要检查的文字发给它：

```
帮我审核这段直播话术：零基础跟我学，包学包会，学完月入5万！想要资料的扣1，我私信发你
```

```
这条视频号文案会不会违规？挂车带货用的：……
```

```
这篇笔记要同时发小红书和B站，帮我看看：……
```

没说平台时，AI 会按四个平台分别给结论，并以最严的平台为准给出改写。

```
账号被禁播1天，原因是引导私下交易，帮我写申诉
```

AI 会自动调用这个 skill，输出风险等级、命中原因、合规改写和改写后全文。已经打开的 AI 会话需要重开一次才能识别新装的 skill。

> 也可以用通用的 skills 安装器：`npx skills add Liuguanyi2125/zimeiti-weigui-shenhe`

## 能力

- **按平台分别判定，多平台取最严**：以抖音规则为底座，叠加视频号、小红书、B站官方规则里更严或独有的条款（视频号的宗教时政荐股直接封号、副业变现引流；小红书的全场景导流、虚构人设、AI 标注；B站的量化着装、广告报备、资质认证）
- 按身份层次判断尺度：短视频 → 直播 → 挂车 → 投流，越往后越严
- 三层排雷：关键词抓取、语境叠加、人工巡查
- 覆盖直播 12 项审核范围：封面、标题、话术、贴片、连麦、评论区、背景等
- 定级：一 / 二 / 三级违规，以及隐形限流
- 广告法极限词，以及电商违规营销（诱导好评、诱骗秒杀、违规买赠等）
- 违规后的处理守则和申诉模板

## 在各种 Agent 里使用

| 环境 | 用法 |
|---|---|
| Claude Code、Codex、Cursor、Gemini CLI、OpenCode 等支持 Skills 的 Agent | `npx zimeiti-weigui-shenhe` 安装后直接提问 |
| 读取 `AGENTS.md` 的 Agent | 在本仓库目录里打开，或把 `AGENTS.md` 的内容加进你项目的规则文件 |
| ChatGPT、豆包、Kimi、Coze、Dify、GPTs 等聊天或搭建平台 | 运行 `npx zimeiti-weigui-shenhe system \| pbcopy`，把完整系统提示词粘贴到「系统提示词 / 角色设定 / 知识库」里 |

## 进阶：不进 AI 会话，直接在终端里用

以下用 `weigui` 表示，可用 `npm i -g zimeiti-weigui-shenhe` 装成全局命令；不装的话，把它换成 `npx zimeiti-weigui-shenhe`。

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

# 安装 / 卸载 skill
weigui install
weigui uninstall
```

参数说明：
- `--scene`：短视频 / 直播 / 挂车 / 投流，默认按直播从严
- `--platform`：抖音 / 视频号 / 小红书 / B站 / 全部（默认，四平台取最严）
- `--agent`：auto / claude / codex / gemini / 自定义命令

## 结构

```
SKILL.md                 主提示词：流程、定级、输出格式、改写原则
AGENTS.md                通用 Agent 入口
references/rules.md      底座规则（抖音直播行为规范、广告法、违规营销 + 实操经验）
references/platforms.md  视频号 / 小红书 / B站 差异规则与最严速查表
references/lexicon.md    高危词库与替代说法
references/appeal.md     违规后处理与申诉模板
scripts/rules.json       关键词初筛规则（CLI 与 scan.py 共用）
scripts/scan.py          关键词初筛（Python 版，供能执行命令的 Agent 使用）
bin/weigui.js            终端命令 weigui
```

## 免责声明

内容依据平台公开规则和实操经验整理，平台规则核对日期 2026-10-17。小红书《社区直播规范》官方全文未能获取，相关部分按其社区规范、公约和导流细则推定。平台规则随时更新，请以各平台官方最新公告为准。本项目只用于帮助内容合规，不提供任何规避审核的方法。

## License

MIT
