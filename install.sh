#!/usr/bin/env bash
# 安装：把 skill 链接到各 Agent 的 skills 目录，并把 weigui 命令放进 ~/.local/bin
# 用法：./install.sh            已存在的同名目录会跳过
#       ./install.sh --force    覆盖已存在的同名链接/目录（原目录会备份为 .bak）
set -euo pipefail

NAME="自媒体违规审核"
SRC="$(cd "$(dirname "$0")" && pwd)"
FORCE=0
[[ "${1:-}" == "--force" ]] && FORCE=1

link() {
  local dir="$1" target="$1/$NAME"
  mkdir -p "$dir"
  if [[ -L "$target" && "$(readlink "$target")" == "$SRC" ]]; then
    echo "✓ 已安装  $target"; return
  fi
  if [[ -e "$target" || -L "$target" ]]; then
    if [[ $FORCE -eq 0 ]]; then
      echo "· 跳过    $target（已存在，用 --force 覆盖）"; return
    fi
    mv "$target" "$target.bak.$(date +%s)"
  fi
  ln -s "$SRC" "$target"
  echo "✓ 链接    $target"
}

# 通用 skills 目录（Agent Skills 标准）+ 各家 Agent 的 skills 目录
link "$HOME/.agents/skills"
[[ -d "$HOME/.claude" ]] && link "$HOME/.claude/skills"
[[ -d "$HOME/.codex"  ]] && link "$HOME/.codex/skills"

chmod +x "$SRC/bin/weigui" "$SRC/scripts/scan.py"
mkdir -p "$HOME/.local/bin"
ln -sf "$SRC/bin/weigui" "$HOME/.local/bin/weigui"
echo "✓ 命令    ~/.local/bin/weigui"

case ":$PATH:" in
  *":$HOME/.local/bin:"*) ;;
  *) echo "⚠ ~/.local/bin 不在 PATH 中，请在 shell 配置里加：export PATH=\"\$HOME/.local/bin:\$PATH\"" ;;
esac
echo "完成。试试：weigui scan -t '学完月入10万，加V私信我'"
