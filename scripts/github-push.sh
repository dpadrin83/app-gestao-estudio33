#!/usr/bin/env bash
# Publica o Hub no GitHub (rode no terminal, na raiz do projeto).
set -euo pipefail
cd "$(dirname "$0")/.."

REPO_NAME="${1:-hub-estudio33}"

echo "→ Verificando login GitHub..."
gh auth status || { echo "Rode: gh auth login"; exit 1; }

echo "→ Criando repositório ${REPO_NAME} (privado)..."
gh repo create "$REPO_NAME" --private --source=. --remote=origin --push

echo ""
echo "✓ Push concluído. Próximo passo: importar em https://vercel.com/new"
echo "  Variáveis: docs/PRE-DEPLOY.md seção A"
