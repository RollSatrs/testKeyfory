import { AnalyticsHeader } from './components/AnalyticsHeader'
import { AnalyticsStats } from './components/AnalyticsStats'
import { RevenueChart } from './components/RevenueChart'
import { ServicesPieChart } from './components/ServicesPieChart'

export function Analytics() {
  return (
    <>
        {/*  */}
        <AnalyticsHeader/>
        <AnalyticsStats/>
        <div className="grid grid-cols-2 gap-6 mt-4">
            <RevenueChart />
            <ServicesPieChart />
        </div>
    </>

  )
}