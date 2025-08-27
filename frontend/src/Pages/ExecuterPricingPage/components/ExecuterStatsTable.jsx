import { useState, useEffect } from "react";
import { Table, Button, Space, Modal, Tooltip, Statistic, Card } from "antd";
import { FaEye, FaClock, FaRubleSign, FaChartLine } from "react-icons/fa";
import { apiFetch } from "../../../lib/api.js";

export function ExecuterStatsTable({
  refresh,
  onChange,
  executerFilter,
  dateRange,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsModal, setDetailsModal] = useState({
    visible: false,
    record: null,
  });
  const [timeStats, setTimeStats] = useState({});

  useEffect(() => {
    fetchData();
    fetchTimeStats();
  }, [refresh, executerFilter, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Строим параметры запроса
      const params = new URLSearchParams();
      if (executerFilter) params.append("executer_id", executerFilter);
      if (dateRange && dateRange.length === 2) {
        params.append("start_date", dateRange[0].format("YYYY-MM-DD"));
        params.append("end_date", dateRange[1].format("YYYY-MM-DD"));
      }

      const result = await apiFetch(
        `/api/admin/earnings/by-executer${
          params.toString() ? "?" + params.toString() : ""
        }`
      );
      setData(result || []);
    } catch (error) {
      console.error("Ошибка загрузки статистики исполнителей:", error);
      // Демо данные при ошибке
      setData([
        {
          executer_id: 1,
          executer_name: "Иван Петров",
          total_amount: 45000,
          order_count: 25,
          avg_amount: 1800,
          services: ["Создание ключей", "Ремонт замков", "Установка замков"],
        },
        {
          executer_id: 2,
          executer_name: "Сергей Иванов",
          total_amount: 32400,
          order_count: 18,
          avg_amount: 1800,
          services: ["Создание ключей", "Ремонт замков"],
        },
        {
          executer_id: 3,
          executer_name: "Алексей Сидоров",
          total_amount: 28800,
          order_count: 16,
          avg_amount: 1800,
          services: ["Создание ключей"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeStats = async () => {
    try {
      const params = new URLSearchParams();
      if (executerFilter) params.append("executer_id", executerFilter);
      if (dateRange && dateRange.length === 2) {
        params.append("start_date", dateRange[0].format("YYYY-MM-DD"));
        params.append("end_date", dateRange[1].format("YYYY-MM-DD"));
      }

      const result = await apiFetch(
        `/api/admin/service-executions/time-stats${
          params.toString() ? "?" + params.toString() : ""
        }`
      );

      // Преобразуем в объект для быстрого доступа
      const statsMap = {};
      if (result && Array.isArray(result)) {
        result.forEach((stat) => {
          statsMap[stat.executer_id] = {
            avg_time_minutes: stat.avg_time_minutes || 0,
            fastest_time_minutes: stat.fastest_time_minutes || 0,
            slowest_time_minutes: stat.slowest_time_minutes || 0,
            total_executions: stat.total_executions || 0,
          };
        });
      }
      setTimeStats(statsMap);
    } catch (error) {
      console.error("Ошибка загрузки статистики времени:", error);
      // Демо данные
      setTimeStats({
        1: {
          avg_time_minutes: 45,
          fastest_time_minutes: 15,
          slowest_time_minutes: 90,
          total_executions: 25,
        },
        2: {
          avg_time_minutes: 55,
          fastest_time_minutes: 20,
          slowest_time_minutes: 120,
          total_executions: 18,
        },
        3: {
          avg_time_minutes: 40,
          fastest_time_minutes: 10,
          slowest_time_minutes: 80,
          total_executions: 16,
        },
      });
    }
  };

  const showDetails = (record) => {
    setDetailsModal({ visible: true, record });
  };

  const formatTime = (minutes) => {
    if (!minutes) return "0 мин";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}ч ${mins}м`;
    }
    return `${mins}м`;
  };

  const columns = [
    {
      title: "Исполнитель",
      key: "executer",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold">
              {(record.executer_name || "И").charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {record.executer_name || `Исполнитель ${record.executer_id}`}
            </div>
            <div className="text-xs text-blue-600">
              {record.services?.length || 0} услуг
            </div>
          </div>
        </div>
      ),
      sorter: (a, b) =>
        (a.executer_name || "").localeCompare(b.executer_name || ""),
    },
    {
      title: "Общий заработок",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (amount) => (
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-green-600 font-bold text-lg">
            <FaRubleSign />
            <span>{(amount || 0).toLocaleString("ru-RU")}</span>
          </div>
        </div>
      ),
      sorter: (a, b) => (a.total_amount || 0) - (b.total_amount || 0),
      align: "center",
    },
    {
      title: "Количество заказов",
      dataIndex: "order_count",
      key: "order_count",
      render: (count) => (
        <div className="text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {count || 0}
          </span>
        </div>
      ),
      sorter: (a, b) => (a.order_count || 0) - (b.order_count || 0),
      align: "center",
    },
    {
      title: "Среднее время",
      key: "avg_time",
      render: (_, record) => {
        const stats = timeStats[record.executer_id];
        if (!stats) {
          return <span className="text-gray-400">Нет данных</span>;
        }
        return (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-orange-600 font-medium">
              <FaClock />
              <span>{formatTime(stats.avg_time_minutes)}</span>
            </div>
          </div>
        );
      },
      sorter: (a, b) => {
        const aTime = timeStats[a.executer_id]?.avg_time_minutes || 0;
        const bTime = timeStats[b.executer_id]?.avg_time_minutes || 0;
        return aTime - bTime;
      },
      align: "center",
    },
    {
      title: "Действия",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Подробная статистика">
            <Button
              type="primary"
              size="small"
              icon={<FaEye />}
              onClick={() => showDetails(record)}
            />
          </Tooltip>
        </Space>
      ),
      align: "center",
      width: 100,
    },
  ];

  return (
    <>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Статистика по исполнителям
        </h3>
        <p className="text-sm text-gray-600">
          Сводная информация по заработку и производительности каждого
          исполнителя
        </p>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="executer_id"
        pagination={{
          pageSize: 15,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} из ${total} исполнителей`,
        }}
        locale={{
          emptyText: "Нет данных по исполнителям",
        }}
      />

      {/* Модальное окно с подробной статистикой */}
      <Modal
        title={`Подробная статистика: ${
          detailsModal.record?.executer_name || "Исполнитель"
        }`}
        open={detailsModal.visible}
        onCancel={() => setDetailsModal({ visible: false, record: null })}
        footer={null}
        width={700}
      >
        {detailsModal.record && (
          <div className="space-y-6">
            {/* Основные показатели */}
            <div className="grid grid-cols-2 gap-4">
              <Card size="small">
                <Statistic
                  title="Общий заработок"
                  value={detailsModal.record.total_amount || 0}
                  prefix={<FaRubleSign />}
                  suffix="₽"
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
              <Card size="small">
                <Statistic
                  title="Количество заказов"
                  value={detailsModal.record.order_count || 0}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </div>

            {/* Статистика времени */}
            {timeStats[detailsModal.record.executer_id] && (
              <div>
                <h4 className="text-md font-semibold mb-3 text-gray-700">
                  Статистика времени выполнения
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <Card size="small">
                    <Statistic
                      title="Среднее время"
                      value={formatTime(
                        timeStats[detailsModal.record.executer_id]
                          .avg_time_minutes
                      )}
                      prefix={<FaClock />}
                      valueStyle={{ color: "#fa8c16" }}
                    />
                  </Card>
                  <Card size="small">
                    <Statistic
                      title="Быстрейшее"
                      value={formatTime(
                        timeStats[detailsModal.record.executer_id]
                          .fastest_time_minutes
                      )}
                      prefix={<FaClock />}
                      valueStyle={{ color: "#52c41a" }}
                    />
                  </Card>
                  <Card size="small">
                    <Statistic
                      title="Самое долгое"
                      value={formatTime(
                        timeStats[detailsModal.record.executer_id]
                          .slowest_time_minutes
                      )}
                      prefix={<FaClock />}
                      valueStyle={{ color: "#ff4d4f" }}
                    />
                  </Card>
                </div>
              </div>
            )}

            {/* Дополнительная информация */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">
                    Telegram ID:
                  </span>
                  <div className="mt-1 text-gray-900">
                    {detailsModal.record.telegram_id || "Не указан"}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">
                    Средний чек:
                  </span>
                  <div className="mt-1 text-green-600 font-medium">
                    ₽
                    {Math.round(
                      (detailsModal.record.total_amount || 0) /
                        (detailsModal.record.order_count || 1)
                    ).toLocaleString("ru-RU")}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">
                    Количество услуг:
                  </span>
                  <div className="mt-1 text-gray-900">
                    {detailsModal.record.services?.length || 0}
                  </div>
                </div>
              </div>

              {detailsModal.record.services &&
                detailsModal.record.services.length > 0 && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-600">Услуги:</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {detailsModal.record.services.map((service, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {service?.replace(/^\[УДАЛЕНА\]\s*/, "") || service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
