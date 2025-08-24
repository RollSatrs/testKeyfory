import { useState, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import {
  Table,
  Card,
  Button,
  Modal,
  Select,
  Input,
  message,
  DatePicker,
  Statistic,
  Row,
  Col,
  Popconfirm,
  Tabs,
} from "antd";
import {
  FaEdit,
  FaChartLine,
  FaWallet,
  FaTrash,
  FaUser,
  FaClock,
  FaCoins,
} from "react-icons/fa";

const { RangePicker } = DatePicker;

export function ExecuterPricing() {
  const [executers, setExecuters] = useState([]);
  const [services, setServices] = useState([]);
  const [pricingData, setPricingData] = useState([]);
  const [earningsData, setEarningsData] = useState([]);
  const [executerStats, setExecuterStats] = useState([]);
  const [selectedExecuter, setSelectedExecuter] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [activeTab, setActiveTab] = useState("pricing");

  useEffect(() => {
    fetchExecuters();
    fetchServices();
    fetchPricingData();
    fetchEarningsData();
    fetchExecuterStats();
  }, []);

  useEffect(() => {
    if (dateRange.length === 2) {
      fetchEarningsData();
      fetchExecuterStats();
    }
  }, [dateRange]);

  const fetchExecuters = async () => {
    try {
      let data = await apiFetch("/api/admin/executers/get");
      console.log("Полученные исполнители (raw):", data);
      // normalize possible response shapes
      if (!data) data = [];
      if (Array.isArray(data)) {
        setExecuters(data);
      } else if (data.executers && Array.isArray(data.executers)) {
        setExecuters(data.executers);
      } else if (data.data && Array.isArray(data.data)) {
        setExecuters(data.data);
      } else {
        // unknown shape - try to coerce to array
        setExecuters([].concat(data));
      }
    } catch (error) {
      console.error("Ошибка загрузки исполнителей:", error);
      message.error("Ошибка загрузки исполнителей");
    }
  };

  const fetchServices = async () => {
    try {
      const data = await apiFetch("/api/admin/services/get");
      setServices(data);
    } catch (error) {
      console.error("Ошибка загрузки услуг:", error);
    }
  };

  const fetchPricingData = async () => {
    try {
      const data = await apiFetch("/api/admin/pricing/all");
      console.log("Полученные данные ценообразования:", data);
      setPricingData(data || []);
    } catch (error) {
      console.error("Ошибка загрузки ценообразования:", error);
      message.error("Ошибка загрузки данных ценообразования");
      setPricingData([]);
    }
  };

  const fetchEarningsData = async () => {
    try {
      const path =
        dateRange.length === 2
          ? `/api/admin/earnings/all?from=${dateRange[0].format(
              "YYYY-MM-DD"
            )}&to=${dateRange[1].format("YYYY-MM-DD")}`
          : "/api/admin/earnings/all";

      const data = await apiFetch(path);
      setEarningsData(data || []);
    } catch (error) {
      console.error("Ошибка загрузки заработка:", error);
      message.error("Ошибка загрузки данных заработка");
      setEarningsData([]);
    }
  };

  const fetchExecuterStats = async () => {
    try {
      const path =
        dateRange.length === 2
          ? `/api/admin/earnings/summary?from=${dateRange[0].format(
              "YYYY-MM-DD"
            )}&to=${dateRange[1].format("YYYY-MM-DD")}`
          : "/api/admin/earnings/summary";

      const data = await apiFetch(path);
      // API may return { executer_earnings: [...] } or an array directly
      let rows = [];
      if (!data) {
        rows = [];
      } else if (Array.isArray(data)) {
        rows = data;
      } else if (Array.isArray(data.executer_earnings)) {
        rows = data.executer_earnings;
      } else if (Array.isArray(data.executerStats)) {
        rows = data.executerStats;
      } else if (
        data.executer_earnings &&
        typeof data.executer_earnings === "object"
      ) {
        rows = Object.values(data.executer_earnings);
      }

      // Normalize and ensure numeric fields
      rows = (rows || []).map((r) => ({
        executer_id: r.executer_id || r.id || r.executerId,
        executer_name:
          r.executer_name || r.executer_name || r.name || r.executer?.name,
        total_amount:
          r.total_amount || r.total_amount === 0
            ? r.total_amount
            : r.total || 0,
        pending_amount: r.pending_amount || 0,
        paid_amount: r.paid_amount || 0,
        count: r.count || r.orders || 0,
      }));

      setExecuterStats(rows);
    } catch (error) {
      console.error("Ошибка загрузки статистики:", error);
      message.error("Ошибка загрузки статистики исполнителей");
      setExecuterStats([]);
    }
  };

  const handleAddPricing = async () => {
    try {
      if (!form.executer_id || !form.service_id || !form.custom_price) {
        message.error("Заполните все поля");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/admin/pricing/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      message.success("Индивидуальная цена добавлена");
      setShowPricingModal(false);
      setForm({ executer_id: "", service_id: "", custom_price: "" });
      fetchPricingData();
    } catch (error) {
      console.error("Ошибка при добавлении цены:", error);
      message.error("Ошибка при добавлении цены");
    }
  };

  const getExecuterName = (id) => {
    if (!id) return "Неизвестно";
    // match by string to be robust to string/number ids
    const executer = executers.find((e) => String(e.id) === String(id));
    return executer
      ? executer.name || `Исполнитель ${executer.id}`
      : `Исполнитель ${id}`;
  };

  const getServiceName = (id) => {
    const service = services.find((s) => s.id === id);
    return service ? service.name : "Неизвестно";
  };

  const calculateTotalEarnings = () => {
    return earningsData.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const handleDeletePricing = async (id) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/admin/pricing/delete/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      message.success("Индивидуальная цена удалена");
      fetchPricingData();
    } catch (error) {
      console.error("Ошибка при удалении цены:", error);
      message.error("Ошибка при удалении цены");
    }
  };

  const pricingColumns = [
    {
      title: "Исполнитель",
      dataIndex: "executer_name",
      key: "executer_name",
      render: (name, record) => name || getExecuterName(record.executer_id),
    },
    {
      title: "Услуга",
      dataIndex: "service_name",
      key: "service_name",
      render: (name, record) => name || getServiceName(record.service_id),
    },
    {
      title: "Базовая цена",
      dataIndex: "base_price",
      key: "base_price",
      render: (price) => `${price || 0} ₽`,
    },
    {
      title: "Индивидуальная цена",
      dataIndex: "custom_price",
      key: "custom_price",
      render: (price) => `${price || 0} ₽`,
    },
    {
      title: "Дата создания",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) =>
        date ? new Date(date).toLocaleDateString("ru-RU") : "-",
    },
    {
      title: "Действия",
      key: "actions",
      render: (_, record) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            icon={<FaEdit />}
            size="small"
            onClick={() => {
              setForm({
                executer_id: record.executer_id,
                service_id: record.service_id,
                custom_price: record.custom_price,
              });
              setShowPricingModal(true);
            }}
          />
          <Popconfirm
            title="Удалить индивидуальную цену?"
            description="Это действие нельзя отменить"
            onConfirm={() => handleDeletePricing(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button icon={<FaTrash />} size="small" danger />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const earningsColumns = [
    {
      title: "Исполнитель",
      dataIndex: "executer_id",
      key: "executer_id",
      render: (_, record) => {
        // prefer explicit name if API provides it, otherwise try several id shapes
        const name = record.executer_name || record.executer?.name;
        if (name) return name;
        const id =
          record.executer_id || record.executer?.id || record.executerId;
        return getExecuterName(id);
      },
    },
    {
      title: "Услуга",
      dataIndex: "service_id",
      key: "service_id",
      render: (id) => getServiceName(id),
    },
    {
      title: "Сумма",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => `${amount || 0} ₽`,
    },
    {
      title: "Дата",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => new Date(date).toLocaleDateString("ru-RU"),
    },
  ];

  return (
    <div className="p-6">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Общий заработок"
              value={calculateTotalEarnings()}
              suffix="₽"
              prefix={<FaWallet />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Количество исполнителей"
              value={executers.length}
              prefix={<FaUser />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Всего заказов"
              value={earningsData.length}
              prefix={<FaClock />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Активных цен"
              value={pricingData.length}
              prefix={<FaCoins />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "pricing",
              label: "Индивидуальные цены",
              children: (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <p className="text-gray-600">
                      Индивидуальные цены создаются при добавлении услуги.
                      Перейдите в раздел "Цифровые услуги" для настройки
                      ценообразования.
                    </p>
                  </div>
                  <Table
                    columns={pricingColumns}
                    dataSource={pricingData}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                </div>
              ),
            },
            {
              key: "earnings",
              label: "Статистика заработка",
              children: (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <RangePicker
                      onChange={(dates) => {
                        setDateRange(dates || []);
                      }}
                      placeholder={["Дата начала", "Дата окончания"]}
                    />
                  </div>
                  <Table
                    columns={earningsColumns}
                    dataSource={earningsData}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                </div>
              ),
            },
            {
              key: "stats",
              label: "Статистика по исполнителям",
              children: (
                <Table
                  columns={[
                    {
                      title: "Исполнитель",
                      dataIndex: "executer_name",
                      key: "executer_name",
                    },
                    {
                      title: "Общий заработок",
                      dataIndex: "total_amount",
                      key: "total_amount",
                      render: (amount) => `${amount || 0} ₽`,
                      sorter: (a, b) =>
                        (a.total_amount || 0) - (b.total_amount || 0),
                    },
                    // 'К выплате' и 'Выплачено' удалены из таблицы (данные сохраняются на бэкенде)
                    {
                      title: "Количество заказов",
                      dataIndex: "count",
                      key: "count",
                      sorter: (a, b) => (a.count || 0) - (b.count || 0),
                    },
                  ]}
                  dataSource={executerStats}
                  rowKey="executer_id"
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
