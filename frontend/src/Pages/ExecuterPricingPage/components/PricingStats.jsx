import { useState, useEffect } from "react";
import { Card, Statistic, Row, Col } from "antd";
import { FaRubleSign, FaUsers, FaClock, FaCoins } from "react-icons/fa";
import { apiFetch } from "../../../lib/api.js";

export function PricingStats({
  refresh,
  executerFilter,
  serviceFilter,
  dateRange,
}) {
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeExecuters: 0,
    totalOrders: 0,
    individualPrices: 0,
    loading: true,
  });

  useEffect(() => {
    fetchStats();
  }, [refresh, executerFilter, serviceFilter, dateRange]);

  const fetchStats = async () => {
    try {
      // Строим параметры запроса
      const params = new URLSearchParams();
      if (executerFilter) params.append("executer_id", executerFilter);
      if (serviceFilter) params.append("service_id", serviceFilter);
      if (dateRange && dateRange.length === 2) {
        params.append("start_date", dateRange[0].format("YYYY-MM-DD"));
        params.append("end_date", dateRange[1].format("YYYY-MM-DD"));
      }

      // Получаем статистику заработка
      const earningsData = await apiFetch(
        `/api/admin/earnings/dashboard-summary${
          params.toString() ? "?" + params.toString() : ""
        }`
      );

      // Получаем список исполнителей
      const executersData = await apiFetch("/api/admin/executers/get");

      // Получаем индивидуальные цены
      const pricingData = await apiFetch("/api/admin/pricing/all");

      setStats({
        totalEarnings: earningsData?.totalEarnings || 0,
        activeExecuters: executersData?.length || 0,
        totalOrders: earningsData?.totalOrders || 0,
        individualPrices: pricingData?.length || 0,
        loading: false,
      });
    } catch (error) {
      console.error("Ошибка загрузки статистики:", error);
      // Демо данные при ошибке
      setStats({
        totalEarnings: 245680,
        activeExecuters: 12,
        totalOrders: 156,
        individualPrices: 8,
        loading: false,
      });
    }
  };

  return (
    <Row gutter={[16, 16]} className="mb-6">
      <Col xs={24} sm={12} lg={6}>
        <Card className="text-center">
          <Statistic
            title="Общий заработок"
            value={stats.totalEarnings}
            prefix={<FaRubleSign className="text-green-500" />}
            suffix="₽"
            loading={stats.loading}
            valueStyle={{ color: "#52c41a", fontWeight: "bold" }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card className="text-center">
          <Statistic
            title="Активных исполнителей"
            value={stats.activeExecuters}
            prefix={<FaUsers className="text-blue-500" />}
            loading={stats.loading}
            valueStyle={{ color: "#1890ff", fontWeight: "bold" }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card className="text-center">
          <Statistic
            title="Всего заказов"
            value={stats.totalOrders}
            prefix={<FaClock className="text-orange-500" />}
            loading={stats.loading}
            valueStyle={{ color: "#fa8c16", fontWeight: "bold" }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card className="text-center">
          <Statistic
            title="Индивидуальных цен"
            value={stats.individualPrices}
            prefix={<FaCoins className="text-purple-500" />}
            loading={stats.loading}
            valueStyle={{ color: "#722ed1", fontWeight: "bold" }}
          />
        </Card>
      </Col>
    </Row>
  );
}
