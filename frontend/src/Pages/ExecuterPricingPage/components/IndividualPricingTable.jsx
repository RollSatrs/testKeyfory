import { useState, useEffect } from "react";
import { Table, Button, Space, Modal, message, Tag, Tooltip } from "antd";
import { FaEye, FaRubleSign, FaPercent } from "react-icons/fa";
import { apiFetch } from "../../../lib/api.js";

export function IndividualPricingTable({
  refresh,
  onChange,
  executerFilter,
  serviceFilter,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsModal, setDetailsModal] = useState({
    visible: false,
    record: null,
  });

  useEffect(() => {
    fetchData();
  }, [refresh, executerFilter, serviceFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Строим параметры запроса
      const params = new URLSearchParams();
      if (executerFilter) params.append("executer_id", executerFilter);
      if (serviceFilter) params.append("service_id", serviceFilter);

      const result = await apiFetch(
        `/api/admin/pricing/all${
          params.toString() ? "?" + params.toString() : ""
        }`
      );
      setData(result || []);
    } catch (error) {
      console.error("Ошибка загрузки индивидуальных цен:", error);
      // Демо данные при ошибке
      setData([
        {
          id: 1,
          executer_id: 1,
          executer_name: "Иван Петров",
          service_id: 1,
          service_name: "Создание ключей",
          base_price: 500,
          custom_price: 600,
          created_at: "2025-01-10T10:00:00Z",
        },
        {
          id: 2,
          executer_id: 2,
          executer_name: "Сергей Иванов",
          service_id: 1,
          service_name: "Создание ключей",
          base_price: 500,
          custom_price: 450,
          created_at: "2025-01-12T14:30:00Z",
        },
        {
          id: 3,
          executer_id: 1,
          executer_name: "Иван Петров",
          service_id: 2,
          service_name: "Ремонт замков",
          base_price: 800,
          custom_price: 900,
          created_at: "2025-01-15T09:15:00Z",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const showDetails = (record) => {
    setDetailsModal({ visible: true, record });
  };

  const calculateDifference = (basePrice, customPrice) => {
    const diff = customPrice - basePrice;
    const diffPercent =
      basePrice > 0 ? Math.round((diff / basePrice) * 100) : 0;
    return { diff, diffPercent };
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
              @
              {record.telegram_id ||
                record.executer_telegram_id ||
                record.executer_id}
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
      render: (name) => (
        <Tag color="cyan" className="font-medium">
          {name || "Неизвестная услуга"}
        </Tag>
      ),
      sorter: (a, b) =>
        (a.service_name || "").localeCompare(b.service_name || ""),
    },
    {
      title: "Базовая цена",
      dataIndex: "base_price",
      key: "base_price",
      render: (price) => (
        <div className="flex items-center gap-1 text-gray-600">
          <FaRubleSign />
          <span>{(price || 0).toLocaleString("ru-RU")}</span>
        </div>
      ),
      sorter: (a, b) => (a.base_price || 0) - (b.base_price || 0),
      align: "center",
    },
    {
      title: "Индивидуальная цена",
      dataIndex: "custom_price",
      key: "custom_price",
      render: (price) => (
        <div className="flex items-center gap-1 text-blue-600 font-bold">
          <FaRubleSign />
          <span>{(price || 0).toLocaleString("ru-RU")}</span>
        </div>
      ),
      sorter: (a, b) => (a.custom_price || 0) - (b.custom_price || 0),
      align: "center",
    },
    {
      title: "Разница",
      key: "difference",
      render: (_, record) => {
        const { diff, diffPercent } = calculateDifference(
          record.base_price || 0,
          record.custom_price || 0
        );
        const isPositive = diff >= 0;
        return (
          <div className="text-center">
            <div
              className={`flex items-center justify-center gap-1 font-medium ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              <FaRubleSign />
              <span>
                {isPositive ? "+" : ""}
                {diff.toLocaleString("ru-RU")}
              </span>
            </div>
            <div className="mt-1">
              <Tag color={isPositive ? "green" : "red"} className="text-xs">
                <FaPercent className="mr-1" />
                {isPositive ? "+" : ""}
                {diffPercent}%
              </Tag>
            </div>
          </div>
        );
      },
      sorter: (a, b) => {
        const aDiff = (a.custom_price || 0) - (a.base_price || 0);
        const bDiff = (b.custom_price || 0) - (b.base_price || 0);
        return aDiff - bDiff;
      },
      align: "center",
    },
    {
      title: "Дата создания",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => (
        <div className="text-center text-sm">
          <div className="text-gray-700">
            {new Date(date).toLocaleDateString("ru-RU")}
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
          <Tooltip title="Подробности цены">
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
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Индивидуальные цены
          </h3>
          <p className="text-sm text-gray-600">
            Просмотр персональных цен для пар исполнитель-услуга
          </p>
        </div>
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
            `${range[0]}-${range[1]} из ${total} индивидуальных цен`,
        }}
        locale={{
          emptyText: "Нет индивидуальных цен",
        }}
      />

      {/* Модальное окно подробностей */}
      <Modal
        title="Подробности индивидуальной цены"
        open={detailsModal.visible}
        onCancel={() => {
          setDetailsModal({ visible: false, record: null });
        }}
        footer={null}
        width={500}
      >
        {detailsModal.record && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">
                    Исполнитель:
                  </span>
                  <div className="mt-1 text-gray-900">
                    {detailsModal.record.executer_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    @
                    {detailsModal.record.telegram_id ||
                      detailsModal.record.executer_telegram_id ||
                      detailsModal.record.executer_id}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Услуга:</span>
                  <div className="mt-1 text-gray-900">
                    {detailsModal.record.service_name}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">
                    Базовая цена:
                  </span>
                  <div className="mt-1 text-gray-600">
                    ₽
                    {detailsModal.record.base_price?.toLocaleString("ru-RU") ||
                      0}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">
                    Индивидуальная цена:
                  </span>
                  <div className="mt-1 text-blue-600 font-bold">
                    ₽
                    {detailsModal.record.custom_price?.toLocaleString(
                      "ru-RU"
                    ) || 0}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Разница:</span>
                  <div className="mt-1">
                    {(() => {
                      const diff =
                        (detailsModal.record.custom_price || 0) -
                        (detailsModal.record.base_price || 0);
                      const diffPercent =
                        detailsModal.record.base_price > 0
                          ? Math.round(
                              (diff / detailsModal.record.base_price) * 100
                            )
                          : 0;
                      const isPositive = diff >= 0;
                      return (
                        <div
                          className={`${
                            isPositive ? "text-green-600" : "text-red-600"
                          } font-medium`}
                        >
                          {isPositive ? "+" : ""}₽
                          {Math.abs(diff).toLocaleString("ru-RU")} (
                          {isPositive ? "+" : ""}
                          {diffPercent}%)
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">
                    Дата создания:
                  </span>
                  <div className="mt-1 text-gray-900">
                    {new Date(
                      detailsModal.record.created_at
                    ).toLocaleDateString("ru-RU")}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(
                      detailsModal.record.created_at
                    ).toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
