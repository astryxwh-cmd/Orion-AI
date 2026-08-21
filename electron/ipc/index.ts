import { registerAiIpc } from './ai'
import { registerAutomationIpc } from './automation'
import { registerConversationsIpc } from './conversations'
import { registerMobileIpc } from './mobile'
import { registerObservationIpc } from './observation'
import { registerSecretsIpc } from './secrets'
import { registerSystemIpc } from './system'
import { registerWindowIpc } from './window'

export function registerIpcHandlers(): void {
  registerWindowIpc()
  registerSystemIpc()
  registerSecretsIpc()
  registerAiIpc()
  registerConversationsIpc()
  registerAutomationIpc()
  registerObservationIpc()
  registerMobileIpc()
}