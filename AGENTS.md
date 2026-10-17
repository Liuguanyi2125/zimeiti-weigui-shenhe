# AGENTS.md

本仓库是一个「自媒体违规审核」skill，供任意 AI Agent 使用（Codex、Cursor、Gemini CLI、OpenCode、Claude Code 等读取 AGENTS.md 的工具都适用）。

当用户要求审核 / 检查 / 排雷抖音或视频号的短视频文案、直播话术、标题、封面、简介、评论区、私信客服话术、商品详情页，或问"会不会违规 / 限流 / 封号""帮我改成合规说法""被封了怎么申诉"时：

1. 读 `SKILL.md`，按其中的审核流程、风险定级和输出格式工作。
2. 每次审核读 `references/rules.md`；逐词排查和给替代说法读 `references/lexicon.md`；处理违规后与申诉读 `references/appeal.md`。
3. 能执行命令时，先用 `python3 scripts/scan.py <文件>`（或 `echo "文本" | python3 scripts/scan.py -`）做关键词初筛，再做语境判断。

安装：`npx zimeiti-weigui-shenhe`（把 skill 装进本机各 AI 工具）。终端里也可以直接用 `weigui` 命令，见 README。
