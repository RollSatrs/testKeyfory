import { KeysMaterialsHeader } from "./components/KeysMaterialsHeader";
import { KeysMaterialsTable } from "./components/KeysMaterialsTable";
import { KeysMaterialsStats } from "./components/KeysMaterialsStats";
import { KeysMaterialsSearch as MaterialsSearch } from "./components/KeysMaterialsSearch";
import ReplacementRequests from "./components/ReplacementRequests";
import { useState, useCallback, useEffect } from "react";

export function KeysMaterials() {
  const [refresh, setRefresh] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const handleRefresh = useCallback(() => setRefresh((r) => !r), []);

  // Устанавливаем глобальную функцию обновления для вызова из ReplacementRequests
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
      />
      <KeysMaterialsTable
        refresh={refresh}
        onChange={handleRefresh}
        search={search}
        statusFilter={statusFilter}
      />
      <ReplacementRequests />
    </>
  );
}
