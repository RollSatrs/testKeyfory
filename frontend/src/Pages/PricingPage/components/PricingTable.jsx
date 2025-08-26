import { FiEdit, FiTrendingUp, FiDollarSign, FiEye } from "react-icons/fi";
import { FaRubleSign } from "react-icons/fa";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import {
  Table,
  Tag,
  Button,
  Modal,
  Input,
  Select,
  Space,
  message,
  Tooltip,
  Statistic,
} from "antd";

export function PricingTable() {
  const [services, setServices] = useState([]);
  const [executers, setExecuters] = useState([]);
  const [executerEarnings, setExecuterEarnings] = useState({});
  const [serviceStats, setServiceStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [customPrices, setCustomPrices] = useState({});

  useEffect(() => {
    fetchServices();
    fetchExecuters();
    fetchExecuterEarnings();
    fetchServiceStats();
  }, []);

  async function fetchServices() {
    try {
      const data = await apiFetch("/api/admin/services/get");
      setServices(data);
    } catch (error) {
      console.error("Ошибка загрузки услуг:", error);
      message.error("Ошибка загрузки услуг");
    } finally {
      setLoading(false);
    }
  }

  async function fetchExecuters() {
    try {
      const data = await apiFetch("/api/admin/executers/get");
      setExecuters(data);
    } catch (error) {
      console.error("Ошибка загрузки исполнителей:", error);
    }
  }

  async function fetchExecuterEarnings() {
    try {
      const data = await apiFetch("/api/admin/earnings/executers");
      const earningsMap = {};
      data.forEach((item) => {
        earningsMap[item.executer_id] = {
          totalEarnings: item.totalEarnings || 0,
          completedOrders: item.completedOrders || 0,
          monthlyEarnings: item.monthlyEarnings || 0,
        };
      });
      setExecuterEarnings(earningsMap);
    } catch (error) {
      console.error("Ошибка загрузки заработка исполнителей:", error);
    }
  }

  async function fetchServiceStats() {
    try {
      const data = await apiFetch("/api/admin/earnings/services");
      const statsMap = {};
      data.forEach((item) => {
        statsMap[item.service_id] = {
          totalEarnings: item.totalEarnings || 0,
          completedOrders: item.completedOrders || 0,
          averagePrice: item.averagePrice || 0,
        };
      });
      setServiceStats(statsMap);
    } catch (error) {
      console.error("Ошибка загрузки статистики услуг:", error);
    }
  }

  function openPricingModal(service) {
    setSelectedService(service);
    setEditModal(true);

    // Инициализируем кастомные цены
    const initialPrices = {};
    if (service.custom_pricing) {
      service.custom_pricing.forEach((pricing) => {
        initialPrices[pricing.executer_id] = pricing.custom_price;
      });
    }
    setCustomPrices(initialPrices);
  }

  async function handleSavePricing() {
    if (!selectedService) return;

    try {
      try {
        await apiFetch(
          `/api/admin/services/update-pricing/${selectedService.id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              base_price: selectedService.price,
              custom_pricing: Object.entries(customPrices)
                .map(([executerId, price]) => ({
                  executer_id: parseInt(executerId),
                  custom_price: parseFloat(price) || 0,
                }))
                .filter((p) => p.custom_price > 0),
            }),
          }
        );
        message.success("Цены обновлены");
        setEditModal(false);
        fetchServices();
      } catch (err) {
        message.error("Ошибка при обновлении цен");
      }
    } catch (error) {
      message.error("Ошибка при сохранении");
    }
  }

  function calculateMargin(basePrice, cost = 0) {
    if (!basePrice || !cost) return "—";
    const margin = (((basePrice - cost) / cost) * 100).toFixed(1);
    return `${margin}%`;
  }

  function getPriceRange(basePrice, customPricing = []) {
    if (!basePrice) return "—";

    const prices = [basePrice, ...customPricing.map((p) => p.custom_price)];
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    if (min === max) return `₽${basePrice}`;
    return `₽${min} - ₽${max}`;
  }

  const columns = [
    {
      title: "Услуга",
      dataIndex: "name",
      key: "name",
      width: 300,
      render: (name, record) => (
        <div>
          <div className="font-semibold text-gray-900">{name}</div>
          <div className="text-sm text-gray-500">{record.category}</div>
          {record.order_number && (
            <Tag color="blue" size="small" className="mt-1">
              Заказ №{record.order_number}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Базовая цена",
      dataIndex: "price",
      key: "price",
      width: 130,
      render: (price) => (
        <div className="font-semibold text-green-600">
          {price ? `₽${price}` : "—"}
        </div>
      ),
    },
    {
      title: "Наценка",
      key: "margin",
      width: 100,
      render: (_, record) => {
        const cost = 100; // Примерная себестоимость
        const margin = calculateMargin(record.price, cost);
        return (
          <div className="flex items-center">
            <FiTrendingUp className="mr-1 text-blue-500" size={14} />
            <span
              className={
                margin !== "—" ? "text-blue-600 font-medium" : "text-gray-400"
              }
            >
              {margin}
            </span>
          </div>
        );
      },
    },
    {
      title: "Диапазон цен",
      key: "range",
      width: 150,
      render: (_, record) => (
        <div className="text-sm">
          {getPriceRange(record.price, record.custom_pricing)}
        </div>
      ),
    },
    {
      title: "Статистика услуги",
      key: "service_stats",
      width: 180,
      render: (_, record) => {
        const stats = serviceStats[record.id] || {};
        return (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Заработок:</span>
              <span className="text-xs font-medium text-green-600">
                ₽{stats.totalEarnings || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Заказов:</span>
              <span className="text-xs font-medium text-blue-600">
                {stats.completedOrders || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Средняя цена:</span>
              <span className="text-xs font-medium text-purple-600">
                ₽{stats.averagePrice || 0}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Индивидуальные цены",
      key: "custom_pricing",
      width: 280,
      render: (_, record) => {
        const customPricing = record.custom_pricing || [];
        if (customPricing.length === 0) {
          return <span className="text-gray-400 text-sm">Не настроены</span>;
        }

        return (
          <div className="space-y-2">
            {customPricing.slice(0, 3).map((pricing) => {
              const executer = executers.find(
                (e) => e.id === pricing.executer_id
              );
              const earnings = executerEarnings[pricing.executer_id] || {};

              return (
                <div
                  key={pricing.executer_id}
                  className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded border-l-2 border-blue-400"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {executer?.name || `Исполнитель ${pricing.executer_id}`}
                    </div>
                    <div className="text-gray-500 text-xs">
                      💰 ₽{earnings.totalEarnings || 0} | 📋{" "}
                      {earnings.completedOrders || 0} заказов
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      ₽{pricing.custom_price}
                    </div>
                    <div className="text-xs text-gray-400">цена</div>
                  </div>
                </div>
              );
            })}
            {customPricing.length > 3 && (
              <div className="text-xs text-gray-500 text-center p-1 bg-gray-100 rounded">
                +{customPricing.length - 3} исполнителей
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status === "active" ? "АКТИВНА" : "НЕАКТИВНА"}
        </Tag>
      ),
    },
    {
      title: "Действия",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <div className="flex gap-1">
          <Tooltip title="Редактировать индивидуальные цены">
            <Button
              type="primary"
              ghost
              icon={<FiEdit />}
              size="small"
              onClick={() => openPricingModal(record)}
            />
          </Tooltip>
          <Tooltip title="Просмотреть статистику">
            <Button
              type="default"
              ghost
              icon={<FiEye />}
              size="small"
              onClick={() => {
                console.log("Статистика для услуги:", record.name);
                // TODO: Открыть модальное окно со статистикой
              }}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          <FiDollarSign className="inline mr-2" />
          Управление ценообразованием
        </h2>
        <p className="text-gray-600">
          Настройте базовые цены и индивидуальные тарифы для исполнителей
        </p>
      </div>

      <Table
        columns={columns}
        dataSource={services}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
        className="pricing-table"
      />

      {/* Модальное окно настройки цен */}
      <Modal
        title={
          <div className="flex items-center">
            <FaRubleSign className="mr-2 text-green-500" />
            Настройка цен для "{selectedService?.name}"
          </div>
        }
        open={editModal}
        onCancel={() => setEditModal(false)}
        onOk={handleSavePricing}
        okText="Сохранить"
        cancelText="Отмена"
        width={700}
      >
        {selectedService && (
          <div className="space-y-6">
            {/* Базовая цена */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Базовая цена услуги
              </label>
              <Input
                type="number"
                value={selectedService.price}
                onChange={(e) =>
                  setSelectedService({
                    ...selectedService,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                prefix={<FaRubleSign className="text-gray-400" />}
                placeholder="Введите базовую цену"
                size="large"
              />
            </div>

            {/* Индивидуальные цены */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Индивидуальные цены для исполнителей
              </label>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {executers.map((executer) => (
                  <div
                    key={executer.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {executer.name || `Исполнитель ${executer.id}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {executer.telegram_id}
                      </div>
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        value={customPrices[executer.id] || ""}
                        onChange={(e) =>
                          setCustomPrices({
                            ...customPrices,
                            [executer.id]: e.target.value,
                          })
                        }
                        prefix={
                          <FaRubleSign className="text-gray-400" size={12} />
                        }
                        placeholder="Цена"
                        size="small"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                * Оставьте поле пустым для использования базовой цены
              </div>
            </div>
          </div>
        )}
      </Modal>

      <style jsx>{`
        .pricing-table .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 600;
          border: none;
        }
        .pricing-table .ant-table-tbody > tr:hover > td {
          background: #f8faff;
        }
      `}</style>
    </div>
  );
}
