import { useState, useEffect } from "react";
import { FiFilter } from "react-icons/fi";
import { Select, Input, Button, message } from "antd";
import { apiFetch } from "../../../lib/api";

export function KeysMaterialsSearch({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  serviceFilter,
  setServiceFilter,
  executerFilter,
  setExecuterFilter,
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [services, setServices] = useState([]);
  const [executers, setExecuters] = useState([]);

  // Загрузка услуг
  useEffect(() => {
    async function fetchServices() {
      try {
        const data = await apiFetch("/api/admin/services/get");
        setServices(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Ошибка загрузки услуг:", error);
      }
    }
    fetchServices();
  }, []);

  // Загрузка исполнителей
  useEffect(() => {
    async function fetchExecuters() {
      try {
        const data = await apiFetch("/api/admin/executers/get");
        setExecuters(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Ошибка загрузки исполнителей:", error);
      }
    }
    fetchExecuters();
  }, []);

  return (
    <div className="flex flex-col gap-2 bg-gradient-to-r from-blue-50 via-white to-blue-100 rounded-2xl px-4 py-3 shadow-md mb-6">
      <div className="flex gap-3 items-center">
        <Input
          allowClear
          placeholder="Поиск по содержимому..."
          className="flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 0 }}
        />
        <Button
          type="primary"
          icon={<FiFilter size={20} />}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl shadow hover:from-blue-600 hover:to-cyan-500 transition font-semibold border-0"
          style={{
            background: "linear-gradient(to right, #3b82f6, #06b6d4)",
            border: "none",
          }}
          onClick={() => setShowFilters((f) => !f)}
        >
          Фильтры
        </Button>
      </div>
      {showFilters && (
        <div className="flex flex-col gap-2 md:flex-row md:gap-4 items-center">
          <Select
            className="w-full md:w-48"
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            placeholder="Все статусы"
            options={[
              { value: "", label: "Все статусы" },
              { value: "доступен", label: "Доступен" },
              { value: "использован", label: "Использован" },
              { value: "заменен", label: "Заменен" },
            ]}
            allowClear
          />
          <Select
            className="w-full md:w-48"
            value={serviceFilter}
            onChange={(value) => setServiceFilter(value)}
            placeholder="Все услуги"
            options={[
              { value: "", label: "Все услуги" },
              ...services.map((service) => ({
                value: service.id,
                label: service.name,
              })),
            ]}
            allowClear
          />
          <Select
            className="w-full md:w-48"
            value={executerFilter}
            onChange={(value) => setExecuterFilter(value)}
            placeholder="Все исполнители"
            options={[
              { value: "", label: "Все исполнители" },
              ...executers.map((executer) => ({
                value: executer.id,
                label: executer.name || `ID: ${executer.telegram_id}`,
              })),
            ]}
            allowClear
          />
        </div>
      )}
    </div>
  );
}
