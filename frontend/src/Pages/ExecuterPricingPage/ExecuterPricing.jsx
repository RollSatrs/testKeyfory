import { PricingHeader } from "./components/PricingHeader.jsx";
import { PricingStats } from "./components/PricingStats.jsx";
import { EarningsTable } from "./components/EarningsTable.jsx";
import { ExecuterStatsTable } from "./components/ExecuterStatsTable.jsx";
import { IndividualPricingTable } from "./components/IndividualPricingTable.jsx";
import { PricingSearch } from "./components/PricingSearch.jsx";
import { Tabs } from "antd";
import { useState, useCallback } from "react";

export function ExecuterPricing() {
  const [refresh, setRefresh] = useState(false);
  const [search, setSearch] = useState("");
  const [executerFilter, setExecuterFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [dateRange, setDateRange] = useState(null);

  const handleRefresh = useCallback(() => setRefresh((r) => !r), []);

  const tabItems = [
    {
      key: "earnings",
      label: "Статистика заработка",
      children: (
        <EarningsTable
          refresh={refresh}
          onChange={handleRefresh}
          search={search}
          executerFilter={executerFilter}
          serviceFilter={serviceFilter}
          dateRange={dateRange}
        />
      ),
    },
    {
      key: "executerStats",
      label: "Статистика по исполнителям",
      children: (
        <ExecuterStatsTable
          refresh={refresh}
          onChange={handleRefresh}
          executerFilter={executerFilter}
          dateRange={dateRange}
        />
      ),
    },
    {
      key: "individualPricing",
      label: "Индивидуальные цены",
      children: (
        <IndividualPricingTable
          refresh={refresh}
          onChange={handleRefresh}
          executerFilter={executerFilter}
          serviceFilter={serviceFilter}
        />
      ),
    },
  ];

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
        <Tabs defaultActiveKey="earnings" size="large" items={tabItems} />
      </div>
    </>
  );
}
