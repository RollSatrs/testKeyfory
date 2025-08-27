import { PricingHeader } from "./components/PricingHeader.jsx";
import { PricingStats } from "./components/PricingStats.jsx";
import { EarningsTable } from "./components/EarningsTable.jsx";
import { ExecuterStatsTable } from "./components/ExecuterStatsTable.jsx";
import { IndividualPricingTable } from "./components/IndividualPricingTable.jsx";
import { PricingSearch } from "./components/PricingSearch.jsx";
import { Tabs } from "antd";
import { useState, useCallback } from "react";

const { TabPane } = Tabs;

export function ExecuterPricing() {
  const [refresh, setRefresh] = useState(false);
  const [search, setSearch] = useState("");
  const [executerFilter, setExecuterFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [dateRange, setDateRange] = useState(null);

  const handleRefresh = useCallback(() => setRefresh((r) => !r), []);

  return (
    <>
      <PricingHeader onRefresh={handleRefresh} />
      <PricingStats
        refresh={refresh}
        executerFilter={executerFilter}
        serviceFilter={serviceFilter}
        dateRange={dateRange}
      />
      <PricingSearch
        search={search}
        setSearch={setSearch}
        executerFilter={executerFilter}
        setExecuterFilter={setExecuterFilter}
        serviceFilter={serviceFilter}
        setServiceFilter={setServiceFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />

      <div className="bg-white shadow p-6 rounded-4xl">
        <Tabs defaultActiveKey="earnings" size="large">
          <TabPane tab="Статистика заработка" key="earnings">
            <EarningsTable
              refresh={refresh}
              onChange={handleRefresh}
              search={search}
              executerFilter={executerFilter}
              serviceFilter={serviceFilter}
              dateRange={dateRange}
            />
          </TabPane>

          <TabPane tab="Статистика по исполнителям" key="executerStats">
            <ExecuterStatsTable
              refresh={refresh}
              onChange={handleRefresh}
              executerFilter={executerFilter}
              dateRange={dateRange}
            />
          </TabPane>

          <TabPane tab="Индивидуальные цены" key="individualPricing">
            <IndividualPricingTable
              refresh={refresh}
              onChange={handleRefresh}
              executerFilter={executerFilter}
              serviceFilter={serviceFilter}
            />
          </TabPane>
        </Tabs>
      </div>
    </>
  );
}
