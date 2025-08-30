import { KeysMaterialsHeader } from "./components/KeysMaterialsHeader";
import { KeysMaterialsTable } from "./components/KeysMaterialsTable";
import { KeysMaterialsStats } from "./components/KeysMaterialsStats";
import { KeysMaterialsSearch as MaterialsSearch } from "./components/KeysMaterialsSearch";
import { useState, useCallback, useEffect } from "react";

export function KeysMaterials() {
  const [refresh, setRefresh] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [executerFilter, setExecuterFilter] = useState("");

  const handleRefresh = useCallback(() => setRefresh((r) => !r), []);

  // Устанавливаем глобальную функцию обновления для вызова из других компонентов (если потребуется)
  useEffect(() => {
    window.refreshMaterialsList = handleRefresh;
    return () => {
      delete window.refreshMaterialsList;
    };
  }, [handleRefresh]);

  return (
    <>
      <KeysMaterialsHeader />
      <KeysMaterialsStats refresh={refresh} />
      <MaterialsSearch
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        serviceFilter={serviceFilter}
        setServiceFilter={setServiceFilter}
        executerFilter={executerFilter}
        setExecuterFilter={setExecuterFilter}
      />
      <KeysMaterialsTable
        refresh={refresh}
        onChange={handleRefresh}
        search={search}
        statusFilter={statusFilter}
        serviceFilter={serviceFilter}
        executerFilter={executerFilter}
      />
    </>
  );
}
