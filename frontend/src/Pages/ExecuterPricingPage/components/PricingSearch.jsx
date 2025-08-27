import { useState, useEffect } from "react";
import {
  Card,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  Tag,
} from "antd";
import {
  FaSearch,
  FaFilter,
  FaTimes,
  FaCalendarWeek,
  FaCalendarDay,
} from "react-icons/fa";
import { apiFetch } from "../../../lib/api.js";
import dayjs from "dayjs";

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
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);

  useEffect(() => {
    fetchExecuters();
    fetchServices();
    fetchStats();
  }, [dateRange, executerFilter]);

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

  const fetchStats = async () => {
    try {
      // Получаем статистику за неделю
      const weekStart = dayjs().subtract(7, "day").format("YYYY-MM-DD");
      const weekEnd = dayjs().format("YYYY-MM-DD");

      // Получаем статистику за месяц
      const monthStart = dayjs().subtract(30, "day").format("YYYY-MM-DD");
      const monthEnd = dayjs().format("YYYY-MM-DD");

      const [weekStats, monthStats] = await Promise.all([
        apiFetch(
          `/api/admin/earnings/by-executer?start_date=${weekStart}&end_date=${weekEnd}`
        ),
        apiFetch(
          `/api/admin/earnings/by-executer?start_date=${monthStart}&end_date=${monthEnd}`
        ),
      ]);

      setWeeklyStats(weekStats || []);
      setMonthlyStats(monthStats || []);
    } catch (error) {
      console.error("Ошибка загрузки статистики:", error);
      setWeeklyStats([]);
      setMonthlyStats([]);
    }
  };

  // Быстрые фильтры по датам
  const setQuickDateRange = (type) => {
    const today = dayjs();
    let start, end;

    switch (type) {
      case "today":
        start = end = today;
        break;
      case "week":
        start = today.subtract(7, "day");
        end = today;
        break;
      case "month":
        start = today.subtract(30, "day");
        end = today;
        break;
      case "quarter":
        start = today.subtract(90, "day");
        end = today;
        break;
      default:
        return;
    }

    setDateRange([start, end]);
  };

  const handleClearFilters = () => {
    setSearch("");
    setExecuterFilter("");
    setServiceFilter("");
    setDateRange(null);
  };

  return (
    <div>
      <Card className="mb-4">
        <div className="flex flex-wrap gap-4 items-center mb-4">
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
                {executer.telegram_id && ` (@${executer.telegram_id})`}
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

        {/* Быстрые фильтры по датам */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-gray-600 font-medium mr-2">Быстрый выбор:</span>
          <Button
            size="small"
            icon={<FaCalendarDay />}
            onClick={() => setQuickDateRange("today")}
            type={
              dateRange && dateRange[0].isSame(dayjs(), "day")
                ? "primary"
                : "default"
            }
          >
            Сегодня
          </Button>
          <Button
            size="small"
            icon={<FaCalendarWeek />}
            onClick={() => setQuickDateRange("week")}
            type={
              dateRange &&
              dateRange[0].isSame(dayjs().subtract(7, "day"), "day")
                ? "primary"
                : "default"
            }
          >
            Неделя
          </Button>
          <Button
            size="small"
            icon={<FaCalendarWeek />}
            onClick={() => setQuickDateRange("month")}
            type={
              dateRange &&
              dateRange[0].isSame(dayjs().subtract(30, "day"), "day")
                ? "primary"
                : "default"
            }
          >
            Месяц
          </Button>
          <Button
            size="small"
            onClick={() => setQuickDateRange("quarter")}
            type={
              dateRange &&
              dateRange[0].isSame(dayjs().subtract(90, "day"), "day")
                ? "primary"
                : "default"
            }
          >
            Квартал
          </Button>
        </div>
      </Card>

      {/* Статистика исполнителей */}
      {(weeklyStats.length > 0 || monthlyStats.length > 0) && (
        <Card className="mb-4" title="Статистика активности исполнителей">
          <Row gutter={16}>
            <Col span={12}>
              <h4 className="text-md font-semibold mb-3 text-gray-700 flex items-center gap-2">
                <FaCalendarWeek className="text-blue-500" />
                За неделю
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {weeklyStats.slice(0, 5).map((stat) => (
                  <div
                    key={stat.executer_id}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm">
                      {stat.executer_name || `Исполнитель ${stat.executer_id}`}
                    </span>
                    <Tag color="blue">{stat.order_count || 0} заказов</Tag>
                  </div>
                ))}
                {weeklyStats.length === 0 && (
                  <div className="text-gray-500 text-sm">
                    Нет данных за неделю
                  </div>
                )}
              </div>
            </Col>
            <Col span={12}>
              <h4 className="text-md font-semibold mb-3 text-gray-700 flex items-center gap-2">
                <FaCalendarDay className="text-green-500" />
                За месяц
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {monthlyStats.slice(0, 5).map((stat) => (
                  <div
                    key={stat.executer_id}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm">
                      {stat.executer_name || `Исполнитель ${stat.executer_id}`}
                    </span>
                    <Tag color="green">{stat.order_count || 0} заказов</Tag>
                  </div>
                ))}
                {monthlyStats.length === 0 && (
                  <div className="text-gray-500 text-sm">
                    Нет данных за месяц
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
}
