import { ExecutorsHeader } from './components/ExecutorsHeader'
import { ExecutorsStats } from './components/ExecutorsStats'
import { ExecutorsTable } from './components/ExecutorsTable'

export function Executors() {
  return (
    <>
      <ExecutorsHeader />
      <ExecutorsStats />
      <ExecutorsTable />
    </>
  )
}