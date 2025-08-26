import { PricingHeader } from "./components/PricingHeader";
import { PricingStats } from "./components/PricingStats";
import { EarningsChart } from "./components/EarningsChart";
import { ExecuterStatsChart } from "./components/ExecuterStatsChart";
import { ServicesAnalytics } from "./components/ServicesAnalytics";
import { ComparativeAnalytics } from "./components/ComparativeAnalytics";
import { PricingTable } from "./components/PricingTable";
import { Tabs } from "antd";
import {
  FaChartLine,
  FaUsers,
  FaCog,
  FaBalanceScale,
  FaChartPie,
  FaRubleSign,
} from "react-icons/fa";

const { TabPane } = Tabs;

export function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-6">
      <div className="max-w-7xl mx-auto">
        <PricingHeader />

        <Tabs
          defaultActiveKey="overview"
          size="large"
          className="pricing-tabs mt-6"
        >
          <TabPane
            tab={
              <span className="flex items-center">
                <FaChartLine className="mr-2" />
                Обзор доходов
              </span>
            }
            key="overview"
          >
            <div className="space-y-6">
              <PricingStats />
              <EarningsChart />
              <ExecuterStatsChart />
            </div>
          </TabPane>

          <TabPane
            tab={
              <span className="flex items-center">
                <FaRubleSign className="mr-2" />
                Индивидуальные цены
              </span>
            }
            key="pricing"
          >
            <PricingTable />
          </TabPane>

          <TabPane
            tab={
              <span className="flex items-center">
                <FaCog className="mr-2" />
                Анализ услуг
              </span>
            }
            key="services"
          >
            <ServicesAnalytics />
          </TabPane>

          <TabPane
            tab={
              <span className="flex items-center">
                <FaBalanceScale className="mr-2" />
                Сравнительная аналитика
              </span>
            }
            key="comparative"
          >
            <ComparativeAnalytics />
          </TabPane>
        </Tabs>
      </div>

      <style jsx global>{`
        .pricing-tabs .ant-tabs-nav {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px 12px 0 0;
          padding: 0 20px;
          margin-bottom: 0;
        }

        .pricing-tabs .ant-tabs-tab {
          color: rgba(255, 255, 255, 0.8);
          border: none;
          margin: 0 10px;
          padding: 12px 0;
        }

        .pricing-tabs .ant-tabs-tab:hover {
          color: white;
        }

        .pricing-tabs .ant-tabs-tab-active {
          color: white !important;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px 8px 0 0;
        }

        .pricing-tabs .ant-tabs-ink-bar {
          background: white;
          height: 3px;
        }

        .pricing-tabs .ant-tabs-content-holder {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 0 0 12px 12px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .pricing-page {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
      `}</style>
    </div>
  );
}
