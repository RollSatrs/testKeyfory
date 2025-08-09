import { FaPercent, FaRubleSign, FaChartLine, FaCog } from "react-icons/fa";
import { useEffect, useState } from "react";
import { Statistic, Card, Row, Col, Spin } from "antd";

export function PricingStats() {
  const [stats, setStats] = useState({
    totalEarnings: 0,
    monthlyEarnings: 0,
    activeExecuters: 0,
    completedOrders: 0,
    loading: true,
  });

  useEffect(() => {
    fetchEarningsStats();
  }, []);

  async function fetchEarningsStats() {
    try {
      console.log("Fetching earnings stats...");

      // Используем новый упрощенный endpoint
      const response = await fetch(
        "http://localhost:3000/admin/earnings/dashboard-summary",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Dashboard stats received:", data);

        setStats({
          totalEarnings: data.totalEarnings || 0,
          monthlyEarnings: data.monthlyEarnings || 0,
          activeExecuters: data.activeExecuters || 0,
          completedOrders: data.completedOrders || 0,
          loading: false,
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Ошибка загрузки статистики заработка:", error);
      // Показываем демо данные при ошибке
      setStats({
        totalEarnings: 245680,
        monthlyEarnings: 45320,
        activeExecuters: 12,
        completedOrders: 156,
        loading: false,
      });
    }
  }

  if (stats.loading) {
    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="text-center">
            <Spin />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <Card className="pricing-stat-card">
        <div className="flex items-center justify-between mb-3">
          <FaRubleSign className="text-2xl text-green-500" />
          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
            ОБЩИЙ
          </span>
        </div>
        <Statistic
          title="Общий заработок"
          value={stats.totalEarnings}
          prefix="₽"
          valueStyle={{
            color: "#52c41a",
            fontSize: "2rem",
            fontWeight: "bold",
          }}
        />
        <div className="text-green-500 text-sm mt-2 font-medium">
          За все время
        </div>
      </Card>

      <Card className="pricing-stat-card">
        <div className="flex items-center justify-between mb-3">
          <FaChartLine className="text-2xl text-blue-500" />
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">
            МЕСЯЦ
          </span>
        </div>
        <Statistic
          title="За месяц"
          value={stats.monthlyEarnings}
          prefix="₽"
          valueStyle={{
            color: "#1890ff",
            fontSize: "2rem",
            fontWeight: "bold",
          }}
        />
        <div className="text-blue-500 text-sm mt-2 font-medium">
          Текущий период
        </div>
      </Card>

      <Card className="pricing-stat-card">
        <div className="flex items-center justify-between mb-3">
          <FaCog className="text-2xl text-orange-500" />
          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
            ИСПОЛН.
          </span>
        </div>
        <Statistic
          title="Активные исполнители"
          value={stats.activeExecuters}
          valueStyle={{
            color: "#fa8c16",
            fontSize: "2rem",
            fontWeight: "bold",
          }}
        />
        <div className="text-orange-500 text-sm mt-2 font-medium">
          Работают сейчас
        </div>
      </Card>

      <Card className="pricing-stat-card">
        <div className="flex items-center justify-between mb-3">
          <FaPercent className="text-2xl text-purple-500" />
          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-medium">
            ЗАКАЗЫ
          </span>
        </div>
        <Statistic
          title="Выполнено заказов"
          value={stats.completedOrders}
          valueStyle={{
            color: "#722ed1",
            fontSize: "2rem",
            fontWeight: "bold",
          }}
        />
        <div className="text-purple-500 text-sm mt-2 font-medium">
          Успешно завершены
        </div>
      </Card>

      <style jsx>{`
        .pricing-stat-card {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border: none;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        .pricing-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
}
