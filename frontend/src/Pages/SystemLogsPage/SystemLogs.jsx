import { SystemLogsHeader } from './components/SystemLogsHeader'
import { SystemLogsFilters } from './components/SystemLogsFilters'
import { SystemLogsTable } from './components/SystemLogsTable'

export function SystemLogs() {
  return (
    <>
      <SystemLogsHeader />
      <SystemLogsFilters />
      <SystemLogsTable />
    </>

  )
}