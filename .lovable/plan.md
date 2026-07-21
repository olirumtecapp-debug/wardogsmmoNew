
# Botão do teletransporte + mais barricadas + mini tanques

## 1. Botão do Teletransporte no arsenal (`WeaponCard`)
- Hoje o card mostra só um emoji pequeno e o nome "Teleport". No layout compacto do popup de armas ele fica quase invisível.
- Ajustes em `src/components/WarDogsGame.tsx` (grid do modal Arsenal):
  - Renomear para **"🌀 Teletransporte"** (nome completo, sem cortar).
  - Ícone maior (font-size do emoji igual aos demais principais, ~28px) e fundo com gradiente ciano/roxo distinto das armas ofensivas para diferenciar visualmente (utility slot).
  - Badge no canto: **"UTIL"** em azul-ciano, para deixar claro que não é bomba.
  - Legenda abaixo: **"Reposiciona · 5 HP"** em vez do texto atual.
- Mesma mudança visual replicada no botão de troca-rápida no HUD (se estiver selecionado, mostra 🌀 grande + "TELE").

## 2. Mais barricadas + empilhamento vertical (`src/game/engine.ts` → `spawnBarricades`)
- Aumentar quantidade base: `count = 5 + rng*4` (5..8 em vez de 3..5).
- Adicionar suporte a **pilhas**: para ~40% dos spawns, empilhar 2–3 barricadas na mesma coluna (ex.: container embaixo, saco de areia em cima; ou dois blocos de concreto).
  - Nova função `stackAt(x, sy, rng)`: escolhe 2–3 peças compatíveis, posiciona a primeira no chão, cada próxima em `y = anterior.y - spec.h`.
  - Mantém checagem de sobreposição horizontal com outras pilhas e distância mínima do dog (`minGapDog`).
- Adicionar novo `BarricadeKind: "minitank"` como decoração-barricada:
  - Dimensões ~ 56×28.
  - Comportamento igual às outras (mesma máscara/erosão), só muda a arte.

## 3. Mini tanque como barricada (arte em `src/game/render.ts` → `drawBarricadePattern`)
- Novo bloco `else if (kind === "minitank")`:
  - Corpo em tom militar (verde-oliva `#4a5a2e` → `#2f3a1c` gradiente).
  - Esteira inferior (retângulo escuro `#1a1a1a` com hachura de rodas — círculos pequenos espaçados).
  - Torre trapezoidal no topo (~60% da largura).
  - Canhão curto saindo da torre (retângulo `#222`).
  - Detalhe: estrela/insígnia branca no lateral.
- Como usa a mesma máscara pixel-por-pixel, o tanque também erode com explosões (perde canhão, torre, esteiras) — coerente com o resto.

## 4. Tipo em `src/game/types.ts`
- `BarricadeKind = "concrete" | "sandbag" | "container" | "minitank"`.
- Adicionar `{ k: "minitank", w: 56, h: 28 }` na lista de kinds do spawn com peso menor (aparece em ~1 a cada 3 barricadas).

## Fora de escopo
- Sem nova mecânica de dano/movimento pro tanque (é decoração destrutível, não veículo jogável).
- Sem mudança no teletransporte em si (só o visual do botão).
- Sem mexer em HUD principal, menus fora do arsenal, ou no mapa base.
