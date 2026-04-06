import { getLocale } from "./index"
import { appMessages, type AppMessages } from "./app-messages"

export async function getAppMessages(): Promise<AppMessages> {
  const locale = await getLocale()
  return appMessages[locale] ?? appMessages.en!
}
