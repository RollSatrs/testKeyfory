import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Card, DatePicker, Select, Spin } from "antd";
import { apiFetch } from "../../../lib/api";
import { FaChartLine, FaRubleSign } from "react-icons/fa";
import { useState, useEffect } from "react";
import { EarningsTable } from "./EarningsTable";

const { RangePicker } = DatePicker;
const { Option } = Select;

export function EarningsChart() {
  const [earningsData, setEarningsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("area");
  const [dateRange, setDateRange] = useState([]);

  useEffect(() => {
    fetchEarningsData();
  }, [dateRange]);

  async function fetchEarningsData() {
    setLoading(true);
    try {
      let path = "/api/admin/earnings/service-executions/chart";
      if (dateRange.length === 2) {
        const fromDate = dateRange[0].format("YYYY-MM-DD");
        const toDate = dateRange[1].format("YYYY-MM-DD");
        path += `?from=${fromDate}&to=${toDate}`;
      }

      try {
        const data = await apiFetch(path);
        setEarningsData(data.chartData || []);
      } catch (err) {
        console.error("Ошибка загрузки данных заработка", err);
        setEarningsData(generateDemoData());
      }
    } catch (error) {
      console.error("Ошибка:", error);
      // Показываем демо данные
      setEarningsData(generateDemoData());
    } finally {
      setLoading(false);
    }
  }

  function generateDemoData() {
    const today = new Date();
    const data = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      data.push({
        date: date.toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
        }),
        earnings: Math.floor(Math.random() * 5000) + 1000,
        orders: Math.floor(Math.random() * 20) + 5,
        executersActive: Math.floor(Math.random() * 15) + 3,
      });
    }

    return data;
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`Дата: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name === "earnings" &&
                `Заработок: ${formatCurrency(entry.value)}`}
              {entry.name === "orders" && `Заказов: ${entry.value}`}
              {entry.name === "executersActive" &&
                `Активных исполнителей: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Card className="earnings-chart-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FaChartLine className="text-2xl text-blue-500 mr-3" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Статистика заработка
              </h3>
              <p className="text-sm text-gray-600">
                Динамика доходов и активности
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={chartType}
              onChange={setChartType}
              style={{ width: 120 }}
              size="small"
            >
              <Option value="area">Область</Option>
              <Option value="line">Линия</Option>
            </Select>

            <RangePicker
              size="small"
              onChange={(dates) => setDateRange(dates || [])}
              placeholder={["От", "До"]}
              format="DD.MM.YYYY"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-80">
            <Spin size="large" />
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart data={earningsData}>
                  <defs>
                    <linearGradient
                      id="colorEarnings"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#1890ff"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#666" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                    tickFormatter={(value) => `₽${value.toLocaleString()}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="#1890ff"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEarnings)"
                    name="earnings"
                  />
                </AreaChart>
              ) : (
                <LineChart data={earningsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#666" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                    tickFormatter={(value) => `₽${value.toLocaleString()}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke="#1890ff"
                    strokeWidth={3}
                    dot={{ fill: "#1890ff", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#1890ff", strokeWidth: 2 }}
                    name="earnings"
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#52c41a"
                    strokeWidth={2}
                    dot={{ fill: "#52c41a", strokeWidth: 2, r: 3 }}
                    name="orders"
                    yAxisId="right"
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        <style jsx>{`
          .earnings-chart-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border: none;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }
        `}</style>
      </Card>

      {/* Добавляем таблицу заработков */}
      <div className="mt-6">
        <EarningsTable />
      </div>
    </>
  );
}
