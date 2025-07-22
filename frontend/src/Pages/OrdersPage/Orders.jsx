import { OrdersHeader } from './components/OrdersHeader'
import { OrdersStats } from './components/OrdersStats'
import { OrdersTable } from './components/OrdersTable'

export function Orders() {
  return (
    <>
      <OrdersHeader />
      <OrdersStats />
      <OrdersTable />
    </>
  )
}