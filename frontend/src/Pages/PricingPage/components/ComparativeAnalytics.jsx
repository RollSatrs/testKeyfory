import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
} from "recharts";
import { Card, Select, Spin, Statistic, Row, Col, Badge } from "antd";
import {
  FaArrowUp,
  FaArrowDown,
  FaEquals,
  FaCalendarAlt,
  FaChartLine,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import { BACKEND_URL } from "../../../lib/backendUrl";

const { Option } = Select;

export function ComparativeAnalytics() {
  const [comparativeData, setComparativeData] = useState({
    periodComparison: {},
    trendData: [],
    executerTrends: [],
    serviceTrends: [],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [comparisonType, setComparisonType] = useState("previous");

  useEffect(() => {
    fetchComparativeData();
  }, [period, comparisonType]);

  async function fetchComparativeData() {
    setLoading(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/admin/earnings/comparative?period=${period}&comparison=${comparisonType}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setComparativeData(data);
      } else {
        console.error("Ошибка загрузки сравнительной аналитики");
        generateDemoData();
      }
    } catch (error) {
      console.error("Ошибка:", error);
      generateDemoData();
    } finally {
      setLoading(false);
    }
  }

  function generateDemoData() {
    const getRandomChange = () => (Math.random() - 0.5) * 40;

    const periodComparison = {
      earnings: {
        current: 450000,
        previous: 380000,
        change: getRandomChange(),
      },
      orders: {
        current: 245,
        previous: 210,
        change: getRandomChange(),
      },
      executors: {
        current: 18,
        previous: 15,
        change: getRandomChange(),
      },
      avgOrderValue: {
        current: 1836,
        previous: 1810,
        change: getRandomChange(),
      },
      successRate: {
        current: 91.5,
        previous: 88.2,
        change: getRandomChange(),
      },
    };

    const trendData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(
        Date.now() - (29 - i) * 24 * 60 * 60 * 1000
      ).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
      earnings: 12000 + Math.floor(Math.random() * 8000),
      orders: 8 + Math.floor(Math.random() * 6),
      successRate: 85 + Math.floor(Math.random() * 15),
    }));

    const executerTrends = [
      "Иван Петров",
      "Анна Сидорова",
      "Михаил Козлов",
      "Елена Волкова",
      "Дмитрий Попов",
    ].map((name) => ({
      name,
      currentPeriod: Math.floor(Math.random() * 50000) + 20000,
      previousPeriod: Math.floor(Math.random() * 45000) + 18000,
      change: getRandomChange(),
      orders: Math.floor(Math.random() * 30) + 10,
    }));

    const serviceTrends = [
      "Копирование ключей",
      "Вскрытие замков",
      "Установка замков",
      "Ремонт ключей",
      "Изготовление дубликатов",
    ].map((name) => ({
      name,
      currentPeriod: Math.floor(Math.random() * 80000) + 30000,
      previousPeriod: Math.floor(Math.random() * 75000) + 25000,
      change: getRandomChange(),
      orders: Math.floor(Math.random() * 40) + 15,
    }));

    setComparativeData({
      periodComparison,
      trendData,
      executerTrends,
      serviceTrends,
    });
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <FaArrowUp className="text-green-500" />;
    if (change < 0) return <FaArrowDown className="text-red-500" />;
    return <FaEquals className="text-gray-500" />;
  };

  const getChangeColor = (change) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getChangeBadge = (change) => {
    const type = change > 0 ? "success" : change < 0 ? "error" : "default";
    return (
      <Badge
        count={`${change > 0 ? "+" : ""}${change.toFixed(1)}%`}
        style={{
          backgroundColor:
            change > 0 ? "#52c41a" : change < 0 ? "#f5222d" : "#d9d9d9",
          color: "white",
        }}
      />
    );
  };

  if (loading) {
    return (
      <Card className="comparative-analytics-card">
        <div className="flex justify-center items-center h-96">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и фильтры */}
      <Card className="comparative-analytics-header">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FaChartLine className="text-2xl text-blue-500 mr-3" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Сравнительная аналитика
              </h3>
              <p className="text-sm text-gray-600">
                Анализ трендов и изменений по периодам
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Select
              value={comparisonType}
              onChange={setComparisonType}
              style={{ width: 180 }}
              size="small"
            >
              <Option value="previous">Предыдущий период</Option>
              <Option value="year">Прошлый год</Option>
              <Option value="quarter">Прошлый квартал</Option>
            </Select>
            <Select
              value={period}
              onChange={setPeriod}
              style={{ width: 120 }}
              size="small"
            >
              <Option value="week">Неделя</Option>
              <Option value="month">Месяц</Option>
              <Option value="quarter">Квартал</Option>
            </Select>
          </div>
        </div>

        {/* Ключевые показатели с изменениями */}
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center mb-2">
                {getChangeIcon(
                  comparativeData.periodComparison.earnings?.change || 0
                )}
                <span className="ml-2 text-lg font-bold text-gray-900">
                  Доходы
                </span>
              </div>
              <Statistic
                value={comparativeData.periodComparison.earnings?.current || 0}
                prefix="₽"
                valueStyle={{ color: "#52c41a", fontSize: "1.2rem" }}
              />
              <div className="mt-2">
                {getChangeBadge(
                  comparativeData.periodComparison.earnings?.change || 0
                )}
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center mb-2">
                {getChangeIcon(
                  comparativeData.periodComparison.orders?.change || 0
                )}
                <span className="ml-2 text-lg font-bold text-gray-900">
                  Заказы
                </span>
              </div>
              <Statistic
                value={comparativeData.periodComparison.orders?.current || 0}
                valueStyle={{ color: "#1890ff", fontSize: "1.2rem" }}
              />
              <div className="mt-2">
                {getChangeBadge(
                  comparativeData.periodComparison.orders?.change || 0
                )}
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center mb-2">
                {getChangeIcon(
                  comparativeData.periodComparison.avgOrderValue?.change || 0
                )}
                <span className="ml-2 text-lg font-bold text-gray-900">
                  Средний чек
                </span>
              </div>
              <Statistic
                value={
                  comparativeData.periodComparison.avgOrderValue?.current || 0
                }
                prefix="₽"
                valueStyle={{ color: "#faad14", fontSize: "1.2rem" }}
              />
              <div className="mt-2">
                {getChangeBadge(
                  comparativeData.periodComparison.avgOrderValue?.change || 0
                )}
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center mb-2">
                {getChangeIcon(
                  comparativeData.periodComparison.successRate?.change || 0
                )}
                <span className="ml-2 text-lg font-bold text-gray-900">
                  Успешность
                </span>
              </div>
              <Statistic
                value={
                  comparativeData.periodComparison.successRate?.current || 0
                }
                suffix="%"
                valueStyle={{ color: "#722ed1", fontSize: "1.2rem" }}
              />
              <div className="mt-2">
                {getChangeBadge(
                  comparativeData.periodComparison.successRate?.change || 0
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Графики трендов */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Тренд доходов и заказов */}
        <Card className="trend-chart-card">
          <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center">
            <FaCalendarAlt className="mr-2 text-blue-500" />
            Тренд доходов и заказов
          </h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={comparativeData.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#666" />
                <YAxis
                  yAxisId="earnings"
                  orientation="left"
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                  tickFormatter={(value) => `₽${(value / 1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === "earnings" ? formatCurrency(value) : value,
                    name === "earnings"
                      ? "Доходы"
                      : name === "orders"
                      ? "Заказы"
                      : "Успешность",
                  ]}
                />
                <Bar
                  yAxisId="earnings"
                  dataKey="earnings"
                  fill="#52c41a"
                  opacity={0.7}
                  radius={[2, 2, 0, 0]}
                />
                <Line
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  stroke="#1890ff"
                  strokeWidth={3}
                  dot={{ fill: "#1890ff", strokeWidth: 2, r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Тренд успешности */}
        <Card className="trend-chart-card">
          <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center">
            <FaChartLine className="mr-2 text-purple-500" />
            Тренд успешности
          </h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparativeData.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#666" />
                <YAxis
                  domain={[80, 100]}
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip formatter={(value) => [`${value}%`, "Успешность"]} />
                <Line
                  type="monotone"
                  dataKey="successRate"
                  stroke="#722ed1"
                  strokeWidth={3}
                  dot={{ fill: "#722ed1", strokeWidth: 2, r: 4 }}
                  fill="url(#successGradient)"
                />
                <defs>
                  <linearGradient
                    id="successGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#722ed1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#722ed1" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Изменения по исполнителям и услугам */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Топ исполнители по росту */}
        <Card className="trends-list-card">
          <h4 className="text-base font-bold text-gray-900 mb-4">
            Изменения по исполнителям
          </h4>
          <div className="space-y-3">
            {comparativeData.executerTrends
              .slice(0, 8)
              .map((executer, index) => (
                <div
                  key={executer.name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm mr-3">
                      {executer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {executer.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {executer.orders} заказов в периоде
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-blue-600 text-sm">
                      {formatCurrency(executer.currentPeriod)}
                    </div>
                    <div
                      className={`text-xs ${getChangeColor(
                        executer.change
                      )} flex items-center justify-end`}
                    >
                      {getChangeIcon(executer.change)}
                      <span className="ml-1">
                        {executer.change > 0 ? "+" : ""}
                        {executer.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Card>

        {/* Топ услуги по росту */}
        <Card className="trends-list-card">
          <h4 className="text-base font-bold text-gray-900 mb-4">
            Изменения по услугам
          </h4>
          <div className="space-y-3">
            {comparativeData.serviceTrends.slice(0, 8).map((service, index) => (
              <div
                key={service.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {service.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {service.orders} заказов в периоде
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600 text-sm">
                    {formatCurrency(service.currentPeriod)}
                  </div>
                  <div
                    className={`text-xs ${getChangeColor(
                      service.change
                    )} flex items-center justify-end`}
                  >
                    {getChangeIcon(service.change)}
                    <span className="ml-1">
                      {service.change > 0 ? "+" : ""}
                      {service.change.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <style jsx>{`
        .comparative-analytics-card {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border: none;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        .comparative-analytics-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          color: white;
        }
        .comparative-analytics-header h3,
        .comparative-analytics-header p {
          color: white;
        }
        .trend-chart-card,
        .trends-list-card {
          background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
          border: none;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
