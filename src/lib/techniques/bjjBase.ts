/**
 * Base de Técnicas — Jiu-Jitsu Brasileiro (PT-BR)
 *
 * Curadoria sistemática das técnicas fundamentais do BJJ organizadas por
 * posição e categoria. Usado como seed inicial para academias novas e como
 * referência canônica para o catálogo `techniques`.
 *
 * Convenções:
 *  - position: nome canônico da posição em PT-BR (ex: "Guarda Fechada")
 *  - category: tipo do movimento (Finalização | Raspagem | Passagem |
 *              Defesa/Escape | Transição | Queda)
 *  - belt_level: white | blue | purple | brown | black
 *  - difficulty: 1 (mais simples) → 5 (mais avançado)
 *
 * Para adicionar técnicas: basta acrescentar ao array `BJJ_BASE_TECHNIQUES`.
 * O endpoint `technique.seedBjjBase` faz upsert idempotente por (academy, name).
 */

export type BjjPosition =
  | "Guarda Fechada"
  | "Guarda Aberta"
  | "Guarda De La Riva"
  | "Guarda Aranha"
  | "Meia-Guarda"
  | "Montada"
  | "Pegada nas Costas"
  | "100 Kilos"
  | "Norte-Sul"
  | "Joelho na Barriga"
  | "Tartaruga"
  | "Em Pé"

export type BjjCategory =
  | "Finalização"
  | "Raspagem"
  | "Passagem"
  | "Defesa/Escape"
  | "Transição"
  | "Queda"

export type BjjBelt = "white" | "blue" | "purple" | "brown" | "black"

export interface BjjTechniqueSeed {
  name: string
  description: string
  position: BjjPosition
  category: BjjCategory
  belt_level: BjjBelt
  difficulty: 1 | 2 | 3 | 4 | 5
  instructions: string
  key_points: string[]
  tags: string[]
}

// ─── Ordem canônica de exibição das posições ──────────────────────────────
export const BJJ_POSITION_ORDER: BjjPosition[] = [
  "Em Pé",
  "Guarda Fechada",
  "Guarda Aberta",
  "Guarda De La Riva",
  "Guarda Aranha",
  "Meia-Guarda",
  "Montada",
  "Pegada nas Costas",
  "100 Kilos",
  "Norte-Sul",
  "Joelho na Barriga",
  "Tartaruga",
]

export const BJJ_CATEGORY_ORDER: BjjCategory[] = [
  "Finalização",
  "Raspagem",
  "Passagem",
  "Defesa/Escape",
  "Transição",
  "Queda",
]

// ─── Catálogo de técnicas ─────────────────────────────────────────────────
export const BJJ_BASE_TECHNIQUES: BjjTechniqueSeed[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━ GUARDA FECHADA ━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: "Chave de Braço da Guarda Fechada",
    description: "Finalização clássica do BJJ. Hiperextensão do cotovelo a partir da guarda fechada.",
    position: "Guarda Fechada",
    category: "Finalização",
    belt_level: "white",
    difficulty: 1,
    instructions:
      "Quebre a postura do oponente puxando o colarinho. Pegue a manga do braço alvo. Faça o pummel/escape de quadril para fora, jogando o pé no quadril dele para girar. Suba a perna pelo rosto e estenda o quadril mantendo joelhos juntos.",
    key_points: [
      "Quebre a postura primeiro — sem isso, não há ataque",
      "Joelhos colados ao final para isolar o braço",
      "Polegar do oponente apontando para cima",
      "Eleve o quadril ao estender — não apenas puxe o braço",
    ],
    tags: ["chave-de-braço", "armbar", "fundamental"],
  },
  {
    name: "Triângulo da Guarda Fechada",
    description: "Estrangulamento com as pernas usando o próprio braço do oponente como bloqueio da carótida.",
    position: "Guarda Fechada",
    category: "Finalização",
    belt_level: "white",
    difficulty: 2,
    instructions:
      "Quebre a postura. Empurre um braço para dentro e o outro para fora. Suba a canela na nuca, prenda o tornozelo atrás do joelho contrário formando o número 4. Puxe a cabeça e ajuste o ângulo.",
    key_points: [
      "Um braço dentro, um braço fora — regra de ouro",
      "Ajuste o ângulo: gire o quadril 30° antes de fechar",
      "Puxe a cabeça com as duas mãos para pressurizar",
      "Joelho fechado em cima do ombro do oponente",
    ],
    tags: ["triângulo", "estrangulamento", "fundamental"],
  },
  {
    name: "Kimura da Guarda Fechada",
    description: "Chave de ombro figura-4 a partir da guarda fechada.",
    position: "Guarda Fechada",
    category: "Finalização",
    belt_level: "white",
    difficulty: 2,
    instructions:
      "Sente-se no oponente em ângulo. Pegue o pulso dele com a mão do mesmo lado, passe seu outro braço por cima do tríceps dele e prenda seu próprio pulso (figura-4). Deite no chão controlando o pulso colado ao quadril dele e gire o braço dele atrás das costas.",
    key_points: [
      "Sente em ângulo (45°) — não fique de frente",
      "Pulso preso ao quadril do oponente, não ao seu",
      "Eleve o cotovelo dele para travar o ombro",
      "Use a perna por cima das costas para impedir o rolamento",
    ],
    tags: ["kimura", "chave-de-ombro", "fundamental"],
  },
  {
    name: "Omoplata",
    description: "Chave de ombro usando a perna como alavanca, a partir da guarda fechada.",
    position: "Guarda Fechada",
    category: "Finalização",
    belt_level: "blue",
    difficulty: 3,
    instructions:
      "Quebre a postura e controle a manga. Faça o ângulo girando o quadril, jogue a canela por cima do ombro do oponente. Sente-se enquanto pivota, mantenha o controle do quadril dele e force o ombro para frente.",
    key_points: [
      "O ângulo é tudo — sem ele, ele rola para fora",
      "Mantenha controle do quadril após sentar",
      "Pressione o ombro para a frente, não para baixo",
      "Use a outra perna para bloquear o rolamento",
    ],
    tags: ["omoplata", "chave-de-ombro"],
  },
  {
    name: "Estrangulamento Cruzado da Guarda",
    description: "Estrangulamento de carótidas com as duas mãos cruzadas no colarinho.",
    position: "Guarda Fechada",
    category: "Finalização",
    belt_level: "blue",
    difficulty: 2,
    instructions:
      "Pegue o colarinho profundo do oponente com a primeira mão (palma para cima). A segunda mão entra por baixo da primeira (palma para cima também) pegando o outro lado. Puxe os cotovelos para o seu peito e expanda o peito.",
    key_points: [
      "Quanto mais profunda a pegada, melhor",
      "Cotovelos para o peito, não para os lados",
      "Use a quebra de postura simultaneamente",
      "Pressão é nas carótidas, não na traqueia",
    ],
    tags: ["estrangulamento", "cruzado", "gi"],
  },
  {
    name: "Gravata Mata-Leão de Frente (Guilhotina)",
    description: "Estrangulamento frontal da guarda fechada quando o oponente abaixa a cabeça.",
    position: "Guarda Fechada",
    category: "Finalização",
    belt_level: "white",
    difficulty: 2,
    instructions:
      "Quando o oponente baixa a cabeça, passe o braço por baixo do pescoço dele. Pegue seu próprio pulso ou bíceps. Eleve o quadril e estenda as pernas para esticar o oponente, puxando as mãos para cima e para o seu peito.",
    key_points: [
      "Pulso fino do antebraço cravado na garganta",
      "Pernas esticadas alongam o pescoço dele",
      "Puxe para cima, não para os lados",
      "Cuidado com a fuga pelo lado oposto ao braço",
    ],
    tags: ["guilhotina", "estrangulamento", "fundamental"],
  },
  {
    name: "Raspagem de Flor de Lótus",
    description: "Raspagem clássica da guarda fechada quebrando o equilíbrio para o lado.",
    position: "Guarda Fechada",
    category: "Raspagem",
    belt_level: "white",
    difficulty: 1,
    instructions:
      "Pegue a manga e a perna do mesmo lado do oponente. Inicie quebrando a postura. Levante o quadril e jogue ele para o lado oposto da perna que você segura, ao mesmo tempo que rola por cima.",
    key_points: [
      "Controle a manga ANTES de levantar quadril",
      "Pegue por baixo da panturrilha, não no joelho",
      "Use o gancho com a perna no quadril dele",
      "Termine na montada com base larga",
    ],
    tags: ["raspagem", "flor-de-lótus", "fundamental"],
  },
  {
    name: "Raspagem de Pêndulo (Hip Bump)",
    description: "Raspagem básica em movimento de balanço para sentar e derrubar o oponente.",
    position: "Guarda Fechada",
    category: "Raspagem",
    belt_level: "white",
    difficulty: 1,
    instructions:
      "Abra a guarda. Pegue a manga oposta com sua mão. Sente-se em direção ao lado do braço pego, jogando seu peso por cima do braço dele. Use o quadril como pivô e role-o para o lado.",
    key_points: [
      "Sente em direção ao braço — não para trás",
      "Posto o ombro dele no chão antes de subir",
      "Mantenha a manga presa o tempo todo",
      "Termine direto na montada",
    ],
    tags: ["raspagem", "hip-bump", "fundamental"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━ GUARDA ABERTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: "Triângulo da Guarda Aberta",
    description: "Triângulo aplicado em situação dinâmica de guarda aberta com pegadas de manga e gola.",
    position: "Guarda Aberta",
    category: "Finalização",
    belt_level: "blue",
    difficulty: 3,
    instructions:
      "Da guarda aberta com pegada de manga e gola, controle o braço do oponente e jogue sua canela na nuca. Feche o número 4 e ajuste o ângulo para o estrangulamento.",
    key_points: [
      "Quebre a postura usando a gola",
      "Use o pé no quadril para criar ângulo",
      "Não solte o braço de dentro até travar",
      "Quadris elevados para finalizar",
    ],
    tags: ["triângulo", "guarda-aberta"],
  },
  {
    name: "Raspagem de Borboleta",
    description: "Raspagem com gancho duplo nas coxas do oponente, alavancando para o lado.",
    position: "Guarda Aberta",
    category: "Raspagem",
    belt_level: "white",
    difficulty: 2,
    instructions:
      "Sente-se com os dois pés cruzados nos quadris do oponente (ganchos de borboleta). Pegue underhook em um lado. Caia para o lado oposto do underhook elevando o gancho do mesmo lado para jogar o oponente por cima.",
    key_points: [
      "Underhook profundo é essencial",
      "Caia para o lado, não para trás",
      "Eleve apenas um gancho — o que quer levantar",
      "Termine em joelho na barriga ou montada",
    ],
    tags: ["borboleta", "raspagem", "fundamental"],
  },
  {
    name: "Raspagem de X-Guard",
    description: "Raspagem desestabilizando o oponente em pé a partir da guarda X.",
    position: "Guarda Aberta",
    category: "Raspagem",
    belt_level: "purple",
    difficulty: 4,
    instructions:
      "Entre na X-Guard mergulhando por baixo de uma perna do oponente em pé, com seus tornozelos cruzados em forma de X atrás do joelho dele. Empurre o joelho de cima dele para fora enquanto puxa o pé de baixo, derrubando-o.",
    key_points: [
      "Tornozelos cruzados em X firme",
      "Cabeça baixo da linha do joelho",
      "Use a perna externa como alavanca",
      "Termine em pé, em raspagem completa",
    ],
    tags: ["x-guard", "raspagem", "avançada"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━ GUARDA DE LA RIVA ━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: "Berimbolo",
    description: "Inversão dinâmica saindo da De La Riva direto para as costas do oponente.",
    position: "Guarda De La Riva",
    category: "Transição",
    belt_level: "purple",
    difficulty: 5,
    instructions:
      "Da De La Riva com pegada na manga, role para baixo invertendo o quadril e levando suas pernas por cima. Continue o rolamento até cair de costas para baixo dele, com pegada na perna e nas costas.",
    key_points: [
      "Cabeça plantada no tatame para o pivô",
      "Pegada de manga não pode soltar",
      "Use a outra mão na perna do oponente",
      "Termine cravando ganchos nas costas",
    ],
    tags: ["berimbolo", "de-la-riva", "moderna"],
  },
  {
    name: "Raspagem de De La Riva (Sweep Básico)",
    description: "Raspagem clássica empurrando o joelho de longe e puxando o de perto.",
    position: "Guarda De La Riva",
    category: "Raspagem",
    belt_level: "blue",
    difficulty: 3,
    instructions:
      "Com o gancho de DLR enrolado na perna do oponente e a outra perna empurrando o joelho oposto, pegue a manga do mesmo lado do gancho. Puxe a manga para baixo enquanto empurra o joelho contrário para fora.",
    key_points: [
      "Gancho da DLR profundo, atrás do joelho",
      "Pegada de manga sempre presente",
      "Empurre o joelho — não chute",
      "Termine em pé já passando a guarda",
    ],
    tags: ["de-la-riva", "raspagem"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━ GUARDA ARANHA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: "Triângulo da Guarda Aranha",
    description: "Triângulo entrando da posição de aranha com controle dos dois bíceps.",
    position: "Guarda Aranha",
    category: "Finalização",
    belt_level: "purple",
    difficulty: 4,
    instructions:
      "Da guarda aranha com pés nos bíceps e mãos nas mangas, eleve um pé para o quadril do oponente. Solte uma manga e jogue a perna por cima do ombro fechando o triângulo.",
    key_points: [
      "Não perca a outra pegada de manga",
      "Eleve quadris para criar ângulo no triângulo",
      "Cabeça do oponente sempre forçada para baixo",
      "Pés flexionados nos bíceps até a transição",
    ],
    tags: ["triângulo", "aranha"],
  },
  {
    name: "Raspagem de Aranha Balão",
    description: "Raspagem clássica da guarda aranha jogando o oponente por cima usando os pés nos bíceps.",
    position: "Guarda Aranha",
    category: "Raspagem",
    belt_level: "blue",
    difficulty: 3,
    instructions:
      "Da guarda aranha, eleve os dois pés nos bíceps do oponente como se fosse acelerar. Quando ele resistir empurrando para frente, use o impulso para erguê-lo e levá-lo por cima de você, terminando montada.",
    key_points: [
      "Use o peso dele contra ele",
      "Pés totalmente estendidos no ápice",
      "Mãos seguram as mangas firmes",
      "Vire o quadril para terminar montada",
    ],
    tags: ["aranha", "balão", "raspagem"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━ MEIA-GUARDA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: "Raspagem Old School",
    description: "Raspagem clássica da meia-guarda agarrando o tornozelo e usando o peso.",
    position: "Meia-Guarda",
    category: "Raspagem",
    belt_level: "white",
    difficulty: 2,
    instructions:
      "Da meia-guarda inferior, conquiste o underhook profundo. Saia para o lado, abrace o tornozelo do oponente com a outra mão. Caia para o lado oposto pegando o tornozelo com força e levantando.",
    key_points: [
      "Underhook profundo, axila a axila",
      "Cabeça do mesmo lado do underhook",
      "Tornozelo abraçado, não só segurado",
      "Termine em joelho na barriga",
    ],
    tags: ["meia-guarda", "old-school", "fundamental"],
  },
  {
    name: "Kimura Trap da Meia-Guarda",
    description: "Captura do braço em kimura para finalização ou transição a partir da meia-guarda.",
    position: "Meia-Guarda",
    category: "Finalização",
    belt_level: "blue",
    difficulty: 3,
    instructions:
      "Da meia-guarda inferior, quando o oponente plantar o braço para basear, prenda o pulso dele com a mão de cima e passe o outro braço por cima do tríceps fechando a figura-4. Use o controle para finalizar ou raspar.",
    key_points: [
      "Aperte o pulso colado ao seu peito",
      "Eleve o cotovelo dele para travar",
      "Use a perna para impedir rolamento",
      "Pode virar raspagem se ele resistir",
    ],
    tags: ["kimura", "meia-guarda", "trap"],
  },
  {
    name: "Recuperação de Guarda da Meia",
    description: "Voltar para guarda fechada ou aberta a partir da meia-guarda inferior.",
    position: "Meia-Guarda",
    category: "Defesa/Escape",
    belt_level: "white",
    difficulty: 2,
    instructions:
      "Da meia-guarda inferior, encaixe a ponta do pé no quadril ou coxa interna do oponente. Use o quadril (escape de quadril) para criar espaço e soltar a perna presa, recuperando guarda completa.",
    key_points: [
      "Frame com mão e antebraço no pescoço dele",
      "Quadril girado para o lado",
      "Solte a perna passando o joelho",
      "Pé no quadril mantém distância",
    ],
    tags: ["meia-guarda", "recuperação", "fundamental"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ MONTADA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: "Americana da Montada",
    description: "Chave de ombro figura-4 com o braço do oponente pregado no chão.",
    position: "Montada",
    category: "Finalização",
    belt_level: "white",
    difficulty: 1,
    instructions:
      "Da montada, quando o oponente empurrar você, prenda o pulso dele no chão (palma para baixo) com a mão do mesmo lado. Passe o outro braço por baixo do braço dele e pegue seu próprio pulso (figura-4). Arraste o cotovelo dele para o quadril dele.",
    key_points: [
      "Cotovelo do oponente em 90°",
      "Arraste o cotovelo para o quadril dele, não para a cabeça",
      "Mantenha o pulso dele colado no chão",
      "Postura alta na montada para pressionar",
    ],
    tags: ["americana", "montada", "fundamental"],
  },
  {
    name: "Chave de Braço da Montada",
    description: "Armbar saindo da montada quando o oponente empurra ou tenta se virar.",
    position: "Montada",
    category: "Finalização",
    belt_level: "white",
    difficulty: 2,
    instructions:
      "Da montada, isole o braço do oponente puxando para o seu peito. Pivote em direção à cabeça dele, apoie um joelho na orelha dele e gire por cima. Sente-se com o braço entre suas pernas e estenda o quadril.",
    key_points: [
      "Joelho próximo da orelha dele",
      "Polegar dele apontando para cima",
      "Joelhos colados após sentar",
      "Eleve o quadril para finalizar",
    ],
    tags: ["chave-de-braço", "montada", "fundamental"],
  },
  {
    name: "Ezequiel da Montada",
    description: "Estrangulamento usando a manga do próprio kimono como ponto de pressão.",
    position: "Montada",
    category: "Finalização",
    belt_level: "blue",
    difficulty: 2,
    instructions:
      "Da montada, passe um braço por baixo da nuca do oponente. Com a outra mão, pegue dentro da sua própria manga do braço que está embaixo. Use o nó do kimono como lâmina de estrangulamento na traqueia dele e contraia.",
    key_points: [
      "Manga reforçada cria a pressão",
      "Mantenha postura alta",
      "Aperte os cotovelos juntos",
      "Funciona também em montada técnica",
    ],
    tags: ["ezequiel", "estrangulamento", "gi"],
  },
  {
    name: "Triângulo da Montada",
    description: "Triângulo aplicado a partir da montada quando o oponente empurra com um braço.",
    position: "Montada",
    category: "Finalização",
    belt_level: "purple",
    difficulty: 4,
    instructions:
      "Da montada quando o oponente empurra um braço, isole-o e gire 90° em direção ao mesmo lado do braço. Jogue a perna por cima da cabeça dele fechando o triângulo enquanto cai para o lado oposto.",
    key_points: [
      "Comprometa a 90° antes de fechar",
      "Mantenha o quadril pesado",
      "Termine de costas para fechar firme",
      "Puxe a cabeça dele junto",
    ],
    tags: ["triângulo", "montada"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━ PEGADA NAS COSTAS ━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: "Mata-Leão",
    description: "Estrangulamento clássico das costas com o antebraço.",
    position: "Pegada nas Costas",
    category: "Finalização",
    belt_level: "white",
    difficulty: 1,
    instructions:
      "Das costas com ganchos travados, passe um braço por baixo do queixo do oponente até que o cotovelo fique alinhado com o queixo dele. Pegue seu próprio bíceps oposto e coloque a mão da outra mão atrás da cabeça dele, contraindo.",
    key_points: [
      "Queixo dele em cima do seu cotovelo",
      "Esmague carótidas, não a traqueia",
      "Não cruze os pés (perigo de chave de pé)",
      "Use as costas e os braços, não só os bíceps",
    ],
    tags: ["mata-leão", "estrangulamento", "fundamental"],
  },
  {
    name: "Estrangulamento Bow and Arrow",
    description: "Estrangulamento de gola das costas alavancando com a perna.",
    position: "Pegada nas Costas",
    category: "Finalização",
    belt_level: "blue",
    difficulty: 3,
    instructions:
      "Das costas, pegue a gola profunda (palma para cima) com a mão do mesmo lado do braço que está por cima do ombro. Solte o gancho do mesmo lado e jogue a perna por cima do ombro dele. Puxe a gola e estique a perna como um arco.",
    key_points: [
      "Pegada na gola tem que ser profunda",
      "Perna ao redor do braço dele",
      "Cabeça dele puxada para o seu peito",
      "Posição extremamente forte — 95% finaliza",
    ],
    tags: ["bow-and-arrow", "estrangulamento", "gi"],
  },
  {
    name: "Chave de Braço das Costas",
    description: "Armbar quando o estrangulamento falha e o oponente defende com a mão.",
    position: "Pegada nas Costas",
    category: "Finalização",
    belt_level: "blue",
    difficulty: 3,
    instructions:
      "Das costas, quando o oponente bloqueia o estrangulamento com uma das mãos, prenda esse braço entre o seu peito e o braço dele. Gire para o lado oposto saindo das costas e apoiando o pé no rosto/ombro dele. Estenda o braço.",
    key_points: [
      "Aproveite a defesa dele como ataque",
      "Trave o braço antes de soltar gancho",
      "Pé no rosto, não no chão",
      "Sai das costas sem perder a finalização",
    ],
    tags: ["chave-de-braço", "costas"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100 KILOS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: "Americana do 100 Kilos",
    description: "Chave de ombro figura-4 a partir da posição lateral.",
    position: "100 Kilos",
    category: "Finalização",
    belt_level: "white",
    difficulty: 1,
    instructions:
      "Do 100 kilos, isole o braço do oponente do lado da cabeça. Pregue o pulso dele no tatame com sua mão. Passe o outro braço por baixo do tríceps formando figura-4. Arraste o cotovelo para o quadril dele.",
    key_points: [
      "Cotovelo dele em ângulo de 90°",
      "Pressão de peso no peito dele",
      "Arraste cotovelo, não levante",
      "Cabeça abaixada para impedir fuga",
    ],
    tags: ["americana", "100-kilos", "fundamental"],
  },
  {
    name: "Kimura do 100 Kilos",
    description: "Kimura quando o oponente coloca o braço entre vocês para empurrar.",
    position: "100 Kilos",
    category: "Finalização",
    belt_level: "white",
    difficulty: 2,
    instructions:
      "Quando o oponente colocar o braço de baixo entre vocês para defender, prenda o pulso dele com sua mão da cabeça. Passe o outro braço por baixo formando figura-4. Gire o braço dele para trás das costas.",
    key_points: [
      "Mão dele plantada vira oportunidade",
      "Mantenha pressão de peso",
      "Sente para criar ângulo",
      "Cuidado com a fuga para a guarda",
    ],
    tags: ["kimura", "100-kilos"],
  },
  {
    name: "Transição para Montada",
    description: "Movimento básico subindo do 100 kilos para montada.",
    position: "100 Kilos",
    category: "Transição",
    belt_level: "white",
    difficulty: 2,
    instructions:
      "Do 100 kilos, passe o joelho de baixo por cima da barriga do oponente devagar, mantendo o peso no peito dele. Puxe o pé do gancho de fora para que ele não tenha espaço para inserir a meia-guarda.",
    key_points: [
      "Joelho ao quadril, não à perna",
      "Peso constante no peito dele",
      "Pé fora do alcance dele",
      "Mãos controlando para impedir frame",
    ],
    tags: ["transição", "100-kilos", "montada"],
  },
  {
    name: "Chave de Braço do 100 Kilos",
    description: "Armbar isolando o braço de cima ou de baixo na lateral.",
    position: "100 Kilos",
    category: "Finalização",
    belt_level: "blue",
    difficulty: 3,
    instructions:
      "Quando o oponente estender o braço empurrando o seu pescoço/ombro, agarre o braço dele com as duas mãos. Suba o joelho próximo ao ombro dele, gire para a chave de braço sentando-se e estendendo o quadril.",
    key_points: [
      "Pegue o braço dele bem isolado",
      "Joelho próximo do ombro dele para travar",
      "Caia em direção aos pés dele",
      "Polegar para cima ao finalizar",
    ],
    tags: ["chave-de-braço", "100-kilos"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━ NORTE-SUL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: "Estrangulamento Norte-Sul",
    description: "Estrangulamento clássico aplicado da posição norte-sul (cabeça contra cabeça).",
    position: "Norte-Sul",
    category: "Finalização",
    belt_level: "purple",
    difficulty: 4,
    instructions:
      "Do norte-sul, prenda o braço próximo do oponente com seu underhook. Encaixe o ombro dele no seu queixo e o seu ombro na garganta dele. Aperte os cotovelos e baixe o peso.",
    key_points: [
      "Ombro pressiona a garganta",
      "Cotovelos colados ao seu corpo",
      "Cabeça do oponente embaixo do seu peito",
      "Pernas largas para base",
    ],
    tags: ["norte-sul", "estrangulamento"],
  },
  {
    name: "Kimura do Norte-Sul",
    description: "Kimura aplicada do norte-sul controlando o braço do oponente.",
    position: "Norte-Sul",
    category: "Finalização",
    belt_level: "blue",
    difficulty: 3,
    instructions:
      "Do norte-sul, isole o braço do oponente trazendo-o para cima da cabeça dele. Forme a figura-4 e gire o braço dele atrás das costas, sentando para o lado.",
    key_points: [
      "Isole bem o braço antes de fechar",
      "Cuidado para não perder a posição",
      "Use o quadril para gerar pressão",
      "Termine ajoelhado ao lado",
    ],
    tags: ["kimura", "norte-sul"],
  },

  // ━━━━━━━━━━━━━━━━━━━ JOELHO NA BARRIGA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: "Chave de Braço do Joelho na Barriga",
    description: "Armbar quando o oponente empurra o joelho com as duas mãos.",
    position: "Joelho na Barriga",
    category: "Finalização",
    belt_level: "blue",
    difficulty: 3,
    instructions:
      "Do joelho na barriga, quando o oponente empurra seu joelho com as duas mãos, isole o braço de cima dele. Gire em direção à cabeça dele e jogue a perna por cima do rosto fechando a chave de braço.",
    key_points: [
      "Use a defesa dele como entrada",
      "Joelho na barriga = pressão constante",
      "Pegada firme antes de pular",
      "Caia controlando o braço",
    ],
    tags: ["chave-de-braço", "joelho-na-barriga"],
  },
  {
    name: "Estrangulamento Brabo",
    description: "Estrangulamento de gola entrando do joelho na barriga.",
    position: "Joelho na Barriga",
    category: "Finalização",
    belt_level: "purple",
    difficulty: 4,
    instructions:
      "Do joelho na barriga, pegue a gola oposta com a mão do mesmo lado do joelho. Mude para o lado oposto trazendo a outra mão pelo pescoço dele e cruzando os antebraços. Aperte.",
    key_points: [
      "Pegada profunda na gola primeiro",
      "Antebraços cruzados na garganta",
      "Mude de lado para fechar a pressão",
      "Pode terminar do 100 kilos do outro lado",
    ],
    tags: ["brabo", "estrangulamento", "gi"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━ TARTARUGA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: "Tomada das Costas da Tartaruga",
    description: "Inserir os ganchos quando o oponente está na posição de tartaruga.",
    position: "Tartaruga",
    category: "Transição",
    belt_level: "white",
    difficulty: 2,
    instructions:
      "Com o oponente na tartaruga, fique do lado dele. Encaixe um gancho passando o pé por dentro da coxa dele. Puxe-o para o seu lado caindo de costas, encaixando o segundo gancho durante o movimento.",
    key_points: [
      "Um gancho de cada vez",
      "Caia para o lado, não para trás",
      "Mantenha o controle do colarinho",
      "Termine com os dois ganchos travados",
    ],
    tags: ["tartaruga", "costas", "transição"],
  },
  {
    name: "Relógio (Clock Choke)",
    description: "Estrangulamento clássico com o oponente em tartaruga, girando como ponteiro de relógio.",
    position: "Tartaruga",
    category: "Finalização",
    belt_level: "blue",
    difficulty: 3,
    instructions:
      "Pegue a gola distante do oponente passando o braço por cima do pescoço dele. Apoie peito no ombro dele e caminhe ao redor da cabeça dele como ponteiro de relógio, apertando a gola.",
    key_points: [
      "Gola profunda é essencial",
      "Caminhe — não fique parado",
      "Use peso para pressionar",
      "Trave a outra mão no quadril dele",
    ],
    tags: ["relógio", "clock-choke", "gi"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ EM PÉ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: "Osoto Gari",
    description: "Queda básica de Judô — gancho externo na perna do oponente.",
    position: "Em Pé",
    category: "Queda",
    belt_level: "white",
    difficulty: 2,
    instructions:
      "Com pegada de gola e manga, dê um passo profundo ao lado do pé dele. Use a perna externa em forma de gancho atrás da perna dele e jogue-a para frente enquanto puxa o tronco para trás.",
    key_points: [
      "Cabeça dele para o lado, não para trás",
      "Quebrar o equilíbrio antes",
      "Perna alta — quase paralela ao chão",
      "Puxe a manga para baixo",
    ],
    tags: ["osoto-gari", "queda", "judô"],
  },
  {
    name: "Ouchi Gari",
    description: "Queda básica de Judô com gancho interno na perna do oponente.",
    position: "Em Pé",
    category: "Queda",
    belt_level: "white",
    difficulty: 2,
    instructions:
      "Com pegada de gola e manga, force o oponente a pisar para trás. Quando ele plantar, encaixe seu pé interno por dentro da panturrilha dele e empurre para trás puxando-o para baixo.",
    key_points: [
      "Crie o passo dele primeiro",
      "Joelhos próximos ao quebrar",
      "Empurrar e puxar simultâneo",
      "Termine montada se possível",
    ],
    tags: ["ouchi-gari", "queda", "judô"],
  },
  {
    name: "Puxada de Guarda Sentada",
    description: "Sentar na guarda com pegada de manga e gola para começar o jogo no chão.",
    position: "Em Pé",
    category: "Queda",
    belt_level: "white",
    difficulty: 1,
    instructions:
      "Pegue manga e gola do oponente. Coloque o pé no quadril dele e sente-se de forma controlada, mantendo as pegadas. Já comece a configurar a guarda escolhida ao tocar o chão.",
    key_points: [
      "Pegadas firmes ANTES de sentar",
      "Pé no quadril para distância",
      "Não caia — sente",
      "Tenha um plano de guarda pronto",
    ],
    tags: ["puxar-guarda", "esportivo", "fundamental"],
  },
  {
    name: "Single Leg (Entrada de Perna)",
    description: "Entrada para a perna mais próxima do oponente para derrubá-lo.",
    position: "Em Pé",
    category: "Queda",
    belt_level: "blue",
    difficulty: 3,
    instructions:
      "De luta em pé, mude o nível baixando o quadril e dispare em direção a uma das pernas dele. Abrace a coxa dele, encoste a cabeça do lado externo e levante-o, derrubando para o lado.",
    key_points: [
      "Mude o nível primeiro — não abaixe a cabeça",
      "Cabeça SEMPRE no lado externo",
      "Joelho do oponente travado contra seu peito",
      "Termine passando para a lateral",
    ],
    tags: ["single-leg", "queda", "wrestling"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━ DEFESAS / ESCAPES ━━━━━━━━━━━━━━━━━━━━━━━━
  {
    name: "Fuga de Quadril (Escape Elementar)",
    description: "Movimento fundamental para criar espaço debaixo do oponente.",
    position: "Montada",
    category: "Defesa/Escape",
    belt_level: "white",
    difficulty: 1,
    instructions:
      "Da montada inferior, plante uma perna e empurre o quadril para o lado oposto, criando espaço. Use os cotovelos como frame contra os joelhos do oponente. Insira o joelho para recuperar a meia-guarda.",
    key_points: [
      "Frame com antebraços antes de mexer",
      "Quadril SEMPRE para o lado",
      "Joelho entra primeiro, depois o pé",
      "Movimento básico do BJJ",
    ],
    tags: ["fuga-de-quadril", "escape", "fundamental"],
  },
  {
    name: "Fuga de Montada (Upa)",
    description: "Inversão clássica da montada usando o quadril e o braço do oponente.",
    position: "Montada",
    category: "Defesa/Escape",
    belt_level: "white",
    difficulty: 1,
    instructions:
      "Da montada inferior, prenda um braço do oponente com as duas mãos. Trave o pé do mesmo lado por dentro do dele. Faça uma ponte explosiva para o lado bloqueado, rolando-o por cima.",
    key_points: [
      "Trave braço E perna do mesmo lado",
      "Ponte vertical, explosiva",
      "Termine direto na guarda",
      "Não bata o quadril sem travar",
    ],
    tags: ["upa", "escape-de-montada", "fundamental"],
  },
  {
    name: "Defesa de Mata-Leão",
    description: "Defesa do estrangulamento das costas antes que ele se trave.",
    position: "Pegada nas Costas",
    category: "Defesa/Escape",
    belt_level: "white",
    difficulty: 2,
    instructions:
      "Quando sentir o braço passando pelo pescoço, abaixe o queixo e leve as duas mãos no antebraço dele, puxando para baixo. Mova a cabeça para o lado do cotovelo para escapar pelos lados.",
    key_points: [
      "Queixo para baixo IMEDIATAMENTE",
      "Duas mãos no antebraço, não no pulso",
      "Saia para o lado do cotovelo",
      "Não tente arrancar — caminhe para o lado",
    ],
    tags: ["defesa", "mata-leão", "fundamental"],
  },
  {
    name: "Escape do 100 Kilos (Frame e Recuperação)",
    description: "Recuperar guarda ou virar para joelhos saindo da posição lateral.",
    position: "100 Kilos",
    category: "Defesa/Escape",
    belt_level: "white",
    difficulty: 2,
    instructions:
      "Do 100 kilos inferior, coloque o antebraço no pescoço dele (frame). Empurre o quadril para o lado contrário e insira o joelho entre vocês para recuperar a meia-guarda ou fechar a guarda.",
    key_points: [
      "Frame ANTES de mexer o quadril",
      "Não empurre — quadril faz o trabalho",
      "Joelho entra como cunha",
      "Cabeça nunca fica embaixo do braço dele",
    ],
    tags: ["escape", "100-kilos", "fundamental"],
  },
  {
    name: "Escape de Chave de Braço (Hitchhiker)",
    description: "Defesa giratória clássica para sair de uma chave de braço aplicada.",
    position: "Montada",
    category: "Defesa/Escape",
    belt_level: "blue",
    difficulty: 3,
    instructions:
      "Quando preso em chave de braço com o cotovelo ainda flexionado, gire o polegar para o chão (como pedindo carona) e role na mesma direção do braço, retirando-o pela rotação antes da hiperextensão.",
    key_points: [
      "Polegar para baixo — gira o ombro",
      "Role NO MOMENTO certo, não tarde",
      "Cotovelo precisa estar flexionado",
      "Risco — só funciona com timing",
    ],
    tags: ["hitchhiker", "escape", "chave-de-braço"],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Conta quantas técnicas existem para cada posição. Útil para mostrar
 * contadores ao lado de cada filtro.
 */
export function countByPosition(): Record<BjjPosition, number> {
  const out = {} as Record<BjjPosition, number>
  for (const p of BJJ_POSITION_ORDER) out[p] = 0
  for (const t of BJJ_BASE_TECHNIQUES) {
    out[t.position] = (out[t.position] ?? 0) + 1
  }
  return out
}

/**
 * Conta total de técnicas no catálogo seed. Usado para feedback do
 * "importar base" no UI.
 */
export const BJJ_BASE_COUNT = BJJ_BASE_TECHNIQUES.length
