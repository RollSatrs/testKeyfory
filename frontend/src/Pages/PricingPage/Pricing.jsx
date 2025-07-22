import { PricingHeader } from './components/PricingHeader'
import { PricingStats } from './components/PricingStats'
import { PricingGlobalSettings } from './components/PricingGlobalSettings'
import { PricingTable } from './components/PricingTable'

export function Pricing() {
  return (
    <>
        <PricingHeader />
        <PricingStats />
        <PricingGlobalSettings />
        <PricingTable />
    </>
  )
}