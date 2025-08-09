import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Card, Select, Spin, Statistic, Row, Col, Tabs } from "antd";
import {
  FaChartPie,
  FaTrophy,
  FaExclamationTriangle,
  FaArrowUp,
} from "react-icons/fa";
import { useState, useEffect } from "react";

const { Option } = Select;
const { TabPane } = Tabs;

const COLORS = [
  "#1890ff",
  "#52c41a",
  "#faad14",
  "#f5222d",
  "#722ed1",
  "#13c2c2",
  "#fa8c16",
  "#eb2f96",
];

export function ServicesAnalytics() {
  const [servicesData, setServicesData] = useState({
    allServices: [],
    topByEarnings: [],
    topByOrders: [],
    topBySuccessRate: [],
    poorPerformers: [],
    summary: {},
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [activeTab, setActiveTab] = useState("earnings");

  useEffect(() => {
    fetchServicesData();
  }, [period]);

  async function fetchServicesData() {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/admin/earnings/services/performance?period=${period}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setServicesData(data);
      } else {
        console.error("Ошибка загрузки статистики услуг");
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
    const serviceNames = [
      "Копирование ключей",
      "Вскрытие замков",
      "Установка замков",
      "Ремонт ключей",
      "Изготовление дубликатов",
      "Аварийное вскрытие",
      "Замена личинок",
      "Настройка замков",
    ];

    const allServices = serviceNames.map((name, index) => ({
      id: index + 1,
      name: name,
      price: Math.floor(Math.random() * 3000) + 500,
      totalOrders: Math.floor(Math.random() * 50) + 10,
      completedOrders: Math.floor(Math.random() * 40) + 8,
      cancelledOrders: Math.floor(Math.random() * 5),
      totalEarnings: Math.floor(Math.random() * 100000) + 20000,
      successRate: Math.floor(Math.random() * 30) + 70,
      uniqueExecuters: Math.floor(Math.random() * 8) + 2,
    }));

    const topByEarnings = [...allServices]
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 6);
    const topByOrders = [...allServices]
      .sort((a, b) => b.completedOrders - a.completedOrders)
      .slice(0, 6);
    const topBySuccessRate = [...allServices]
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 6);
    const poorPerformers = [...allServices]
      .sort((a, b) => a.successRate - b.successRate)
      .slice(0, 3);

    setServicesData({
      allServices,
      topByEarnings,
      topByOrders,
      topBySuccessRate,
      poorPerformers,
      summary: {
        totalServices: allServices.length,
        activeServices: allServices.filter((s) => s.totalOrders > 0).length,
        totalRevenue: allServices.reduce((sum, s) => sum + s.totalEarnings, 0),
        totalOrders: allServices.reduce((sum, s) => sum + s.totalOrders, 0),
        averageSuccessRate: Math.round(
          allServices.reduce((sum, s) => sum + s.successRate, 0) /
            allServices.length
        ),
      },
    });
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
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-blue-600">{`Доход: ${formatCurrency(
            data.totalEarnings
          )}`}</p>
          <p className="text-green-600">{`Выполнено: ${data.completedOrders} заказов`}</p>
          <p className="text-orange-600">{`Успешность: ${data.successRate}%`}</p>
          <p className="text-purple-600">{`Исполнителей: ${data.uniqueExecuters}`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="services-analytics-card">
        <div className="flex justify-center items-center h-96">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и фильтры */}
      <Card className="services-analytics-header">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FaChartPie className="text-2xl text-purple-500 mr-3" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">Анализ услуг</h3>
              <p className="text-sm text-gray-600">
                Что лучше продается и производительность услуг
              </p>
            </div>
          </div>

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

        {/* Общая статистика */}
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Statistic
              title="Общий доход"
              value={servicesData.summary.totalRevenue}
              prefix="₽"
              valueStyle={{ color: "#52c41a", fontSize: "1.5rem" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Всего заказов"
              value={servicesData.summary.totalOrders}
              valueStyle={{ color: "#1890ff", fontSize: "1.5rem" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Активных услуг"
              value={servicesData.summary.activeServices}
              suffix={`/ ${servicesData.summary.totalServices}`}
              valueStyle={{ color: "#722ed1", fontSize: "1.5rem" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Средняя успешность"
              value={servicesData.summary.averageSuccessRate}
              suffix="%"
              valueStyle={{ color: "#faad14", fontSize: "1.5rem" }}
            />
          </Col>
        </Row>
      </Card>

      {/* Табы с разными видами анализа */}
      <Card className="services-analytics-tabs">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <FaArrowUp className="mr-2" />
                По доходу
              </span>
            }
            key="earnings"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* График топ услуг по доходу */}
              <div>
                <h4 className="text-base font-bold text-gray-900 mb-4">
                  Топ услуги по доходу
                </h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={servicesData.topByEarnings}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        stroke="#666"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                        tickFormatter={(value) =>
                          `₽${(value / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="totalEarnings"
                        fill="#52c41a"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Круговая диаграмма распределения доходов */}
              <div>
                <h4 className="text-base font-bold text-gray-900 mb-4">
                  Распределение доходов
                </h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={servicesData.topByEarnings.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) =>
                          `${
                            name.length > 12
                              ? name.substring(0, 12) + "..."
                              : name
                          }: ${(percent * 1).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="totalEarnings"
                      >
                        {servicesData.topByEarnings
                          .slice(0, 6)
                          .map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [formatCurrency(value), "Доход"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <FaTrophy className="mr-2" />
                По заказам
              </span>
            }
            key="orders"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* График топ услуг по количеству заказов */}
              <div>
                <h4 className="text-base font-bold text-gray-900 mb-4">
                  Топ услуги по заказам
                </h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={servicesData.topByOrders}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        stroke="#666"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} stroke="#666" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="completedOrders"
                        fill="#1890ff"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Список популярных услуг */}
              <div>
                <h4 className="text-base font-bold text-gray-900 mb-4">
                  Самые популярные услуги
                </h4>
                <div className="space-y-3">
                  {servicesData.topByOrders
                    .slice(0, 8)
                    .map((service, index) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 ${
                              index === 0
                                ? "bg-yellow-500"
                                : index === 1
                                ? "bg-gray-400"
                                : index === 2
                                ? "bg-orange-600"
                                : "bg-blue-500"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {service.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              Успешность: {service.successRate}%
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-blue-600 text-sm">
                            {service.completedOrders} заказов
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(service.totalEarnings)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <FaExclamationTriangle className="mr-2" />
                Проблемные
              </span>
            }
            key="problems"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Услуги с низкой успешностью */}
              <div>
                <h4 className="text-base font-bold text-red-600 mb-4">
                  Услуги с низкой успешностью
                </h4>
                <div className="space-y-3">
                  {servicesData.poorPerformers.map((service, index) => (
                    <div
                      key={service.id}
                      className="p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-red-900">
                          {service.name}
                        </h5>
                        <span className="text-red-600 font-bold">
                          {service.successRate}%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-red-700">
                        <div>Заказов: {service.totalOrders}</div>
                        <div>Выполнено: {service.completedOrders}</div>
                        <div>Отменено: {service.cancelledOrders}</div>
                      </div>
                      <div className="mt-2 text-xs text-red-600">
                        Потеря дохода:{" "}
                        {formatCurrency(
                          service.cancelledOrders * service.price
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Рекомендации по улучшению */}
              <div>
                <h4 className="text-base font-bold text-gray-900 mb-4">
                  Рекомендации
                </h4>
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">
                      💡 Увеличить цены на популярные услуги
                    </h5>
                    <p className="text-blue-700 text-sm">
                      Услуги с высоким спросом можно продавать дороже
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-2">
                      📈 Продвигать прибыльные услуги
                    </h5>
                    <p className="text-green-700 text-sm">
                      Фокус на услугах с высоким доходом на заказ
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h5 className="font-medium text-orange-900 mb-2">
                      🔧 Улучшить проблемные услуги
                    </h5>
                    <p className="text-orange-700 text-sm">
                      Провести анализ причин отмен и улучшить процесс
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      <style jsx>{`
        .services-analytics-card {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border: none;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        .services-analytics-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          color: white;
        }
        .services-analytics-header h3,
        .services-analytics-header p {
          color: white;
        }
        .services-analytics-tabs {
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
          border: none;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
