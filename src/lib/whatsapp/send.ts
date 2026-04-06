import "server-only"

const WHATSAPP_API = "https://graph.facebook.com/v18.0"

export async function sendWhatsAppMessage(opts: {
  phoneNumberId: string
  accessToken: string
  to: string
  message: string
}): Promise<boolean> {
  try {
    const res = await fetch(`${WHATSAPP_API}/${opts.phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${opts.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: opts.to, type: "text", text: { body: opts.message } }),
    })
    return res.ok
  } catch { return false }
}

export function classReminderMsg(cls: string, date: string, time: string) {
  return `🥋 *Lembrete de Aula*\n\n${cls}\n📅 ${date}\n🕐 ${time}\n\nTe esperamos no tatame! 🤙`
}
export function paymentReminderMsg(amount: string, due: string) {
  return `💰 *Lembrete de Pagamento*\n\nSua mensalidade de *${amount}* vence em *${due}*.\n\nPague via PIX pelo app.`
}
export function overdueMsg(amount: string, days: number) {
  return `⚠️ *Pagamento em Atraso*\n\nSua mensalidade de *${amount}* está *${days} dia(s)* em atraso.\n\nRegularize para manter seu treino ativo.`
}
export function welcomeMsg(name: string, academy: string) {
  return `🥋 Bem-vindo(a) à *${academy}*, ${name}!\n\nAcesse seu portal em grapplingflow.com/app/portal\n\nOss! 🤙`
}
