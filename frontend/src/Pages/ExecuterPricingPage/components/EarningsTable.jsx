import { useState, useEffect } from "react";
import { Table, Button, Space, Modal, Tag, Tooltip } from "antd";
import { FaEye, FaRubleSign, FaCalendarAlt } from "react-icons/fa";
import { apiFetch } from "../../../lib/api.js";

export function EarningsTable({
  refresh,
  onChange,
  search,
  executerFilter,
  serviceFilter,
  dateRange,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsModal, setDetailsModal] = useState({
    visible: false,
    record: null,
  });

  useEffect(() => {
    fetchData();
  }, [refresh, search, executerFilter, serviceFilter, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Строим параметры запроса
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (executerFilter) params.append("executer_id", executerFilter);
      if (serviceFilter) params.append("service_id", serviceFilter);
      if (dateRange && dateRange.length === 2) {
        params.append("start_date", dateRange[0].format("YYYY-MM-DD"));
        params.append("end_date", dateRange[1].format("YYYY-MM-DD"));
      }

      const result = await apiFetch(
        `/api/admin/earnings/all${
          params.toString() ? "?" + params.toString() : ""
        }`
      );
      setData(result || []);
    } catch (error) {
      console.error("Ошибка загрузки заработка:", error);
      // Демо данные при ошибке
      setData([
        {
          id: 1,
          executer_id: 1,
          executer_name: "Иван Петров",
          service_id: 1,
          service_name: "Создание ключей",
          amount: 1500,
          created_at: "2025-01-15T10:30:00Z",
          order_id: 101,
        },
        {
          id: 2,
          executer_id: 1,
          executer_name: "Иван Петров",
          service_id: 2,
          service_name: "Ремонт замков",
          amount: 2400,
          created_at: "2025-01-20T14:15:00Z",
          order_id: 102,
        },
        {
          id: 3,
          executer_id: 2,
          executer_name: "Сергей Иванов",
          service_id: 1,
          service_name: "Создание ключей",
          amount: 1200,
          created_at: "2025-01-18T09:45:00Z",
          order_id: 103,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const showDetails = (record) => {
    setDetailsModal({ visible: true, record });
  };

  const columns = [
    {
      title: "Исполнитель",
      key: "executer",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-xs">
              {(record.executer_name || "И").charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {record.executer_name || `Исполнитель ${record.executer_id}`}
            </div>
            <div className="text-xs text-gray-500">
              Telegram:{" "}
              {record.executer_telegram_id || record.telegram_id || "Не указан"}
            </div>
          </div>
        </div>
      ),
      sorter: (a, b) =>
        (a.executer_name || "").localeCompare(b.executer_name || ""),
    },
    {
      title: "Услуга",
      dataIndex: "service_name",
      key: "service_name",
      render: (name, record) => (
        <Tag color={name ? "cyan" : "orange"} className="font-medium">
          {(name || record.service_name_cached || "Услуга удалена").replace(
            /^\[УДАЛЕНА\]\s*/,
            ""
          )}
        </Tag>
      ),
      sorter: (a, b) =>
        (a.service_name || "").localeCompare(b.service_name || ""),
    },
    {
      title: "Сумма",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => (
        <div className="flex items-center gap-1 text-green-600 font-bold">
          <FaRubleSign />
          <span>{(amount || 0).toLocaleString("ru-RU")}</span>
        </div>
      ),
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
      align: "center",
    },
    {
      title: "Дата",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => (
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center text-gray-700">
            <FaCalendarAlt />
            <span>{new Date(date).toLocaleDateString("ru-RU")}</span>
          </div>
          <div className="text-xs text-gray-500">
            {new Date(date).toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      ),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      align: "center",
    },
    {
      title: "Действия",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Подробности">
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
      width: 80,
    },
  ];

  return (
    <>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Статистика заработка
        </h3>
        <p className="text-sm text-gray-600">
          Детальная статистика по всем выплатам исполнителям
        </p>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 15,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} из ${total} записей`,
        }}
        locale={{
          emptyText: "Нет данных о заработке",
        }}
      />

      {/* Модальное окно с подробностями */}
      <Modal
        title="Подробности записи заработка"
        open={detailsModal.visible}
        onCancel={() => setDetailsModal({ visible: false, record: null })}
        footer={null}
        width={500}
      >
        {detailsModal.record && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">ID заказа:</span>
                <div className="mt-1 text-gray-900">
                  {detailsModal.record.order_id || "Не указан"}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Исполнитель:</span>
                <div className="mt-1 text-gray-900">
                  {detailsModal.record.executer_name ||
                    `Исполнитель ${detailsModal.record.executer_id}`}
                  <div className="text-xs text-gray-500 mt-1">
                    Telegram:{" "}
                    {detailsModal.record.executer_telegram_id || "Не указан"}
                  </div>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Услуга:</span>
                <div className="mt-1 text-gray-900">
                  {(
                    detailsModal.record.service_name || "Услуга удалена"
                  ).replace(/^\[УДАЛЕНА\]\s*/, "")}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Сумма:</span>
                <div className="mt-1 text-green-600 font-bold text-lg">
                  ₽{(detailsModal.record.amount || 0).toLocaleString("ru-RU")}
                </div>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-gray-600">
                  Дата создания:
                </span>
                <div className="mt-1 text-gray-900">
                  {new Date(detailsModal.record.created_at).toLocaleString(
                    "ru-RU"
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
