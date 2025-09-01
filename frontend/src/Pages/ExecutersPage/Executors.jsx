import { ExecutorsHeader } from "./components/ExecutorsHeader";
import { ExecutorsStats } from "./components/ExecutorsStats";
import { ExecuterTable } from "./components/ExecuterTable";
import { ExecutorsSearch } from "./components/ExecutorsSearch";
import { useState, useMemo } from "react";

export function Executors() {
  const [refresh, setRefresh] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");
  const [executors, setExecutors] = useState([]);

  const filteredExecutors = useMemo(() => {
    return executors.filter((e) => {
      const matchesSearch =
        !search ||
        (e.name && e.name.toLowerCase().includes(search.toLowerCase())) ||
        (e.telegram_id &&
          e.telegram_id.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = !statusFilter || e.status === statusFilter;

      const matchesService =
        !serviceFilter ||
        (e.assigned_services &&
          e.assigned_services.some(
            (service) =>
              service.service_name &&
              service.service_name
                .toLowerCase()
                .includes(serviceFilter.toLowerCase())
          ));

      const matchesMaterial =
        !materialFilter ||
        (e.materials &&
          e.materials.some(
            (material) =>
              material.type_key &&
              material.type_key
                .toLowerCase()
                .includes(materialFilter.toLowerCase())
          ));

      return (
        matchesSearch && matchesStatus && matchesService && matchesMaterial
      );
    });
  }, [executors, search, statusFilter, serviceFilter, materialFilter]);

  // Для выбора "Все рейтинги" можно добавить кнопку или иконку сброса фильтра
  // Например, в ExecutorsSearch добавить кнопку "Все рейтинги" или allowClear для Rate

  return (
    <>
      <ExecutorsHeader onAdd={() => setRefresh((r) => !r)} />
      <ExecutorsStats refresh={refresh} />
      <ExecutorsSearch
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        serviceFilter={serviceFilter}
        setServiceFilter={setServiceFilter}
        materialFilter={materialFilter}
        setMaterialFilter={setMaterialFilter}
      />
      <ExecuterTable
        onChanged={() => setRefresh((r) => !r)}
        setExecutors={setExecutors}
        executors={filteredExecutors}
        refresh={refresh}
      />
    </>
  );
}
