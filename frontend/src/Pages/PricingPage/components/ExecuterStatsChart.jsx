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
} from "recharts";
import { Card, Select, Spin, Statistic, Row, Col } from "antd";
import { FaUser, FaMedal, FaChartBar } from "react-icons/fa";
import { useState, useEffect } from "react";

const { Option } = Select;

const COLORS = [
  "#1890ff",
  "#52c41a",
  "#faad14",
  "#f5222d",
  "#722ed1",
  "#13c2c2",
];

export function ExecuterStatsChart() {
  const [executerStats, setExecuterStats] = useState([]);
  const [topExecuters, setTopExecuters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("bar");
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    fetchExecuterStats();
  }, [period]);

  async function fetchExecuterStats() {
    setLoading(true);
    try {
      console.log("Fetching executer stats...");

      const res = await fetch(
        `http://localhost:3000/admin/earnings/simple-executer-stats`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        console.log("Executer stats received:", data);

        // Преобразуем данные в нужный формат
        const stats = data.map((executer) => ({
          name: executer.name,
          earnings: executer.earnings,
          orders: executer.orders,
          rating: executer.rating.toFixed(1),
          completionRate: executer.completionRate,
        }));

        const topStats = stats
          .sort((a, b) => b.earnings - a.earnings)
          .slice(0, 6)
          .map((item, index) => ({
            ...item,
            rank: index + 1,
            percentage: (
              (item.earnings / stats.reduce((sum, s) => sum + s.earnings, 0)) *
              100
            ).toFixed(1),
          }));

        setExecuterStats(stats);
        setTopExecuters(topStats);
      } else {
        console.error("Ошибка загрузки статистики исполнителей");
        // Показываем демо данные
        generateDemoData();
      }
    } catch (error) {
      console.error("Ошибка:", error);
      // Показываем демо данные
      generateDemoData();
    } finally {
      setLoading(false);
    }
  }

  function generateDemoData() {
    const executerNames = [
      "Иван Петров",
      "Мария Иванова",
      "Сергей Сидоров",
      "Анна Козлова",
      "Дмитрий Орлов",
    ];

    const stats = executerNames.map((name, index) => ({
      name: name,
      earnings: Math.floor(Math.random() * 50000) + 10000,
      orders: Math.floor(Math.random() * 30) + 5,
      rating: (Math.random() * 2 + 3).toFixed(1),
      completionRate: Math.floor(Math.random() * 20) + 80,
    }));

    const topStats = stats
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 6)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        percentage: (
          (item.earnings / stats.reduce((sum, s) => sum + s.earnings, 0)) *
          100
        ).toFixed(1),
      }));

    setExecuterStats(stats);
    setTopExecuters(topStats);
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
          <p className="text-blue-600">{`Заработок: ${formatCurrency(
            data.earnings
          )}`}</p>
          <p className="text-green-600">{`Заказов: ${data.orders}`}</p>
          <p className="text-orange-600">{`Рейтинг: ${data.rating}`}</p>
          <p className="text-purple-600">{`Выполнено: ${data.completionRate}%`}</p>
        </div>
      );
    }
    return null;
  };

  const totalEarnings = executerStats.reduce(
    (sum, executer) => sum + executer.earnings,
    0
  );
  const totalOrders = executerStats.reduce(
    (sum, executer) => sum + executer.orders,
    0
  );
  const averageRating =
    executerStats.length > 0
      ? (
          executerStats.reduce(
            (sum, executer) => sum + parseFloat(executer.rating),
            0
          ) / executerStats.length
        ).toFixed(1)
      : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Основная статистика */}
      <Card className="executer-stats-card lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FaChartBar className="text-2xl text-purple-500 mr-3" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Статистика по исполнителям
              </h3>
              <p className="text-sm text-gray-600">Заработок и активность</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={chartType}
              onChange={setChartType}
              style={{ width: 120 }}
              size="small"
            >
              <Option value="bar">Столбцы</Option>
              <Option value="pie">Круговая</Option>
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

        {loading ? (
          <div className="flex justify-center items-center h-80">
            <Spin size="large" />
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart data={executerStats}>
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
                    tickFormatter={(value) => `₽${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="earnings"
                    fill="#1890ff"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={topExecuters}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="earnings"
                  >
                    {topExecuters.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), "Заработок"]}
                  />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Топ исполнители и общая статистика */}
      <div className="space-y-6">
        {/* Общая статистика */}
        <Card className="executer-stats-summary">
          <h4 className="text-base font-bold text-gray-900 mb-4">
            Общая статистика
          </h4>
          <Row gutter={[0, 16]}>
            <Col span={24}>
              <Statistic
                title="Общий заработок"
                value={totalEarnings}
                prefix="₽"
                valueStyle={{ color: "#1890ff", fontSize: "1.5rem" }}
              />
            </Col>
            <Col span={24}>
              <Statistic
                title="Всего заказов"
                value={totalOrders}
                valueStyle={{ color: "#52c41a", fontSize: "1.2rem" }}
              />
            </Col>
            <Col span={24}>
              <Statistic
                title="Средний рейтинг"
                value={averageRating}
                suffix="/5.0"
                precision={1}
                valueStyle={{ color: "#faad14", fontSize: "1.2rem" }}
              />
            </Col>
          </Row>
        </Card>

        {/* Топ исполнители */}
        <Card className="top-executers-card">
          <div className="flex items-center mb-4">
            <FaMedal className="text-xl text-yellow-500 mr-2" />
            <h4 className="text-base font-bold text-gray-900">
              Топ исполнители
            </h4>
          </div>

          <div className="space-y-3">
            {topExecuters.slice(0, 5).map((executer, index) => (
              <div
                key={executer.name}
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
                      {executer.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {executer.orders} заказов
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600 text-sm">
                    {formatCurrency(executer.earnings)}
                  </div>
                  <div className="text-xs text-gray-500">
                    ★ {executer.rating}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <style jsx>{`
        .executer-stats-card {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border: none;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        .executer-stats-summary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          color: white;
        }
        .executer-stats-summary h4 {
          color: white;
        }
        .top-executers-card {
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
          border: none;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
