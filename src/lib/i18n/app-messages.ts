export interface AppMessages {
  nav: Record<string, string>
  common: Record<string, string>
  dashboard: Record<string, string>
}

const en: AppMessages = {
  nav: {
    dashboard: "Dashboard", members: "Members", classes: "Classes", sessions: "Sessions",
    techniques: "Techniques", contracts: "Contracts", events: "Events", feed: "Feed",
    inventory: "Inventory", checkin: "Check In", portal: "My Progress", billing: "Billing",
    settings: "Settings", analytics: "Analytics", leaderboard: "Leaderboard",
    studentBilling: "Student Billing", auditLog: "Audit Log",
  },
  common: {
    save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit", create: "Create",
    search: "Search", filter: "Filter", loading: "Loading...", noData: "No data",
    back: "Back", next: "Next", previous: "Previous", actions: "Actions",
    active: "Active", inactive: "Inactive", all: "All",
  },
  dashboard: {
    title: "Dashboard", totalMembers: "Total Members", activeStudents: "Active Students",
    instructors: "Instructors", admins: "Admins", upcomingSessions: "Upcoming Sessions",
    atRiskStudents: "At-Risk Students", quickActions: "Quick Actions",
    addMember: "Add Member", newClass: "New Class", viewSessions: "Sessions",
    inviteInstructor: "Invite Instructor", downloadReport: "Download Report",
  },
}

const ptBR: AppMessages = {
  nav: {
    dashboard: "Painel", members: "Alunos", classes: "Turmas", sessions: "Aulas",
    techniques: "Técnicas", contracts: "Contratos", events: "Eventos", feed: "Mural",
    inventory: "Estoque", checkin: "Check-in", portal: "Meu Progresso", billing: "Planos",
    settings: "Config.", analytics: "Analytics", leaderboard: "Ranking",
    studentBilling: "Mensalidades", auditLog: "Auditoria",
  },
  common: {
    save: "Salvar", cancel: "Cancelar", delete: "Excluir", edit: "Editar", create: "Criar",
    search: "Buscar", filter: "Filtrar", loading: "Carregando...", noData: "Sem dados",
    back: "Voltar", next: "Próximo", previous: "Anterior", actions: "Ações",
    active: "Ativo", inactive: "Inativo", all: "Todos",
  },
  dashboard: {
    title: "Painel", totalMembers: "Total de Alunos", activeStudents: "Alunos Ativos",
    instructors: "Instrutores", admins: "Admins", upcomingSessions: "Próximas Aulas",
    atRiskStudents: "Alunos em Risco", quickActions: "Ações Rápidas",
    addMember: "Adicionar Aluno", newClass: "Nova Turma", viewSessions: "Ver Aulas",
    inviteInstructor: "Convidar Instrutor", downloadReport: "Baixar Relatório",
  },
}

export const appMessages: Record<string, AppMessages> = { en, "pt-BR": ptBR, "pt-PT": ptBR, de: en, fr: en }

export function getAppMessagesSync(locale: string): AppMessages {
  return appMessages[locale] ?? appMessages.en!
}
