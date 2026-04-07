/**
 * Biblioteca local de técnicas de Jiu-Jitsu Brasileiro.
 *
 * Curadoria completa em PT-BR — sem dependência de IA externa, sem APIs.
 * Cada técnica traz: posição, faixa mínima, dificuldade, passo a passo,
 * pontos-chave, erros comuns, drill sugerido e tags de busca.
 *
 * Mantém-se simples, type-safe e zero-dep — pode rodar tanto no servidor
 * quanto no cliente. Adicione novas técnicas ao array `BJJ_TECHNIQUES`.
 */

export type TechniqueCategory =
  | "guarda"
  | "raspagem"
  | "passagem"
  | "finalizacao"
  | "escape"
  | "fundamento"

export type BeltLevel = "white" | "blue" | "purple" | "brown" | "black"

export interface BjjTechnique {
  id: string
  name: string
  aliases?: string[]
  category: TechniqueCategory
  position: string
  belt: BeltLevel
  difficulty: 1 | 2 | 3 | 4 | 5
  summary: string
  steps: string[]
  keyPoints: string[]
  commonMistakes: string[]
  drill: string
  related?: string[]
  tags: string[]
}

// ─── Categorias (UI helper) ───────────────────────────────────────────────

export const CATEGORY_META: Record<
  TechniqueCategory,
  { label: string; description: string; tone: string }
> = {
  guarda: {
    label: "Guardas",
    description: "Posições de baixo — controle pela perna",
    tone: "brand",
  },
  raspagem: {
    label: "Raspagens",
    description: "Inverter a posição e ficar por cima",
    tone: "cyan",
  },
  passagem: {
    label: "Passagens",
    description: "Vencer as pernas do adversário",
    tone: "amber",
  },
  finalizacao: {
    label: "Finalizações",
    description: "Estrangulamentos e chaves",
    tone: "rose",
  },
  escape: {
    label: "Escapes",
    description: "Fugir de posições ruins",
    tone: "violet",
  },
  fundamento: {
    label: "Fundamentos",
    description: "Base, pegadas e movimentação",
    tone: "emerald",
  },
}

export const BELT_META: Record<
  BeltLevel,
  { label: string; order: number; tone: string }
> = {
  white: { label: "Branca", order: 0, tone: "white" },
  blue: { label: "Azul", order: 1, tone: "blue" },
  purple: { label: "Roxa", order: 2, tone: "purple" },
  brown: { label: "Marrom", order: 3, tone: "amber" },
  black: { label: "Preta", order: 4, tone: "gray" },
}

// ─── Banco de técnicas ────────────────────────────────────────────────────

export const BJJ_TECHNIQUES: readonly BjjTechnique[] = [
  // ── FINALIZAÇÕES ────────────────────────────────────────────────────────
  {
    id: "mata-leao",
    name: "Mata-leão",
    aliases: ["rear naked choke", "rnc", "estrangulamento pelas costas"],
    category: "finalizacao",
    position: "Pegada nas costas",
    belt: "white",
    difficulty: 2,
    summary:
      "Estrangulamento sanguíneo pelas costas — a finalização mais icônica e segura do BJJ.",
    steps: [
      "Conquiste as costas com os dois ganchos firmes e a cintura colada.",
      "Passe um braço por baixo do queixo até o bíceps oposto.",
      "Coloque a mão livre atrás da cabeça do adversário.",
      "Aproxime os cotovelos como se fosse fechar um livro.",
      "Estufe o peito e estique levemente para finalizar.",
    ],
    keyPoints: [
      "Ombro do braço estrangulador colado no pescoço — sem espaço para o queixo entrar.",
      "Controle de cintura primeiro: sem ganchos firmes, qualquer estrangulamento escorrega.",
      "Aperto vem do peito e dorsal, não da força do bíceps.",
    ],
    commonMistakes: [
      "Tentar o estrangulamento antes de fixar os ganchos.",
      "Deixar o queixo do adversário descer e bloquear o braço.",
      "Cruzar as pernas na frente — vira armbar de tornozelo.",
    ],
    drill: "3 rounds de 1min: parceiro defende o pescoço enquanto você só busca a posição correta do braço.",
    related: ["bow-and-arrow", "ezequiel"],
    tags: ["estrangulamento", "costas", "pescoco", "rnc", "submission", "fundamental"],
  },
  {
    id: "triangulo",
    name: "Triângulo",
    aliases: ["triangle", "sankaku-jime"],
    category: "finalizacao",
    position: "Guarda fechada / aberta",
    belt: "white",
    difficulty: 2,
    summary:
      "Estrangulamento usando as pernas — fecha sobre o pescoço e um braço do adversário.",
    steps: [
      "Da guarda, controle uma manga e a nuca do oponente.",
      "Quebre a postura puxando a nuca para baixo.",
      "Empurre o braço controlado para o seu lado e jogue a perna do mesmo lado por cima do pescoço.",
      "Trave o tornozelo atrás do joelho da outra perna (figura 4).",
      "Puxe a cabeça e estique o quadril para finalizar.",
    ],
    keyPoints: [
      "Ângulo é tudo: gire o quadril 30°-45° para fora antes de fechar.",
      "Mantenha o ombro do oponente preso no chão para não escapar.",
      "Puxe a cabeça com as duas mãos se precisar — força do pescoço, não do braço.",
    ],
    commonMistakes: [
      "Tentar finalizar de frente, sem girar.",
      "Soltar o controle da postura no meio da montagem.",
      "Cruzar as pernas sem capturar o braço — vira fácil.",
    ],
    drill: "Drill de quadril: do guard, gire 45° dez vezes para cada lado puxando a manga oposta.",
    related: ["armbar", "omoplata"],
    tags: ["estrangulamento", "guarda", "pernas", "submission", "fundamental"],
  },
  {
    id: "armbar",
    name: "Chave de braço",
    aliases: ["armbar", "juji-gatame", "key arm"],
    category: "finalizacao",
    position: "Guarda fechada / montada",
    belt: "white",
    difficulty: 2,
    summary:
      "Hiperextensão do cotovelo controlando o braço com as pernas — clássico universal.",
    steps: [
      "Controle o pulso do braço alvo com as duas mãos.",
      "Plante o pé no quadril oposto para girar o quadril.",
      "Suba a perna por cima da cabeça do oponente.",
      "Junte os joelhos, polegar do oponente para cima.",
      "Eleve o quadril lentamente para a finalização.",
    ],
    keyPoints: [
      "Polegar do adversário apontando para o teto — alinhamento do cotovelo.",
      "Joelhos colados: se abrir, o braço escapa.",
      "Use o quadril, nunca puxe só com o braço.",
    ],
    commonMistakes: [
      "Esticar o quadril sem antes alinhar o pulso.",
      "Não controlar a cabeça do oponente — ele senta e esmaga.",
      "Joelhos abertos no momento de finalizar.",
    ],
    drill: "Solo drill: armbar no ar 10x cada lado, focando no movimento do quadril.",
    related: ["triangulo", "kimura"],
    tags: ["chave", "braco", "cotovelo", "guarda", "montada", "submission", "fundamental"],
  },
  {
    id: "kimura",
    name: "Kimura",
    aliases: ["ude-garami", "double wrist lock"],
    category: "finalizacao",
    position: "Guarda / 100kg / costas",
    belt: "white",
    difficulty: 2,
    summary:
      "Chave de ombro travando o braço em forma de figura 4. Versátil e brutal.",
    steps: [
      "Pegue o pulso do oponente com a mão do mesmo lado.",
      "Passe seu outro braço por dentro, agarrando seu próprio pulso (figura 4).",
      "Sente-se ou rotacione para fora, criando o ângulo.",
      "Leve a mão do oponente para as costas dele com rotação lenta.",
    ],
    keyPoints: [
      "O cotovelo dele tem que estar mais alto que o ombro.",
      "Quadril próximo, sem deixar ele rolar para cima de você.",
      "Movimento circular, não linear — torsão é a mecânica do golpe.",
    ],
    commonMistakes: [
      "Tentar com o cotovelo dele baixo — vira americana ou nada.",
      "Não isolar o braço, ele junta as mãos e impede.",
      "Forçar a rotação rápida — risco de lesão.",
    ],
    drill: "Da guarda: parceiro estende a mão, você captura e monta a figura 4 sem finalizar — 20 reps.",
    related: ["americana", "armbar"],
    tags: ["chave", "ombro", "figura-quatro", "guarda", "submission"],
  },
  {
    id: "americana",
    name: "Americana",
    aliases: ["ude-garami invertido", "keylock"],
    category: "finalizacao",
    position: "100 kilos / montada",
    belt: "white",
    difficulty: 2,
    summary:
      "Chave de ombro com rotação inversa à kimura — ataca o braço dobrado em L.",
    steps: [
      "Do 100kg ou montada, pressione o braço do oponente no chão em L (90°).",
      "Mão dele fica perto da própria orelha.",
      "Sua mão agarra o pulso dele; a outra entra por baixo do cotovelo.",
      "Mãos se conectam em figura 4.",
      "Eleve o cotovelo dele e arrasta a mão para baixo, em arco.",
    ],
    keyPoints: [
      "Pulso dele bem grudado no chão antes de atacar.",
      "Mantenha o peso pressionando o peito dele.",
      "Arco da mão: imagine pintando um arco-íris no chão.",
    ],
    commonMistakes: [
      "Levantar o cotovelo antes de fixar o pulso.",
      "Ficar muito alto — perde pressão e ele escapa.",
    ],
    drill: "Drill estático: parceiro deita, você monta a figura 4 e segura por 30s sem finalizar.",
    related: ["kimura"],
    tags: ["chave", "ombro", "100kg", "side-control", "montada", "submission"],
  },
  {
    id: "ezequiel",
    name: "Ezequiel",
    aliases: ["ezekiel choke", "sode guruma jime"],
    category: "finalizacao",
    position: "Montada / por dentro da guarda",
    belt: "blue",
    difficulty: 3,
    summary:
      "Estrangulamento usando a manga do próprio kimono — funciona até de dentro da guarda do oponente.",
    steps: [
      "Passe um braço por baixo do pescoço do oponente.",
      "Com a outra mão, pegue a manga do braço que está no pescoço.",
      "Empurre a manga contra a traqueia/lateral do pescoço.",
      "Aproxime os cotovelos e puxe a cabeça contra o peito.",
    ],
    keyPoints: [
      "Cotovelos fechados, nunca abertos.",
      "Funciona melhor com kimono firme; sem kimono use Ezequiel sem manga (mão na nuca).",
    ],
    commonMistakes: [
      "Pescoço do braço passar muito profundo ou raso.",
      "Puxar com força sem aproximar — sem aperto.",
    ],
    drill: "Da montada: encaixar e segurar 20s, sem finalizar, repetir 5x.",
    related: ["mata-leao", "cruz"],
    tags: ["estrangulamento", "kimono", "montada", "guarda", "ezekiel"],
  },
  {
    id: "omoplata",
    name: "Omoplata",
    aliases: ["ashi sankaku garami", "shoulder lock from guard"],
    category: "finalizacao",
    position: "Guarda fechada / aberta",
    belt: "blue",
    difficulty: 3,
    summary:
      "Chave de ombro travada com a perna por cima do braço — também é raspagem e controle.",
    steps: [
      "Da guarda, capture um braço e quebre a postura.",
      "Plante o pé no quadril oposto e gire o quadril 90°.",
      "Passe a perna do mesmo lado por cima do ombro do oponente.",
      "Sente, segure a cintura dele para evitar o rolamento.",
      "Pressione o ombro para frente lentamente.",
    ],
    keyPoints: [
      "Quadril sempre na frente do ombro dele.",
      "Cintura controlada — solta e ele rola por cima de você.",
      "Pé que fechou o triangulo da omoplata travado, sem afrouxar.",
    ],
    commonMistakes: [
      "Não sentar e tentar finalizar deitado — pouca pressão.",
      "Deixar o oponente postar o braço livre na perna sua e levantar.",
    ],
    drill: "Drill em pé: do guarda, sentar para omoplata 10x, sem o oponente resistir.",
    related: ["triangulo", "armbar"],
    tags: ["chave", "ombro", "guarda", "submission"],
  },
  {
    id: "cruz",
    name: "Estrangulamento de cruz",
    aliases: ["cross collar choke", "juji-jime", "estrangulamento de gola"],
    category: "finalizacao",
    position: "Guarda fechada / montada",
    belt: "white",
    difficulty: 2,
    summary:
      "Estrangulamento de gola com mãos cruzadas — fundamental do BJJ com kimono.",
    steps: [
      "Mão direita pega a gola direita do oponente bem profundo (4 dedos por dentro).",
      "Mão esquerda pega a gola esquerda por cima.",
      "Cotovelos colados ao corpo.",
      "Puxe os punhos para os próprios ombros e abra os cotovelos como se rasgasse uma camisa.",
    ],
    keyPoints: [
      "Profundidade da pegada > força.",
      "Cotovelos baixos — se subir, ele escapa o queixo por baixo.",
      "Trabalhe o aperto com a parte óssea do antebraço (rádio).",
    ],
    commonMistakes: [
      "Pegada rasa: sem aperto.",
      "Tentar puxar a cabeça em vez de abrir os cotovelos.",
    ],
    drill: "Solo: prática da pegada profunda 30x cada lado em camisa pendurada.",
    related: ["bow-and-arrow", "ezequiel"],
    tags: ["estrangulamento", "kimono", "gola", "guarda", "montada", "fundamental"],
  },
  {
    id: "bow-and-arrow",
    name: "Bow and arrow",
    aliases: ["estrangulamento do arco", "bow arrow choke"],
    category: "finalizacao",
    position: "Pegada nas costas",
    belt: "blue",
    difficulty: 3,
    summary:
      "Estrangulamento de gola pelas costas usando todo o corpo como um arco — extremamente apertado.",
    steps: [
      "Pelas costas, pegue a gola do oponente com a mão do mesmo lado.",
      "A outra mão captura o joelho ou o pé do mesmo lado da gola.",
      "Caia para o lado oposto à gola, esticando o corpo.",
      "Pernas pressionam o quadril, braço puxa a gola — corpo em forma de arco.",
    ],
    keyPoints: [
      "Cabeça do oponente travada no seu antebraço da gola.",
      "Pé do mesmo lado por cima do ombro dele para travar o ombro.",
      "Tração vem do quadril e perna, não só do braço.",
    ],
    commonMistakes: [
      "Cair para o lado errado — solta a pressão.",
      "Não controlar a perna — ele senta e escapa.",
    ],
    drill: "Da posição já encaixada, ajustar o ângulo 5x sem finalizar.",
    related: ["mata-leao", "cruz"],
    tags: ["estrangulamento", "costas", "gola", "kimono", "submission"],
  },
  {
    id: "triangulo-de-braco",
    name: "Triângulo de braço",
    aliases: ["arm triangle", "kata-gatame"],
    category: "finalizacao",
    position: "100 kilos / montada",
    belt: "blue",
    difficulty: 3,
    summary:
      "Estrangulamento que usa o próprio braço do oponente como alavanca contra o pescoço.",
    steps: [
      "Empurre o braço do oponente contra a cabeça dele.",
      "Passe a sua cabeça por cima do braço dele, ombro a ombro.",
      "Junte as mãos em S-grip ou figura 4.",
      "Caminhe para o lado oposto ao braço preso e pressione.",
    ],
    keyPoints: [
      "Pressão da cabeça é o aperto principal.",
      "Quadril baixo, peso por cima do peito.",
      "Caminhar 90° em relação ao corpo dele para selar o estrangulamento.",
    ],
    commonMistakes: [
      "Não selar o ombro contra a orelha — fica solto.",
      "Atacar de joelhos sem caminhar pro lado.",
    ],
    drill: "Da posição encaixada, caminhar 90° cinco vezes seguidas mantendo a pressão.",
    related: ["americana", "kimura"],
    tags: ["estrangulamento", "100kg", "side-control", "montada", "submission"],
  },

  // ── GUARDAS ────────────────────────────────────────────────────────────
  {
    id: "guarda-fechada",
    name: "Guarda fechada",
    aliases: ["closed guard", "full guard"],
    category: "guarda",
    position: "Guarda — base de tudo",
    belt: "white",
    difficulty: 1,
    summary:
      "Posição mais básica e poderosa do BJJ: pernas cruzadas atrás das costas do oponente, controlando ele entre suas pernas.",
    steps: [
      "Cruze os tornozelos atrás das costas do adversário.",
      "Pegue a gola e a manga oposta para controlar a postura.",
      "Quebre a postura puxando para baixo, calcanhares para baixo.",
      "Trabalhe ataques (estrangulamentos, raspagens) ou levantadas.",
    ],
    keyPoints: [
      "Quebrar a postura é prioridade #1: oponente ereto = você está perdendo.",
      "Quadril ativo: nunca fique parado.",
      "Pegadas sempre — sem mãos livres para o oponente.",
    ],
    commonMistakes: [
      "Cruzar os pés sem controle de pegada.",
      "Deixar o oponente postar, abrir os cotovelos e levantar.",
    ],
    drill: "Hip escape no oponente passivo: 1 minuto contínuo de movimentação na guarda.",
    related: ["triangulo", "armbar", "cruz"],
    tags: ["guarda", "fundamental", "controle", "branca"],
  },
  {
    id: "meia-guarda",
    name: "Meia guarda",
    aliases: ["half guard", "media guarda"],
    category: "guarda",
    position: "Meia guarda — uma perna",
    belt: "white",
    difficulty: 2,
    summary:
      "Você prende uma das pernas do oponente entre as suas, criando dezenas de raspagens e ataques.",
    steps: [
      "Trianguale uma perna do oponente entre as suas.",
      "Conquiste o underhook do mesmo lado.",
      "Vire de lado, cabeça encostada no chão.",
      "Use o underhook para sair para as costas ou raspar.",
    ],
    keyPoints: [
      "Underhook é o fundamento: sem ele você só sobrevive.",
      "Joelho dentro, criando frame para impedir o smash.",
      "Cabeça pesada e baixa — não dá pro oponente afundar.",
    ],
    commonMistakes: [
      "Ficar plano de costas — vira passagem fácil.",
      "Não fechar o triângulo nas pernas — ele levanta a perna e passa.",
    ],
    drill: "Solo: rolar pra meia guarda e conquistar o underhook 15x.",
    related: ["raspagem-meia-guarda", "guarda-fechada"],
    tags: ["guarda", "meia", "underhook", "fundamental"],
  },
  {
    id: "aranha",
    name: "Guarda aranha",
    aliases: ["spider guard"],
    category: "guarda",
    position: "Guarda aberta com mangas",
    belt: "blue",
    difficulty: 3,
    summary:
      "Controle das duas mangas com pegadas em gancho e os pés nos bíceps — guarda dinâmica e técnica.",
    steps: [
      "Pegue as duas mangas do oponente com pegada de gancho (4 dedos por dentro).",
      "Plante os pés nos bíceps, cotovelos abertos.",
      "Use uma perna esticada e outra dobrada para criar ângulos.",
      "Trabalhe raspagens (tesoura, balão), triângulo ou omoplata.",
    ],
    keyPoints: [
      "Pegadas firmes — solta a manga, perde tudo.",
      "Pernas ativas, sempre criando ângulos diferentes.",
      "Cabeça para os lados, não fica plana.",
    ],
    commonMistakes: [
      "Ficar com as duas pernas esticadas e parado.",
      "Permitir que o oponente abra as pegadas com as duas mãos juntas.",
    ],
    drill: "Aluno passivo: criar 3 ângulos diferentes mantendo as pegadas, 5 ciclos.",
    related: ["lapela", "borboleta", "triangulo"],
    tags: ["guarda", "aranha", "kimono", "manga", "azul"],
  },
  {
    id: "borboleta",
    name: "Guarda borboleta",
    aliases: ["butterfly guard", "guarda sentada"],
    category: "guarda",
    position: "Sentado, ganchos por dentro",
    belt: "blue",
    difficulty: 3,
    summary:
      "Sentado com ganchos por dentro das coxas do oponente — guarda explosiva, ideal pra raspar.",
    steps: [
      "Sente em frente ao oponente, joelhos alinhados.",
      "Coloque os ganchos por dentro das coxas dele.",
      "Conquiste o underhook do mesmo lado da raspagem.",
      "Caia para o lado, elevando a perna oposta.",
    ],
    keyPoints: [
      "Joelho colado no peito do oponente, sem deixar ele afundar.",
      "Cabeça e ombro pressionados contra o peito dele.",
      "Os ganchos elevam, não chutam.",
    ],
    commonMistakes: [
      "Deitar de costas — vira guarda aberta sem controle.",
      "Tentar chutar com os ganchos em vez de elevar.",
    ],
    drill: "Em dupla: raspagem básica de borboleta para os dois lados, 10 reps cada.",
    related: ["raspagem-borboleta", "x-guard"],
    tags: ["guarda", "borboleta", "ganchos", "raspagem", "azul"],
  },
  {
    id: "de-la-riva",
    name: "De La Riva",
    aliases: ["dlr", "guarda dlr"],
    category: "guarda",
    position: "Guarda aberta com gancho externo",
    belt: "purple",
    difficulty: 4,
    summary:
      "Gancho por fora do quadril do oponente, perna oposta plantada — uma das guardas mais versáteis do BJJ moderno.",
    steps: [
      "Sente em frente ao oponente, agarre uma manga e a calça do mesmo lado.",
      "Passe a perna do mesmo lado da manga por fora da coxa do oponente, gancho na parte interna do quadril.",
      "A outra perna planta no quadril ou bíceps.",
      "Trabalhe raspagens (berimbolo, tomoe nage) ou ataques nas costas.",
    ],
    keyPoints: [
      "Gancho profundo, na linha do quadril dele.",
      "Joelho do gancho colado no peito dele.",
      "Pegadas no kimono não podem soltar.",
    ],
    commonMistakes: [
      "Gancho raso — escapa fácil.",
      "Não usar a perna livre como segunda barreira.",
    ],
    drill: "Solo: do sentado, encaixar DLR para os dois lados, 10x cada.",
    related: ["x-guard", "berimbolo"],
    tags: ["guarda", "dlr", "moderno", "kimono", "roxa"],
  },
  {
    id: "x-guard",
    name: "X-Guard",
    aliases: ["guarda em x", "x guard"],
    category: "guarda",
    position: "Por baixo, pernas em X",
    belt: "purple",
    difficulty: 4,
    summary:
      "Pernas formam um X entre as do oponente, desestabilizando completamente a base dele.",
    steps: [
      "Da meia guarda profunda ou DLR, deslize por baixo.",
      "Uma perna por cima do ombro do oponente, a outra no quadril oposto.",
      "Pegue a calça/perna da frente com as duas mãos.",
      "Trabalhe a raspagem do x ou a entrada para finalização nas pernas.",
    ],
    keyPoints: [
      "Cabeça embaixo da axila/quadril dele.",
      "Quanto mais embaixo, menor a base dele.",
      "Pernas sempre em tensão, nunca relaxadas.",
    ],
    commonMistakes: [
      "Posição muito alta — vira passagem na cabeça.",
      "Perder a pegada na perna da frente.",
    ],
    drill: "Em dupla: entrar e sair do X-guard 10x, oponente passivo.",
    related: ["raspagem-x", "de-la-riva"],
    tags: ["guarda", "x-guard", "moderno", "kimono", "roxa"],
  },
  {
    id: "lapela",
    name: "Guarda de lapela",
    aliases: ["lapel guard", "worm guard", "squid guard"],
    category: "guarda",
    position: "Guarda com lapela do oponente",
    belt: "blue",
    difficulty: 3,
    summary:
      "Use a própria lapela do oponente como pegada extra, travando braços e pernas em armadilhas.",
    steps: [
      "Puxe a lapela do oponente até soltá-la do cinto.",
      "Passe-a por baixo de uma perna dele.",
      "Pegue do outro lado por baixo do braço ou perna.",
      "Trabalhe controles e raspagens com a vantagem do tecido.",
    ],
    keyPoints: [
      "Lapela controla um membro inteiro — você ganha um braço extra.",
      "Pegada com a mão oposta libera a outra para atacar.",
    ],
    commonMistakes: [
      "Puxar a lapela e esquecer de proteger o quadril.",
      "Não passar a lapela por baixo da perna correta.",
    ],
    drill: "Aluno passivo: extrair a lapela e fazer 3 controles diferentes.",
    related: ["aranha", "de-la-riva"],
    tags: ["guarda", "lapela", "kimono", "moderno"],
  },

  // ── RASPAGENS ──────────────────────────────────────────────────────────
  {
    id: "raspagem-gancho",
    name: "Raspagem de gancho (hip bump)",
    aliases: ["hip bump sweep", "raspagem do quadril"],
    category: "raspagem",
    position: "Guarda fechada",
    belt: "white",
    difficulty: 1,
    summary:
      "Raspagem básica usando o impulso do quadril — primeira raspagem de qualquer faixa branca.",
    steps: [
      "Da guarda fechada, sente abrindo a guarda.",
      "Plante a mão do mesmo lado atrás de você.",
      "Eleve o quadril e empurre o ombro do oponente para o lado oposto.",
      "Caia por cima dele, conquistando a montada.",
    ],
    keyPoints: [
      "Explosão do quadril — sem força, é só movimento.",
      "Mão de base atrás te dá a alavanca.",
      "Olhar e ombro guiam o movimento.",
    ],
    commonMistakes: [
      "Não sentar antes de elevar.",
      "Não controlar o braço do oponente — ele baseia.",
    ],
    drill: "Solo: hip bump 20x para cada lado, sem oponente.",
    related: ["tesoura", "kimura"],
    tags: ["raspagem", "guarda-fechada", "fundamental", "branca"],
  },
  {
    id: "tesoura",
    name: "Raspagem em tesoura",
    aliases: ["scissor sweep"],
    category: "raspagem",
    position: "Guarda fechada / aberta",
    belt: "white",
    difficulty: 2,
    summary:
      "Uma perna passa por dentro, outra por fora — derrubando o oponente em tesoura.",
    steps: [
      "Da guarda, abra e ganhe ângulo de lado.",
      "Pegue a manga do mesmo lado e a gola do oposto.",
      "Coloque o joelho atravessado no peito do oponente, pé do outro lado no chão.",
      "Empurre o joelho, puxe a manga e raspagem em movimento de tesoura.",
    ],
    keyPoints: [
      "Ângulo de 90° em relação ao oponente.",
      "Joelho no peito alto — quanto mais alto, mais alavanca.",
      "Puxa a manga junto, sem deixar ele postar.",
    ],
    commonMistakes: [
      "Tentar de frente, sem ângulo.",
      "Joelho baixo, na barriga.",
    ],
    drill: "Em dupla: tesoura 10x para cada lado com o oponente passivo.",
    related: ["raspagem-gancho", "guarda-fechada"],
    tags: ["raspagem", "guarda", "fundamental", "kimono"],
  },
  {
    id: "raspagem-borboleta",
    name: "Raspagem da borboleta",
    aliases: ["butterfly sweep"],
    category: "raspagem",
    position: "Guarda borboleta",
    belt: "blue",
    difficulty: 3,
    summary:
      "Eleva o oponente com o gancho, jogando ele no sentido do underhook.",
    steps: [
      "Conquiste o underhook do lado da raspagem.",
      "Cabeça colada no peito do oponente.",
      "Caia de lado, elevando a perna do gancho.",
      "Termine por cima, em meia guarda ou 100kg.",
    ],
    keyPoints: [
      "Não chuta com o gancho: eleva.",
      "Cair para o lado, não para trás.",
      "Underhook profundo, mão na omoplata dele.",
    ],
    commonMistakes: [
      "Cair de costas em vez de cair de lado.",
      "Sem underhook — ele baseia o braço e você não rasga.",
    ],
    drill: "Em dupla: raspagem para os dois lados em sequência, 10 ciclos.",
    related: ["borboleta", "x-guard"],
    tags: ["raspagem", "borboleta", "underhook", "azul"],
  },
  {
    id: "raspagem-x",
    name: "Raspagem do X-Guard",
    aliases: ["x-guard sweep", "single leg x sweep"],
    category: "raspagem",
    position: "X-Guard",
    belt: "purple",
    difficulty: 4,
    summary:
      "Estende a perna do oponente para o teto, fazendo ele cair sem base.",
    steps: [
      "Do X-guard com pegadas firmes na perna da frente.",
      "Estique a perna que está sob o ombro do oponente.",
      "Empurre a perna dele na diagonal pra cima e pra frente.",
      "Sente, segure a perna e levante por cima dele.",
    ],
    keyPoints: [
      "Empurrar e puxar simultâneos — desequilíbrio total.",
      "Pegadas presas na perna em todo o movimento.",
      "Termine fixando o quadril dele no chão.",
    ],
    commonMistakes: [
      "Soltar a pegada antes do final.",
      "Estender a perna pelo lado errado.",
    ],
    drill: "Aluno passivo: encaixar o X e raspar 8x para cada lado.",
    related: ["x-guard", "de-la-riva"],
    tags: ["raspagem", "x-guard", "moderno", "roxa"],
  },
  {
    id: "raspagem-meia-guarda",
    name: "Raspagem da meia guarda (old school)",
    aliases: ["old school sweep", "meia guarda sweep"],
    category: "raspagem",
    position: "Meia guarda",
    belt: "white",
    difficulty: 2,
    summary:
      "Clássica da meia guarda — abraça a perna do oponente e cai por cima.",
    steps: [
      "Da meia guarda, conquiste o underhook do mesmo lado da perna presa.",
      "Abrace a perna dele com as duas mãos.",
      "Use o pé livre como gancho na perna externa dele.",
      "Caia para frente, empurrando a perna e puxando o tronco.",
    ],
    keyPoints: [
      "Abraço apertado, mãos travadas.",
      "Cabeça encostada na lateral da perna dele.",
      "Não levantar — empurrar pra frente.",
    ],
    commonMistakes: [
      "Soltar o abraço cedo demais.",
      "Tentar com a perna errada do oponente.",
    ],
    drill: "Em dupla: do meia guarda, abraçar a perna e raspar 10x.",
    related: ["meia-guarda"],
    tags: ["raspagem", "meia-guarda", "fundamental", "branca"],
  },

  // ── PASSAGENS ──────────────────────────────────────────────────────────
  {
    id: "knee-cut",
    name: "Passagem do joelho (knee cut)",
    aliases: ["knee slice", "passagem do corte"],
    category: "passagem",
    position: "Em pé / dentro da guarda aberta",
    belt: "blue",
    difficulty: 3,
    summary:
      "Atravessa o joelho por cima da coxa do oponente para encaixar 100kg — passagem #1 do BJJ moderno.",
    steps: [
      "Conquiste pegadas na lapela e na calça do mesmo lado.",
      "Plante o joelho por cima da perna do oponente.",
      "Puxe a cabeça dele para baixo com a pegada da lapela.",
      "Deslize o joelho para frente, terminando em 100kg.",
    ],
    keyPoints: [
      "Underhook do lado oposto antes de cortar.",
      "Cabeça do oponente baixa, sem espaço para escapar.",
      "Cinto colado no chão, sem espaços.",
    ],
    commonMistakes: [
      "Subir o joelho sem controlar a cabeça.",
      "Não conquistar o underhook — ele faz frame e te derruba.",
    ],
    drill: "Aluno passivo: encaixar e passar 10x para cada lado.",
    related: ["leg-drag", "smash-pass"],
    tags: ["passagem", "knee-cut", "moderno", "kimono", "azul"],
  },
  {
    id: "toreando",
    name: "Passagem toreando",
    aliases: ["toreando pass", "matador pass", "passagem do toureiro"],
    category: "passagem",
    position: "Em pé contra guarda aberta",
    belt: "blue",
    difficulty: 2,
    summary:
      "Pegue as duas calças do oponente, jogue as pernas para o lado e corra para o 100 kilos.",
    steps: [
      "Em pé, pegue as duas calças no joelho.",
      "Empurre as pernas dele para um dos lados.",
      "Solte e dê passos rápidos para o lado oposto.",
      "Deite no peito dele em 100kg.",
    ],
    keyPoints: [
      "Pegar firme nos joelhos, sem deixar girar.",
      "Velocidade é essencial: passos curtos e rápidos.",
      "Cabeça baixa, próxima do peito dele.",
    ],
    commonMistakes: [
      "Pegar muito alto na coxa — fica sem alavanca.",
      "Movimento lento — ele recoloca o gancho.",
    ],
    drill: "Solo: passos do toreando 20x sem oponente.",
    related: ["knee-cut"],
    tags: ["passagem", "toreando", "fundamental", "kimono"],
  },
  {
    id: "leg-drag",
    name: "Leg drag",
    aliases: ["puxar a perna"],
    category: "passagem",
    position: "Em pé contra guarda",
    belt: "purple",
    difficulty: 3,
    summary:
      "Puxe uma perna do oponente para o outro lado, empilhando-a sobre a outra para neutralizar.",
    steps: [
      "Pegue o tornozelo ou calça do oponente.",
      "Cruze a perna dele por cima da outra, empurrando para o lado oposto.",
      "Plante o joelho na coxa empilhada para travar.",
      "Caminhe ao redor para 100kg ou costas.",
    ],
    keyPoints: [
      "Quanto mais cruzada a perna, melhor o controle.",
      "Joelho colado na coxa empilhada — sem espaço.",
      "Olhar para o outro lado do passe.",
    ],
    commonMistakes: [
      "Soltar a pegada da calça antes de plantar o joelho.",
      "Ficar parado depois do drag — tem que circular.",
    ],
    drill: "Aluno passivo: leg drag e progressão para 100kg, 8x cada lado.",
    related: ["knee-cut", "toreando"],
    tags: ["passagem", "leg-drag", "moderno", "kimono", "roxa"],
  },
  {
    id: "smash-pass",
    name: "Smash pass",
    aliases: ["passagem por cima", "stack pass"],
    category: "passagem",
    position: "Dentro da guarda fechada / borboleta",
    belt: "blue",
    difficulty: 3,
    summary:
      "Esmaga as pernas do oponente contra o peito dele, neutralizando a guarda pelo peso e pressão.",
    steps: [
      "Quebre a guarda fechada e force as pernas dele para cima do tronco.",
      "Pressione com o peso, mãos no quadril ou pescoço.",
      "Caminhe ao redor, mantendo o esmagamento.",
      "Termine em 100kg do lado escolhido.",
    ],
    keyPoints: [
      "Pressão constante, nunca alivia.",
      "Quadril baixo, peso transferido pelo peito dele.",
      "Mãos controlam o quadril e/ou cabeça.",
    ],
    commonMistakes: [
      "Subir o quadril — ele encaixa o gancho de volta.",
      "Ficar parado no esmagamento sem progredir.",
    ],
    drill: "Aluno passivo: esmagar e caminhar 5 vezes para cada lado.",
    related: ["double-under", "knee-cut"],
    tags: ["passagem", "smash", "pressao", "azul"],
  },
  {
    id: "double-under",
    name: "Double under pass",
    aliases: ["passagem por baixo", "stack pass"],
    category: "passagem",
    position: "Em pé / ajoelhado contra guarda aberta",
    belt: "blue",
    difficulty: 3,
    summary:
      "Passa as duas mãos por baixo das pernas do oponente, junta os joelhos dele e caminha por cima.",
    steps: [
      "Plante os joelhos próximos ao oponente.",
      "Passe os dois braços por baixo das coxas dele.",
      "Junte o quadril dele em direção à cabeça (stack).",
      "Caminhe para o lado, segurando o cinto e finalizando em 100kg.",
    ],
    keyPoints: [
      "Cabeça baixa entre as coxas, evitando o triângulo.",
      "Stack bem forte, joelhos dele perto da própria orelha.",
      "Caminha com passos curtos, sem correr.",
    ],
    commonMistakes: [
      "Cabeça alta — leva triângulo.",
      "Não juntar as coxas dele antes de caminhar.",
    ],
    drill: "Em dupla: encaixar e empilhar 8x sem passar.",
    related: ["smash-pass"],
    tags: ["passagem", "stack", "pressao", "azul"],
  },

  // ── ESCAPES ────────────────────────────────────────────────────────────
  {
    id: "escape-100kg",
    name: "Escape do 100 kilos",
    aliases: ["side control escape", "fuga lateral"],
    category: "escape",
    position: "Por baixo do 100 kilos",
    belt: "white",
    difficulty: 2,
    summary:
      "Frame, hip escape e recompor a guarda — fuga mais essencial para sobreviver no BJJ.",
    steps: [
      "Crie frame no pescoço/bíceps do oponente com os dois braços.",
      "Hip escape para longe dele, criando espaço.",
      "Insira o joelho de volta entre os corpos.",
      "Recomponha a meia guarda ou guarda fechada.",
    ],
    keyPoints: [
      "Frame antes de tudo — sem frame, ele afunda mais.",
      "Hip escape grande, com explosão.",
      "Cabeça olhando para ele, nunca virada para o teto.",
    ],
    commonMistakes: [
      "Empurrar com força em vez de framear.",
      "Tentar virar de bruços — vira passagem nas costas.",
    ],
    drill: "Solo: hip escape 30x cada lado em ritmo controlado.",
    related: ["shrimp", "frame", "escape-montada"],
    tags: ["escape", "side-control", "100kg", "fundamental", "branca"],
  },
  {
    id: "escape-montada",
    name: "Escape de montada",
    aliases: ["mount escape", "bridge and roll", "upa"],
    category: "escape",
    position: "Por baixo da montada",
    belt: "white",
    difficulty: 2,
    summary:
      "Bridge and roll: prende o braço, faz a ponte e rola por cima — fundamental do escape.",
    steps: [
      "Capture um braço do oponente e o pé do mesmo lado.",
      "Faça uma ponte forte, elevando o quadril.",
      "Rola por cima do ombro do braço preso.",
      "Termine na guarda fechada ou meia guarda.",
    ],
    keyPoints: [
      "O braço dele tem que estar isolado — não pode postar.",
      "Pé do mesmo lado do braço bloqueado.",
      "Ponte vem do quadril, não dos ombros.",
    ],
    commonMistakes: [
      "Tentar rolar para o lado errado.",
      "Não controlar o braço — ele posta e rola você de volta.",
    ],
    drill: "Solo: ponte e roll 20x para cada lado, lentamente.",
    related: ["escape-100kg"],
    tags: ["escape", "montada", "bridge", "fundamental", "branca"],
  },
  {
    id: "escape-mata-leao",
    name: "Escape de mata-leão",
    aliases: ["rnc escape"],
    category: "escape",
    position: "Costas tomadas",
    belt: "blue",
    difficulty: 3,
    summary:
      "Defender o pescoço, rolar para o lado e voltar para a guarda antes que ele encaixe.",
    steps: [
      "Mãos em posição de defesa: queixo no peito, mão na gola, outra no braço estrangulador.",
      "Caia para o lado do braço estrangulador (move o queixo pra ele).",
      "Quando cair, escapule o quadril empurrando a perna do gancho.",
      "Vire de frente para ele, recomponha a guarda.",
    ],
    keyPoints: [
      "Defender o pescoço primeiro, posição depois.",
      "Cair para o lado correto: do braço atacante.",
      "Não tentar tirar o braço com força — só protege e escapa o quadril.",
    ],
    commonMistakes: [
      "Cair para o lado errado — ele finaliza mais rápido.",
      "Tentar puxar o braço estrangulador com força.",
    ],
    drill: "Em dupla: parceiro encaixa o RNC sem força total, você defende e cai 10x.",
    related: ["mata-leao"],
    tags: ["escape", "costas", "rnc", "azul"],
  },
  {
    id: "escape-armbar",
    name: "Escape de armbar",
    aliases: ["armbar defense", "hitchhiker escape"],
    category: "escape",
    position: "Sob o armbar",
    belt: "blue",
    difficulty: 3,
    summary:
      "Junta as mãos, gira o polegar para cima e roda por cima do ombro — escape do hitchhiker.",
    steps: [
      "Antes do armbar fechar, junte as mãos em S-grip.",
      "Gire o polegar do braço atacado para cima (como pedindo carona).",
      "Roda na direção do polegar, levando o ombro junto.",
      "Termine de joelhos ou em 100kg por cima dele.",
    ],
    keyPoints: [
      "Junte as mãos antes que ele estique.",
      "Rotação do polegar cria espaço para o cotovelo.",
      "Movimento contínuo, sem parar no meio.",
    ],
    commonMistakes: [
      "Juntar as mãos depois que ele já esticou — tarde demais.",
      "Tentar resistir só com força — risco de lesão.",
    ],
    drill: "Em dupla: parceiro encaixa armbar lentamente, você executa o hitchhiker 10x.",
    related: ["armbar"],
    tags: ["escape", "armbar", "hitchhiker", "azul"],
  },

  // ── FUNDAMENTOS ────────────────────────────────────────────────────────
  {
    id: "shrimp",
    name: "Hip escape (shrimp)",
    aliases: ["shrimp", "fuga de quadril", "movimento de camarão"],
    category: "fundamento",
    position: "Solo / sob qualquer pressão",
    belt: "white",
    difficulty: 1,
    summary:
      "Movimento de quadril mais importante do BJJ — base de quase todas as fugas e recomposições de guarda.",
    steps: [
      "Deitado de costas, plante os pés no chão.",
      "Ponte para o lado (não para cima), elevando o quadril.",
      "Empurre o chão com os pés, movendo o quadril para longe.",
      "Termine de lado, joelhos protegendo a barriga.",
    ],
    keyPoints: [
      "Ombros e pés são as bases — quadril é o que se move.",
      "Movimento curto e explosivo, não puxado.",
      "Sempre faça em ambos os lados.",
    ],
    commonMistakes: [
      "Empurrar com a mão em vez do pé.",
      "Não levantar o quadril antes de mover.",
    ],
    drill: "Solo warm-up: 20m de hip escape contínuo no tatame.",
    related: ["frame", "escape-100kg"],
    tags: ["fundamento", "movimento", "shrimp", "warm-up", "branca"],
  },
  {
    id: "frame",
    name: "Frame e enquadre",
    aliases: ["framing", "enquadre"],
    category: "fundamento",
    position: "Defensivo, qualquer posição",
    belt: "white",
    difficulty: 1,
    summary:
      "Usar ossos (antebraços e canelas) em vez de músculos para criar espaço — economia total de energia.",
    steps: [
      "Em qualquer posição inferior, posicione o antebraço (rádio) contra o pescoço ou ombro do oponente.",
      "Mantenha o cotovelo dobrado em 90°.",
      "O outro antebraço entra como segundo frame.",
      "Use os frames para hip escape e criar espaço.",
    ],
    keyPoints: [
      "Frame nunca empurra: bloqueia.",
      "Cotovelos colados ao corpo, não estendidos.",
      "Junta osso com osso (antebraço com clavícula/pescoço).",
    ],
    commonMistakes: [
      "Empurrar com força em vez de bloquear.",
      "Cotovelos abertos — perde o frame.",
    ],
    drill: "Em dupla: parceiro tenta passar, você só aplica frame e respira.",
    related: ["shrimp", "escape-100kg"],
    tags: ["fundamento", "frame", "defesa", "branca"],
  },
  {
    id: "pegadas-base",
    name: "Pegadas básicas (lapela e manga)",
    aliases: ["grips", "pegadas fundamentais"],
    category: "fundamento",
    position: "Em pé / sentado",
    belt: "white",
    difficulty: 1,
    summary:
      "Pegada correta na lapela e na manga é a base de todo o jogo com kimono — sem ela, nada funciona.",
    steps: [
      "Lapela: 4 dedos por dentro, polegar por fora, na altura da clavícula.",
      "Manga: pegada de gancho (4 dedos por dentro do punho), polegar livre.",
      "Cotovelos colados ao corpo após pegar.",
      "Mantenha as pegadas até decidir trocar.",
    ],
    keyPoints: [
      "Pegada errada gasta energia em vão.",
      "Polegar fora dá mais força e segurança.",
      "Quem domina as pegadas dita o ritmo.",
    ],
    commonMistakes: [
      "Pegar com força sem técnica — cansa em 2 min.",
      "Soltar sem motivo entre transições.",
    ],
    drill: "Em pé com parceiro: trocar pegadas 30s sem atacar, focando só no controle.",
    related: ["postura-passador"],
    tags: ["fundamento", "pegada", "grip", "kimono", "branca"],
  },
  {
    id: "postura-passador",
    name: "Postura na guarda fechada (passador)",
    aliases: ["posture in closed guard"],
    category: "fundamento",
    position: "Por cima da guarda fechada",
    belt: "white",
    difficulty: 2,
    summary:
      "Sem postura ereta dentro da guarda, você é alvo fácil. Postura é o primeiro passo de qualquer passagem.",
    steps: [
      "Plante os joelhos abertos, dedos do pé para dentro.",
      "Mãos na barriga ou na cintura do oponente.",
      "Coluna ereta, olhar para frente.",
      "Cotovelos colados ao corpo, nunca estendidos.",
    ],
    keyPoints: [
      "Coluna ereta = força. Curvada = finalização garantida.",
      "Joelhos abertos: base larga.",
      "Mãos sempre conectadas, nunca soltas no ar.",
    ],
    commonMistakes: [
      "Curvar a coluna por puxão — abre o triângulo.",
      "Tirar as duas mãos do oponente — sem controle.",
    ],
    drill: "Em dupla: passivo embaixo, você só mantém postura por 60s seguidos.",
    related: ["pegadas-base"],
    tags: ["fundamento", "postura", "passador", "guarda", "branca"],
  },
] as const

// ─── Helpers ──────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const STOPWORDS = new Set([
  "de",
  "do",
  "da",
  "em",
  "no",
  "na",
  "com",
  "para",
  "por",
  "que",
  "como",
  "uma",
  "um",
  "os",
  "as",
  "o",
  "a",
  "e",
  "the",
  "and",
  "of",
  "is",
  "to",
])

function tokenize(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t))
}

/**
 * Busca por relevância em todo o banco. Retorna até `limit` técnicas
 * ordenadas por pontuação. Se nenhum termo for encontrado, retorna [].
 */
export function searchTechniques(
  query: string,
  opts: { limit?: number } = {},
): { technique: BjjTechnique; score: number }[] {
  const limit = opts.limit ?? 6
  const qTokens = tokenize(query)
  if (qTokens.length === 0) return []

  const scored = BJJ_TECHNIQUES.map((t) => {
    const fields = {
      name: normalize(t.name),
      aliases: (t.aliases ?? []).map(normalize).join(" "),
      tags: t.tags.map(normalize).join(" "),
      position: normalize(t.position),
      category: normalize(t.category),
      summary: normalize(t.summary),
      keyPoints: t.keyPoints.map(normalize).join(" "),
      steps: t.steps.map(normalize).join(" "),
    }
    let score = 0
    for (const tok of qTokens) {
      if (fields.name.includes(tok)) score += 10
      if (fields.aliases.includes(tok)) score += 8
      if (fields.tags.includes(tok)) score += 6
      if (fields.position.includes(tok)) score += 4
      if (fields.category.includes(tok)) score += 4
      if (fields.summary.includes(tok)) score += 2
      if (fields.keyPoints.includes(tok)) score += 1
      if (fields.steps.includes(tok)) score += 1
    }
    return { technique: t, score }
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return scored
}

export function getTechniqueById(id: string): BjjTechnique | null {
  return BJJ_TECHNIQUES.find((t) => t.id === id) ?? null
}

export function getTechniquesByCategory(
  category: TechniqueCategory,
): BjjTechnique[] {
  return BJJ_TECHNIQUES.filter((t) => t.category === category)
}

/**
 * Retorna uma "técnica do dia" determinística com base na data + memberId
 * (mesmo aluno vê a mesma técnica no mesmo dia, mas muda diariamente).
 */
export function getDailyTechnique(seed: string): BjjTechnique {
  const today = new Date().toISOString().slice(0, 10)
  const combined = `${seed}-${today}`
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 31 + combined.charCodeAt(i)) | 0
  }
  const idx = Math.abs(hash) % BJJ_TECHNIQUES.length
  return BJJ_TECHNIQUES[idx]!
}

/**
 * Sugestões de busca apresentadas ao aluno antes de digitar.
 * Cada sugestão é uma pergunta + termo curado que mapeia para resultados ricos.
 */
export const SEARCH_SUGGESTIONS: { label: string; query: string }[] = [
  { label: "Como melhorar meu triângulo", query: "triangulo guarda" },
  { label: "Plano para faixa branca", query: "fundamento branca" },
  { label: "Diferença entre kimura e americana", query: "kimura americana" },
  { label: "Como escapar do 100 kilos", query: "escape 100kg" },
  { label: "Passar a guarda fechada", query: "passagem guarda fechada" },
  { label: "Estou estagnado, o que treinar", query: "fundamento" },
]
