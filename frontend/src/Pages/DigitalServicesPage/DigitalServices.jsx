import { ServicesHeader } from "./components/ServicesHeader";
import { ServicesTable } from "./components/ServicesTable";
import { ServicesStats } from "./components/ServicesStats";
import { ServicesSearch } from "./components/ServicesSearch";
import { useState, useCallback, useEffect } from "react";

export function DigitalServices() {
  const [refresh, setRefresh] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const handleRefresh = useCallback(() => setRefresh((r) => !r), []);

  // Автообновление в реальном времени каждые 15 секунд
  useEffect(() => {
    console.log(
      "🔄 Запускаем автообновление данных услуг и статусов исполнителей..."
    );

    const interval = setInterval(() => {
      console.log("⏱️ Автообновление данных услуг и статусов исполнителей...");
      setRefresh((r) => !r);
    }, 15000); // 15 секунд

    return () => {
      console.log(
        "🛑 Останавливаем автообновление данных услуг и статусов исполнителей"
      );
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <ServicesHeader onAdd={handleRefresh} />
      <ServicesStats refresh={refresh} />
      <ServicesSearch
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
      />
      <ServicesTable
        refresh={refresh}
        onChange={handleRefresh}
        search={search}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
      />
    </>
  );
}
