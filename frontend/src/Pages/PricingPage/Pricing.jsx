import { PricingHeader } from './components/PricingHeader'
import { PricingStats } from './components/PricingStats'
import { EarningsChart } from './components/EarningsChart'
import { ExecuterStatsChart } from './components/ExecuterStatsChart'

export function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PricingHeader />
        <PricingStats />
        <EarningsChart />
        <ExecuterStatsChart />
      </div>

      <style jsx>{`
        .pricing-page {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
      `}</style>
    </div>
  )
}