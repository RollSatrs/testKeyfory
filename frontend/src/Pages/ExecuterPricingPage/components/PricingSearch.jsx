import { useState, useEffect } from "react";
import { Card, Input, Select, DatePicker, Button, Space } from "antd";
import { FaSearch, FaFilter, FaTimes } from "react-icons/fa";
import { apiFetch } from "../../../lib/api.js";

const { RangePicker } = DatePicker;
const { Option } = Select;

export function PricingSearch({
  search,
  setSearch,
  executerFilter,
  setExecuterFilter,
  serviceFilter,
  setServiceFilter,
  dateRange,
  setDateRange,
}) {
  const [executers, setExecuters] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    fetchExecuters();
    fetchServices();
  }, []);

  const fetchExecuters = async () => {
    try {
      const data = await apiFetch("/api/admin/executers/get");
      setExecuters(data || []);
    } catch (error) {
      console.error("Ошибка загрузки исполнителей:", error);
      setExecuters([]);
    }
  };

  const fetchServices = async () => {
    try {
      const data = await apiFetch("/api/admin/services/get");
      setServices(data || []);
    } catch (error) {
      console.error("Ошибка загрузки услуг:", error);
      setServices([]);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setExecuterFilter("");
    setServiceFilter("");
    setDateRange(null);
  };

  return (
    <Card className="mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Поиск по исполнителям, услугам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<FaSearch className="text-gray-400" />}
            allowClear
          />
        </div>

        <Select
          placeholder="Выберите исполнителя"
          value={executerFilter || undefined}
          onChange={setExecuterFilter}
          allowClear
          style={{ minWidth: 200 }}
          showSearch
          optionFilterProp="children"
        >
          {executers.map((executer) => (
            <Option key={executer.id} value={executer.id}>
              {executer.name || `Исполнитель ${executer.id}`}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="Выберите услугу"
          value={serviceFilter || undefined}
          onChange={setServiceFilter}
          allowClear
          style={{ minWidth: 200 }}
          showSearch
          optionFilterProp="children"
        >
          {services.map((service) => (
            <Option key={service.id} value={service.id}>
              {service.name}
            </Option>
          ))}
        </Select>

        <RangePicker
          value={dateRange}
          onChange={setDateRange}
          placeholder={["Дата от", "Дата до"]}
          style={{ minWidth: 240 }}
        />

        <Button onClick={handleClearFilters} icon={<FaTimes />}>
          Очистить
        </Button>
      </div>
    </Card>
  );
}
