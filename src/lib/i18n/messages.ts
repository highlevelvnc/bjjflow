import type { Locale } from "./index"

export interface Messages {
  meta: { title: string; description: string }
  nav: { features: string; pricing: string; academies: string; signIn: string; getStarted: string }
  hero: {
    badge: string
    h1: string
    h1Gradient: string
    subtitle: string
    ctaPrimary: string
    ctaSecondary: string
    noCard: string
  }
  stats: { academies: string; members: string; uptime: string; pageLoad: string }
  features: {
    tag: string
    h2: string
    subtitle: string
    items: Array<{ title: string; description: string }>
  }
  howItWorks: {
    tag: string
    h2: string
    tagline: string
    steps: Array<{ title: string; body: string }>
  }
  testimonials: Array<{ quote: string; author: string; role: string }>
  pricing: {
    tag: string
    h2: string
    tagline: string
    plans: Array<{
      name: string
      description: string
      features: string[]
      cta: string
    }>
    noCard: string
  }
  cta: {
    h2: string
    h2Gradient: string
    subtitle: string
    ctaPrimary: string
    ctaSecondary: string
    setup: string
    noCard: string
    trial: string
  }
  footer: { tagline: string; signIn: string }
  /**
   * "I'm a student" entry-point shown on the landing page.
   * Lets students log in to /aluno without going through the academy
   * marketing/owner CTAs first.
   */
  studentPortal: {
    navLabel: string
    title: string
    subtitle: string
    cta: string
    footnote: string
  }
  login: {
    h1: string
    subtitle: string
    emailLabel: string
    emailPlaceholder: string
    passwordLabel: string
    passwordPlaceholder: string
    cta: string
    loading: string
    errorInvalid: string
    noAccount: string
    signUp: string
    security: string
  }
}

// ─── English ──────────────────────────────────────────────────────────────────

const en: Messages = {
  meta: {
    title: "Kumo — The Command Center for BJJ Academies",
    description:
      "Member management, session scheduling, and attendance analytics — one platform purpose-built for Brazilian Jiu-Jitsu academies.",
  },
  nav: { features: "Features", pricing: "Pricing", academies: "For Academies", signIn: "Sign in", getStarted: "Get started" },
  hero: {
    badge: "Built for the modern BJJ academy",
    h1: "Less chaos in management",
    h1Gradient: "More focus on the mats",
    subtitle:
      "Student management, payments, class scheduling and retention analytics — one platform purpose-built for BJJ academies. No spreadsheets. No WhatsApp groups. Just control.",
    ctaPrimary: "Start free trial",
    ctaSecondary: "Explore features",
    noCard: "No credit card required · 14-day free trial · Setup in under 10 min",
  },
  stats: {
    academies: "Academies worldwide",
    members: "Members tracked",
    uptime: "Uptime SLA",
    pageLoad: "Avg page load",
  },
  features: {
    tag: "Platform features",
    h2: "Everything your academy needs",
    subtitle: "From white belt to black belt — we track every step of the journey.",
    items: [
      {
        title: "Member Management",
        description:
          "Every student, every belt, every stripe — tracked in one place. Managed profiles, portal invites, and instant role assignment.",
      },
      {
        title: "Session Scheduling",
        description:
          "Create class templates and generate weeks of sessions in one click. Set instructors, gi types, capacity limits, and belt requirements.",
      },
      {
        title: "Attendance Tracking",
        description:
          "Take attendance in seconds from any device. Tap to mark present, tap again to unmark. Real-time counts, zero friction.",
      },
      {
        title: "Retention Analytics",
        description:
          "Automatically surface students at risk of dropping out based on attendance patterns. Act before they disappear.",
      },
      {
        title: "Multi-Tenant Security",
        description:
          "Each academy is fully isolated. Row-level security, JWT-scoped access, and zero cross-tenant data exposure.",
      },
      {
        title: "Instant Setup",
        description:
          "No onboarding calls. No complex imports. Your academy is running in under 10 minutes, start to finish.",
      },
    ],
  },
  howItWorks: {
    tag: "How it works",
    h2: "Up and running in minutes",
    tagline: "Three steps. No training required.",
    steps: [
      {
        title: "Create your academy",
        body: "Set up your profile, configure your timezone and plan. Done in under 2 minutes.",
      },
      {
        title: "Add classes & members",
        body: "Create recurring class templates, add your students and instructors. Belt ranks included.",
      },
      {
        title: "Track everything",
        body: "Generate sessions, take attendance from any device, watch retention data build over time.",
      },
    ],
  },
  testimonials: [
    {
      quote: "Kumo transformed how I manage my academy. Everything is organized, attendance is automatic, and I can finally focus on teaching.",
      author: "Murilo Rocha",
      role: "Rocha Team Iguaba Grande",
    },
    {
      quote: "Since we started using Kumo, we cut our admin time drastically. The best tool for BJJ academy management, hands down.",
      author: "Lucas Reis",
      role: "Iguaba Jiu Jitsu",
    },
  ],
  pricing: {
    tag: "Pricing",
    h2: "Plans that scale with your academy.",
    tagline: "No per-student fees. No surprises. Cancel anytime.",
    plans: [
      {
        name: "Starter",
        description: "For small academies getting started.",
        features: [
          "Up to 50 members",
          "Class scheduling",
          "Attendance tracking",
          "Basic reports",
        ],
        cta: "Start 14-day free trial",
      },
      {
        name: "Growth",
        description: "For growing academies that need more.",
        features: [
          "Up to 200 members",
          "Everything in Starter",
          "CSV import",
          "Student portal",
          "Self check-in",
          "Priority support",
        ],
        cta: "Start 14-day free trial",
      },
      {
        name: "Pro",
        description: "For established academies at scale.",
        features: [
          "Unlimited members",
          "Everything in Growth",
          "Custom branding",
          "API access",
          "Dedicated support",
        ],
        cta: "Start 14-day free trial",
      },
    ],
    noCard: "No credit card required",
  },
  cta: {
    h2: "Your academy deserves",
    h2Gradient: "better tools",
    subtitle:
      "Stop managing your team in WhatsApp groups and Google Sheets. Kumo is purpose-built for how jiu-jitsu academies actually operate.",
    ctaPrimary: "Get started for free",
    ctaSecondary: "Sign in to your academy",
    setup: "10-min setup",
    noCard: "No credit card",
    trial: "14-day free trial",
  },
  footer: { tagline: "Built for the jiu-jitsu community", signIn: "Sign in →" },
  studentPortal: {
    navLabel: "I'm a student",
    title: "Train smarter, track everything",
    subtitle:
      "Your academy already invited you? Sign in with the email your instructor used and jump straight into your student app.",
    cta: "Open student portal",
    footnote: "Don't have a login yet? Ask your instructor to send your access link.",
  },
  login: {
    h1: "Welcome back",
    subtitle: "Sign in to your Kumo account",
    emailLabel: "Email address",
    emailPlaceholder: "professor@youracademy.com",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    cta: "Sign in",
    loading: "Signing in…",
    errorInvalid: "Invalid email or password. Please try again.",
    noAccount: "Don't have an account?",
    signUp: "Get started",
    security: "Secured by Supabase Auth · 256-bit encryption",
  },
}

// ─── Portuguese Brazil ────────────────────────────────────────────────────────

const ptBR: Messages = {
  meta: {
    title: "Kumo — O Centro de Controle para Academias de BJJ",
    description:
      "Gestão de alunos, agendamento de aulas e análise de frequência — uma plataforma criada especialmente para academias de Brazilian Jiu-Jitsu.",
  },
  nav: {
    features: "Funcionalidades",
    pricing: "Preços",
    academies: "Para academias",
    signIn: "Entrar",
    getStarted: "Começar agora",
  },
  hero: {
    badge: "Feito para a academia de BJJ moderna",
    h1: "Menos caos na gestão",
    h1Gradient: "Mais foco no tatame",
    subtitle:
      "Gestão de alunos, pagamentos, agendamento de aulas e análise de retenção — uma plataforma criada para academias de jiu-jitsu. Sem planilhas. Sem grupos de WhatsApp. Só controle.",
    ctaPrimary: "Iniciar teste grátis",
    ctaSecondary: "Ver funcionalidades",
    noCard: "Sem cartão de crédito · 14 dias grátis · Configuração em menos de 10 min",
  },
  stats: {
    academies: "Academias no mundo",
    members: "Alunos monitorados",
    uptime: "SLA de disponibilidade",
    pageLoad: "Carregamento médio",
  },
  features: {
    tag: "Funcionalidades da plataforma",
    h2: "Tudo que sua academia precisa",
    subtitle: "Do faixa branca ao faixa preta — acompanhamos cada etapa da jornada.",
    items: [
      {
        title: "Gestão de Alunos",
        description:
          "Cada aluno, cada faixa, cada grau — tudo em um só lugar. Perfis gerenciados, convites por portal e atribuição instantânea de funções.",
      },
      {
        title: "Agendamento de Aulas",
        description:
          "Crie modelos de aulas e gere semanas de sessões com um clique. Defina instrutores, tipo de kimono, capacidade e nível de faixa.",
      },
      {
        title: "Controle de Frequência",
        description:
          "Marque presença em segundos de qualquer dispositivo. Toque para marcar, toque novamente para desmarcar. Contagem em tempo real, sem complicações.",
      },
      {
        title: "Análise de Retenção",
        description:
          "Identifique automaticamente alunos em risco de desistência com base nos padrões de frequência. Aja antes que eles saiam.",
      },
      {
        title: "Segurança Multi-Academia",
        description:
          "Cada academia é completamente isolada. Segurança por linha, acesso com escopo JWT e zero exposição entre academias.",
      },
      {
        title: "Configuração Instantânea",
        description:
          "Sem ligações de onboarding. Sem importações complexas. Sua academia funcionando em menos de 10 minutos, do início ao fim.",
      },
    ],
  },
  howItWorks: {
    tag: "Como funciona",
    h2: "Funcionando em minutos",
    tagline: "Três etapas. Sem treinamento necessário.",
    steps: [
      {
        title: "Crie sua academia",
        body: "Configure seu perfil, fuso horário e plano. Pronto em menos de 2 minutos.",
      },
      {
        title: "Adicione aulas e alunos",
        body: "Crie modelos de aulas recorrentes, adicione alunos e instrutores. Graduações incluídas.",
      },
      {
        title: "Monitore tudo",
        body: "Gere sessões, marque frequência de qualquer dispositivo e veja os dados de retenção crescerem.",
      },
    ],
  },
  testimonials: [
    {
      quote: "O Kumo transformou a forma como eu gerencio minha academia. Tudo organizado, frequência automática, e finalmente consigo focar no ensino.",
      author: "Murilo Rocha",
      role: "Rocha Team Iguaba Grande",
    },
    {
      quote: "Desde que começamos a usar o Kumo, reduzimos drasticamente o tempo administrativo. A melhor ferramenta para gestão de academias de BJJ.",
      author: "Lucas Reis",
      role: "Iguaba Jiu Jitsu",
    },
  ],
  pricing: {
    tag: "Preços",
    h2: "Planos que crescem com sua academia.",
    tagline: "Sem taxas por aluno. Sem surpresas. Cancele quando quiser.",
    plans: [
      {
        name: "Starter",
        description: "Para academias pequenas começando.",
        features: [
          "Até 50 alunos",
          "Agendamento de aulas",
          "Controle de frequência",
          "Relatórios básicos",
        ],
        cta: "Iniciar 14 dias grátis",
      },
      {
        name: "Growth",
        description: "Para academias em crescimento que precisam de mais.",
        features: [
          "Até 200 alunos",
          "Tudo do Starter",
          "Importação CSV",
          "Portal do aluno",
          "Check-in automático",
          "Suporte prioritário",
        ],
        cta: "Iniciar 14 dias grátis",
      },
      {
        name: "Pro",
        description: "Para academias estabelecidas em escala.",
        features: [
          "Alunos ilimitados",
          "Tudo do Growth",
          "Marca personalizada",
          "Acesso à API",
          "Suporte dedicado",
        ],
        cta: "Iniciar 14 dias grátis",
      },
    ],
    noCard: "Sem cartão de crédito",
  },
  cta: {
    h2: "Sua academia merece",
    h2Gradient: "ferramentas melhores",
    subtitle:
      "Pare de gerenciar sua equipe em grupos de WhatsApp e planilhas do Google. O Kumo foi criado para a forma como as academias de jiu-jitsu realmente funcionam.",
    ctaPrimary: "Começar gratuitamente",
    ctaSecondary: "Entrar na minha academia",
    setup: "Configuração em 10 min",
    noCard: "Sem cartão de crédito",
    trial: "14 dias grátis",
  },
  footer: { tagline: "Feito para a comunidade de jiu-jitsu", signIn: "Entrar →" },
  studentPortal: {
    navLabel: "Sou aluno",
    title: "Treine mais inteligente, acompanhe tudo",
    subtitle:
      "Sua academia já te convidou? Entre com o email que o seu professor cadastrou e abra direto o app do aluno.",
    cta: "Abrir painel do aluno",
    footnote: "Ainda não tem acesso? Peça ao seu professor para enviar o link de ativação.",
  },
  login: {
    h1: "Bem-vindo de volta",
    subtitle: "Entre na sua conta Kumo",
    emailLabel: "Endereço de e-mail",
    emailPlaceholder: "professor@suaacademia.com.br",
    passwordLabel: "Senha",
    passwordPlaceholder: "••••••••",
    cta: "Entrar",
    loading: "Entrando…",
    errorInvalid: "E-mail ou senha inválidos. Por favor, tente novamente.",
    noAccount: "Não tem uma conta?",
    signUp: "Começar agora",
    security: "Protegido por Supabase Auth · Criptografia de 256 bits",
  },
}

// ─── Portuguese Portugal ──────────────────────────────────────────────────────

const ptPT: Messages = {
  meta: {
    title: "Kumo — O Centro de Controlo para Academias de BJJ",
    description:
      "Gestão de membros, agendamento de aulas e análise de presenças — uma plataforma criada especialmente para academias de Brazilian Jiu-Jitsu.",
  },
  nav: {
    features: "Funcionalidades",
    pricing: "Preços",
    academies: "Para academias",
    signIn: "Entrar",
    getStarted: "Começar",
  },
  hero: {
    badge: "Feito para a academia de BJJ moderna",
    h1: "Menos caos na gestão",
    h1Gradient: "Mais foco no tatami",
    subtitle:
      "Gestão de membros, pagamentos, agendamento de aulas e análise de retenção — uma plataforma criada para academias de jiu-jitsu. Sem folhas de cálculo. Sem grupos de WhatsApp. Só controlo.",
    ctaPrimary: "Iniciar período de teste",
    ctaSecondary: "Ver funcionalidades",
    noCard: "Sem cartão de crédito · 14 dias de teste · Configuração em menos de 10 min",
  },
  stats: {
    academies: "Academias no mundo",
    members: "Membros monitorizados",
    uptime: "SLA de disponibilidade",
    pageLoad: "Tempo médio de carregamento",
  },
  features: {
    tag: "Funcionalidades da plataforma",
    h2: "Tudo o que a sua academia precisa",
    subtitle: "Da faixa branca à faixa preta — acompanhamos cada etapa da jornada.",
    items: [
      {
        title: "Gestão de Membros",
        description:
          "Cada aluno, cada faixa, cada grau — tudo num só lugar. Perfis geridos, convites por portal e atribuição instantânea de funções.",
      },
      {
        title: "Agendamento de Aulas",
        description:
          "Crie modelos de aulas e gere semanas de sessões com um clique. Defina instrutores, tipo de kimono, capacidade e nível de faixa.",
      },
      {
        title: "Controlo de Presenças",
        description:
          "Registe presenças em segundos a partir de qualquer dispositivo. Toque para marcar, toque novamente para desmarcar. Contagem em tempo real.",
      },
      {
        title: "Análise de Retenção",
        description:
          "Identifique automaticamente membros em risco de abandono com base nos padrões de presença. Aja antes que desapareçam.",
      },
      {
        title: "Segurança Multi-Academia",
        description:
          "Cada academia é completamente isolada. Segurança por linha, acesso com âmbito JWT e zero exposição entre academias.",
      },
      {
        title: "Configuração Instantânea",
        description:
          "Sem chamadas de integração. Sem importações complexas. A sua academia a funcionar em menos de 10 minutos, do início ao fim.",
      },
    ],
  },
  howItWorks: {
    tag: "Como funciona",
    h2: "A funcionar em minutos",
    tagline: "Três passos. Sem necessidade de formação.",
    steps: [
      {
        title: "Crie a sua academia",
        body: "Configure o seu perfil, fuso horário e plano. Concluído em menos de 2 minutos.",
      },
      {
        title: "Adicione aulas e membros",
        body: "Crie modelos de aulas recorrentes, adicione os seus alunos e instrutores. Graduações incluídas.",
      },
      {
        title: "Monitorize tudo",
        body: "Gere sessões, registe presenças a partir de qualquer dispositivo e veja os dados de retenção crescerem.",
      },
    ],
  },
  testimonials: [
    {
      quote: "O Kumo transformou a forma como faço a gestão da minha academia. Tudo organizado, presenças automáticas, e finalmente consigo focar no ensino.",
      author: "Murilo Rocha",
      role: "Rocha Team Iguaba Grande",
    },
    {
      quote: "Desde que começámos a usar o Kumo, reduzimos drasticamente o tempo administrativo. A melhor ferramenta para gestão de academias de BJJ.",
      author: "Lucas Reis",
      role: "Iguaba Jiu Jitsu",
    },
  ],
  pricing: {
    tag: "Preços",
    h2: "Planos que crescem com a sua academia.",
    tagline: "Sem taxas por membro. Sem surpresas. Cancele quando quiser.",
    plans: [
      {
        name: "Starter",
        description: "Para academias pequenas a começar.",
        features: [
          "Até 50 membros",
          "Agendamento de aulas",
          "Controlo de presenças",
          "Relatórios básicos",
        ],
        cta: "Iniciar 14 dias de teste",
      },
      {
        name: "Growth",
        description: "Para academias em crescimento que precisam de mais.",
        features: [
          "Até 200 membros",
          "Tudo do Starter",
          "Importação CSV",
          "Portal do aluno",
          "Check-in automático",
          "Suporte prioritário",
        ],
        cta: "Iniciar 14 dias de teste",
      },
      {
        name: "Pro",
        description: "Para academias estabelecidas em escala.",
        features: [
          "Membros ilimitados",
          "Tudo do Growth",
          "Marca personalizada",
          "Acesso à API",
          "Suporte dedicado",
        ],
        cta: "Iniciar 14 dias de teste",
      },
    ],
    noCard: "Sem cartão de crédito",
  },
  cta: {
    h2: "A sua academia merece",
    h2Gradient: "melhores ferramentas",
    subtitle:
      "Deixe de gerir a sua equipa em grupos de WhatsApp e folhas de cálculo. O Kumo foi criado para a forma como as academias de jiu-jitsu realmente funcionam.",
    ctaPrimary: "Começar gratuitamente",
    ctaSecondary: "Entrar na minha academia",
    setup: "Configuração em 10 min",
    noCard: "Sem cartão de crédito",
    trial: "14 dias de teste",
  },
  footer: { tagline: "Feito para a comunidade de jiu-jitsu", signIn: "Entrar →" },
  studentPortal: {
    navLabel: "Sou aluno",
    title: "Treine de forma mais inteligente, acompanhe tudo",
    subtitle:
      "A sua academia já o convidou? Entre com o email que o seu professor registou e abra diretamente a app do aluno.",
    cta: "Abrir portal do aluno",
    footnote: "Ainda não tem acesso? Peça ao seu professor para enviar o link de ativação.",
  },
  login: {
    h1: "Bem-vindo de volta",
    subtitle: "Entre na sua conta Kumo",
    emailLabel: "Endereço de e-mail",
    emailPlaceholder: "professor@suaacademia.pt",
    passwordLabel: "Palavra-passe",
    passwordPlaceholder: "••••••••",
    cta: "Entrar",
    loading: "A entrar…",
    errorInvalid: "E-mail ou palavra-passe inválidos. Por favor, tente novamente.",
    noAccount: "Não tem uma conta?",
    signUp: "Começar agora",
    security: "Protegido por Supabase Auth · Encriptação de 256 bits",
  },
}

// ─── German ───────────────────────────────────────────────────────────────────

const de: Messages = {
  meta: {
    title: "Kumo — Die Kommandozentrale für BJJ-Akademien",
    description:
      "Mitgliederverwaltung, Trainingsplanung und Anwesenheitsanalyse — eine Plattform, speziell entwickelt für Brazilian Jiu-Jitsu Akademien.",
  },
  nav: {
    features: "Funktionen",
    pricing: "Preise",
    academies: "Für Akademien",
    signIn: "Anmelden",
    getStarted: "Loslegen",
  },
  hero: {
    badge: "Entwickelt für die moderne BJJ-Akademie",
    h1: "Weniger Chaos in der Verwaltung",
    h1Gradient: "Mehr Fokus auf der Matte",
    subtitle:
      "Mitgliederverwaltung, Zahlungen, Trainingsplanung und Retentionsanalyse — eine Plattform, speziell für BJJ-Akademien. Keine Tabellen. Keine WhatsApp-Gruppen. Nur Kontrolle.",
    ctaPrimary: "Kostenlos testen",
    ctaSecondary: "Funktionen entdecken",
    noCard: "Keine Kreditkarte · 14 Tage kostenlos · Einrichtung in unter 10 Min.",
  },
  stats: {
    academies: "Akademien weltweit",
    members: "Erfasste Mitglieder",
    uptime: "Verfügbarkeits-SLA",
    pageLoad: "Ø Ladezeit",
  },
  features: {
    tag: "Plattform-Features",
    h2: "Alles, was Ihre Akademie braucht",
    subtitle: "Von Weiß- bis Schwarzgurt — wir verfolgen jeden Schritt der Reise.",
    items: [
      {
        title: "Mitgliederverwaltung",
        description:
          "Jeder Schüler, jeder Gurt, jeder Streifen — alles an einem Ort. Verwaltete Profile, Portal-Einladungen und sofortige Rollenzuweisung.",
      },
      {
        title: "Trainingsplanung",
        description:
          "Erstellen Sie Kursvorlagen und generieren Sie Wochen von Einheiten mit einem Klick. Instruktoren, Gi-Typen, Kapazitätslimits und Gurtanforderungen einstellbar.",
      },
      {
        title: "Anwesenheitsverfolgung",
        description:
          "Anwesenheit in Sekunden von jedem Gerät erfassen. Tippen zum Markieren, erneut tippen zum Aufheben. Echtzeit-Zählungen, null Aufwand.",
      },
      {
        title: "Retentionsanalyse",
        description:
          "Schüler, die aufgrund von Anwesenheitsmustern abzubrechen drohen, werden automatisch erkannt. Handeln Sie, bevor sie verschwinden.",
      },
      {
        title: "Multi-Tenant-Sicherheit",
        description:
          "Jede Akademie ist vollständig isoliert. Zeilensicherheit, JWT-Bereichszugriff und keine Datenweitergabe zwischen Akademien.",
      },
      {
        title: "Sofortige Einrichtung",
        description:
          "Keine Onboarding-Anrufe. Keine komplexen Importe. Ihre Akademie läuft in unter 10 Minuten — von Anfang bis Ende.",
      },
    ],
  },
  howItWorks: {
    tag: "So funktioniert es",
    h2: "In Minuten einsatzbereit",
    tagline: "Drei Schritte. Keine Schulung erforderlich.",
    steps: [
      {
        title: "Akademie erstellen",
        body: "Profil einrichten, Zeitzone und Plan konfigurieren. In unter 2 Minuten erledigt.",
      },
      {
        title: "Kurse & Mitglieder hinzufügen",
        body: "Wiederkehrende Kursvorlagen erstellen, Schüler und Instruktoren hinzufügen. Gurtgrade inklusive.",
      },
      {
        title: "Alles verfolgen",
        body: "Einheiten generieren, Anwesenheit von jedem Gerät erfassen, Retentionsdaten beobachten.",
      },
    ],
  },
  testimonials: [
    {
      quote: "Kumo hat die Verwaltung meiner Akademie komplett verändert. Alles organisiert, Anwesenheit automatisch, und ich kann mich endlich aufs Unterrichten konzentrieren.",
      author: "Murilo Rocha",
      role: "Rocha Team Iguaba Grande",
    },
    {
      quote: "Seit wir Kumo nutzen, haben wir unsere Verwaltungszeit drastisch reduziert. Das beste Tool für BJJ-Akademie-Management.",
      author: "Lucas Reis",
      role: "Iguaba Jiu Jitsu",
    },
  ],
  pricing: {
    tag: "Preise",
    h2: "Pläne, die mit Ihrer Akademie wachsen.",
    tagline: "Keine Kosten pro Schüler. Keine Überraschungen. Jederzeit kündbar.",
    plans: [
      {
        name: "Starter",
        description: "Für kleine Akademien am Anfang.",
        features: [
          "Bis zu 50 Mitglieder",
          "Trainingsplanung",
          "Anwesenheitsverfolgung",
          "Grundlegende Berichte",
        ],
        cta: "14-tägige Testversion starten",
      },
      {
        name: "Growth",
        description: "Für wachsende Akademien, die mehr brauchen.",
        features: [
          "Bis zu 200 Mitglieder",
          "Alles aus Starter",
          "CSV-Import",
          "Schülerportal",
          "Selbst-Check-in",
          "Prioritätssupport",
        ],
        cta: "14-tägige Testversion starten",
      },
      {
        name: "Pro",
        description: "Für etablierte Akademien im großen Maßstab.",
        features: [
          "Unbegrenzte Mitglieder",
          "Alles aus Growth",
          "Eigenes Branding",
          "API-Zugang",
          "Dedizierter Support",
        ],
        cta: "14-tägige Testversion starten",
      },
    ],
    noCard: "Keine Kreditkarte erforderlich",
  },
  cta: {
    h2: "Ihre Akademie verdient",
    h2Gradient: "bessere Tools",
    subtitle:
      "Hören Sie auf, Ihr Team in WhatsApp-Gruppen und Google Sheets zu verwalten. Kumo wurde genau dafür entwickelt, wie Jiu-Jitsu-Akademien wirklich arbeiten.",
    ctaPrimary: "Kostenlos starten",
    ctaSecondary: "Bei meiner Akademie anmelden",
    setup: "10-Min-Einrichtung",
    noCard: "Keine Kreditkarte",
    trial: "14 Tage kostenlos",
  },
  footer: { tagline: "Für die Jiu-Jitsu-Gemeinschaft", signIn: "Anmelden →" },
  studentPortal: {
    navLabel: "Ich bin Schüler",
    title: "Smarter trainieren, alles im Blick",
    subtitle:
      "Deine Akademie hat dich bereits eingeladen? Melde dich mit der E-Mail an, die dein Trainer eingetragen hat, und springe direkt in deine Schüler-App.",
    cta: "Schüler-Portal öffnen",
    footnote: "Noch keinen Zugang? Bitte deinen Trainer, dir den Aktivierungslink zu senden.",
  },
  login: {
    h1: "Willkommen zurück",
    subtitle: "Bei Ihrem Kumo-Konto anmelden",
    emailLabel: "E-Mail-Adresse",
    emailPlaceholder: "professor@ihreakademie.de",
    passwordLabel: "Passwort",
    passwordPlaceholder: "••••••••",
    cta: "Anmelden",
    loading: "Wird angemeldet…",
    errorInvalid: "Ungültige E-Mail oder ungültiges Passwort. Bitte versuchen Sie es erneut.",
    noAccount: "Noch kein Konto?",
    signUp: "Jetzt starten",
    security: "Gesichert durch Supabase Auth · 256-Bit-Verschlüsselung",
  },
}

// ─── French ───────────────────────────────────────────────────────────────────

const fr: Messages = {
  meta: {
    title: "Kumo — Le Centre de Commandement pour les Académies BJJ",
    description:
      "Gestion des membres, planification des séances et analyse des présences — une plateforme conçue spécialement pour les académies de Brazilian Jiu-Jitsu.",
  },
  nav: {
    features: "Fonctionnalités",
    pricing: "Tarifs",
    academies: "Pour les académies",
    signIn: "Connexion",
    getStarted: "Commencer",
  },
  hero: {
    badge: "Conçu pour l'académie BJJ moderne",
    h1: "Moins de chaos dans la gestion",
    h1Gradient: "Plus de focus sur le tatami",
    subtitle:
      "Gestion des membres, paiements, planification des cours et analyse de rétention — une plateforme conçue pour les académies BJJ. Sans tableurs. Sans groupes WhatsApp. Juste du contrôle.",
    ctaPrimary: "Démarrer l'essai gratuit",
    ctaSecondary: "Découvrir les fonctionnalités",
    noCard: "Sans carte bancaire · 14 jours gratuits · Installation en moins de 10 min",
  },
  stats: {
    academies: "Académies dans le monde",
    members: "Membres suivis",
    uptime: "SLA de disponibilité",
    pageLoad: "Temps de chargement moyen",
  },
  features: {
    tag: "Fonctionnalités",
    h2: "Tout ce dont votre académie a besoin",
    subtitle: "De la ceinture blanche à la noire — nous suivons chaque étape du parcours.",
    items: [
      {
        title: "Gestion des Membres",
        description:
          "Chaque élève, chaque ceinture, chaque gallon — tout au même endroit. Profils gérés, invitations au portail et attribution instantanée des rôles.",
      },
      {
        title: "Planification des Séances",
        description:
          "Créez des modèles de cours et générez des semaines de séances en un clic. Définissez instructeurs, types de gi, limites de capacité et niveaux requis.",
      },
      {
        title: "Suivi des Présences",
        description:
          "Prenez les présences en quelques secondes depuis n'importe quel appareil. Appuyez pour marquer, appuyez à nouveau pour décocher. Comptage en temps réel.",
      },
      {
        title: "Analyse de Rétention",
        description:
          "Identifiez automatiquement les élèves à risque d'abandon selon leurs habitudes de présence. Agissez avant qu'ils ne disparaissent.",
      },
      {
        title: "Sécurité Multi-Académie",
        description:
          "Chaque académie est totalement isolée. Sécurité au niveau des lignes, accès JWT délimité et zéro exposition entre académies.",
      },
      {
        title: "Installation Instantanée",
        description:
          "Pas d'appels d'intégration. Pas d'imports complexes. Votre académie opérationnelle en moins de 10 minutes, de bout en bout.",
      },
    ],
  },
  howItWorks: {
    tag: "Comment ça marche",
    h2: "Opérationnel en quelques minutes",
    tagline: "Trois étapes. Aucune formation requise.",
    steps: [
      {
        title: "Créez votre académie",
        body: "Configurez votre profil, fuseau horaire et forfait. Terminé en moins de 2 minutes.",
      },
      {
        title: "Ajoutez cours & membres",
        body: "Créez des modèles de cours récurrents, ajoutez élèves et instructeurs. Niveaux de ceinture inclus.",
      },
      {
        title: "Suivez tout",
        body: "Générez des séances, prenez les présences depuis n'importe quel appareil, observez les données de rétention s'accumuler.",
      },
    ],
  },
  testimonials: [
    {
      quote: "Kumo a transformé la gestion de mon académie. Tout est organisé, les présences sont automatiques, et je peux enfin me concentrer sur l'enseignement.",
      author: "Murilo Rocha",
      role: "Rocha Team Iguaba Grande",
    },
    {
      quote: "Depuis que nous utilisons Kumo, nous avons réduit drastiquement le temps administratif. Le meilleur outil de gestion d'académie de BJJ.",
      author: "Lucas Reis",
      role: "Iguaba Jiu Jitsu",
    },
  ],
  pricing: {
    tag: "Tarifs",
    h2: "Des forfaits qui évoluent avec votre académie.",
    tagline: "Pas de frais par élève. Pas de surprises. Annulez à tout moment.",
    plans: [
      {
        name: "Starter",
        description: "Pour les petites académies qui démarrent.",
        features: [
          "Jusqu'à 50 membres",
          "Planification des cours",
          "Suivi des présences",
          "Rapports de base",
        ],
        cta: "Commencer l'essai de 14 jours",
      },
      {
        name: "Growth",
        description: "Pour les académies en croissance qui ont besoin de plus.",
        features: [
          "Jusqu'à 200 membres",
          "Tout du Starter",
          "Import CSV",
          "Portail élève",
          "Auto check-in",
          "Support prioritaire",
        ],
        cta: "Commencer l'essai de 14 jours",
      },
      {
        name: "Pro",
        description: "Pour les académies établies à grande échelle.",
        features: [
          "Membres illimités",
          "Tout du Growth",
          "Marque personnalisée",
          "Accès API",
          "Support dédié",
        ],
        cta: "Commencer l'essai de 14 jours",
      },
    ],
    noCard: "Aucune carte bancaire requise",
  },
  cta: {
    h2: "Votre académie mérite",
    h2Gradient: "de meilleurs outils",
    subtitle:
      "Arrêtez de gérer votre équipe dans des groupes WhatsApp et des feuilles Google. Kumo est conçu pour la façon dont les académies de jiu-jitsu fonctionnent réellement.",
    ctaPrimary: "Commencer gratuitement",
    ctaSecondary: "Accéder à mon académie",
    setup: "Installation en 10 min",
    noCard: "Sans carte bancaire",
    trial: "14 jours gratuits",
  },
  footer: { tagline: "Pour la communauté du jiu-jitsu", signIn: "Connexion →" },
  studentPortal: {
    navLabel: "Je suis élève",
    title: "Entraînez-vous plus intelligemment, suivez tout",
    subtitle:
      "Votre académie vous a déjà invité ? Connectez-vous avec l'e-mail enregistré par votre professeur et accédez directement à votre app élève.",
    cta: "Ouvrir l'espace élève",
    footnote: "Pas encore d'accès ? Demandez à votre professeur de vous envoyer le lien d'activation.",
  },
  login: {
    h1: "Bon retour",
    subtitle: "Connectez-vous à votre compte Kumo",
    emailLabel: "Adresse e-mail",
    emailPlaceholder: "professeur@votreacademie.fr",
    passwordLabel: "Mot de passe",
    passwordPlaceholder: "••••••••",
    cta: "Se connecter",
    loading: "Connexion en cours…",
    errorInvalid: "E-mail ou mot de passe invalide. Veuillez réessayer.",
    noAccount: "Pas encore de compte ?",
    signUp: "Commencer maintenant",
    security: "Sécurisé par Supabase Auth · Chiffrement 256 bits",
  },
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const messages: Record<Locale, Messages> = {
  en,
  "pt-BR": ptBR,
  "pt-PT": ptPT,
  de,
  fr,
}

export function getMessages(locale: Locale): Messages {
  return messages[locale] ?? messages.en
}
