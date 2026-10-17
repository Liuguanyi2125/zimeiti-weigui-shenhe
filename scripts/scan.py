#!/usr/bin/env python3
"""自媒体违规初筛：关键词命中扫描（只做第一道"违禁词抓取"，语境判断仍需人工/模型）。

用法:
  python3 -I scan.py 文案.txt
  echo "文本" | python3 -I scan.py -
"""
import json
import os
import re
import sys

# 规则与 Node 版 weigui 共用：scripts/rules.json
with open(os.path.join(os.path.dirname(os.path.realpath(__file__)), "rules.json"), encoding="utf-8") as _f:
    RULES = [(r["level"], r["category"], r["pattern"], r["tip"]) for r in json.load(_f)]


def scan(text):
    hits = []
    for lineno, line in enumerate(text.splitlines(), 1):
        for level, cat, pat, tip in RULES:
            for m in re.finditer(pat, line):
                hits.append((lineno, level, cat, m.group(0), tip, line.strip()))
    return hits


def format_hits(hits):
    if not hits:
        return "✅ 关键词初筛未命中（仍需做语境识别和 12 范围检查）"
    order = {"🔴": 0, "🟠": 1, "🟡": 2, "⚪": 3}
    hits = sorted(hits, key=lambda h: (order[h[1]], h[0]))
    out = [f"命中 {len(hits)} 处：", "", "| 行 | 等级 | 类别 | 命中 | 建议 | 原句 |", "|---|---|---|---|---|---|"]
    for lineno, level, cat, word, tip, line in hits:
        snippet = line if len(line) <= 40 else line[:40] + "…"
        out.append(f"| {lineno} | {level} | {cat} | {word} | {tip} | {snippet} |")
    out.append("")
    out.append("注：初筛有误报/漏报，最终结论需结合场景（短视频/直播/挂车/投流）和上下文判断。")
    return "\n".join(out)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    src = sys.argv[1]
    text = sys.stdin.read() if src == "-" else open(src, encoding="utf-8").read()
    print(format_hits(scan(text)))


if __name__ == "__main__":
    main()
