# 自媒体违规审核 Skill

适用于 Claude Code 的 skill：审核抖音 / 视频号的短视频文案、直播话术、标题封面、简介、评论区、私信客服话术和商品详情页，给出**风险等级 + 命中依据 + 合规改写**，也能指导违规后的处理与申诉。

## 能力

- 按身份层次（短视频 → 直播 → 挂车 → 投流）判断尺度
- 关键词抓取 + 语境叠加 + 人工巡查三层视角排雷
- 覆盖 12 项直播审核范围（封面、标题、话术、贴片、连麦、评论区、背景等）
- 一 / 二 / 三级违规与隐形限流定级
- 广告法极限词、电商违规营销（诱导好评、诱骗秒杀、违规买赠等）
- 违规后处理守则与申诉模板

## 安装

```bash
git clone https://github.com/Liuguanyi2125/zimeiti-weigui-shenhe.git ~/.claude/skills/自媒体违规审核
```

然后在 Claude Code 里说「帮我审核这段直播话术」「这句话会不会违规」即可触发。

## 结构

```
SKILL.md                 主提示词：流程、定级、输出格式、改写原则
references/rules.md      规则全集（平台规则条款 + 实操经验）
references/lexicon.md    高危词库与替代说法
references/appeal.md     违规后处理与申诉模板
scripts/scan.py          关键词初筛脚本
```

关键词初筛：

```bash
python3 -I scripts/scan.py 文案.txt
echo "文本" | python3 -I scripts/scan.py -
```

## 免责声明

内容依据平台公开规则与实操经验整理，平台规则随时更新，请以抖音、微信视频号官方最新公告为准。本项目仅用于帮助内容合规，不提供任何规避审核的方法。
