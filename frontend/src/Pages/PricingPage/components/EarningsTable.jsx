import { useState, useEffect } from "react";
import {
  Table,
  Card,
  DatePicker,
  Select,
  Spin,
  Tag,
  Space,
  Button,
} from "antd";
import { apiFetch } from "../../../lib/api";
import { FaTable, FaRubleSign, FaUser, FaCog } from "react-icons/fa";

const { RangePicker } = DatePicker;
const { Option } = Select;

export function EarningsTable() {
  const [earningsData, setEarningsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([]);
  const [executerFilter, setExecuterFilter] = useState(null);
  const [serviceFilter, setServiceFilter] = useState(null);
  const [executersList, setExecutersList] = useState([]);
  const [servicesList, setServicesList] = useState([]);

  useEffect(() => {
    fetchEarningsData();
    fetchFiltersData();
  }, [dateRange, executerFilter, serviceFilter]);

  async function fetchEarningsData() {
    setLoading(true);
    try {
      let queryParams = new URLSearchParams();

      if (dateRange.length === 2) {
        queryParams.append("from", dateRange[0].format("YYYY-MM-DD"));
        queryParams.append("to", dateRange[1].format("YYYY-MM-DD"));
      }

      if (executerFilter) {
        queryParams.append("executer_id", executerFilter);
      }

      if (serviceFilter) {
        queryParams.append("service_id", serviceFilter);
      }

      const queryString = queryParams.toString();
      const path = `/api/admin/pricing/earnings-details${
        queryString ? `?${queryString}` : ""
      }`;

      const data = await apiFetch(path);
      setEarningsData(data || []);
    } catch (error) {
      console.error("Ошибка загрузки данных заработков:", error);
      setEarningsData([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFiltersData() {
    try {
      // Получаем список исполнителей
      const executersResponse = await apiFetch("/api/admin/executers/get");
      setExecutersList(executersResponse || []);

      // Получаем список услуг
      const servicesResponse = await apiFetch("/api/admin/services/get");
      setServicesList(servicesResponse || []);
    } catch (error) {
      console.error("Ошибка загрузки данных для фильтров:", error);
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Не указано";
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "green";
      case "pending":
        return "orange";
      default:
        return "blue";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "paid":
        return "Выплачено";
      case "pending":
        return "Ожидает";
      default:
        return "Неизвестно";
    }
  };

  const columns = [
    {
      title: "Исполнитель",
      dataIndex: "executer_name",
      key: "executer_name",
      width: 200,
      render: (text, record) => (
        <Space>
          <FaUser className="text-blue-500" />
          <span className="font-medium">{text}</span>
        </Space>
      ),
    },
    {
      title: "Услуга",
      dataIndex: "service_name",
      key: "service_name",
      width: 250,
      render: (text) => (
        <Space>
          <FaCog className="text-green-500" />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: "Сумма",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (amount) => (
        <Space>
          <FaRubleSign className="text-yellow-600" />
          <span className="font-bold text-green-600">
            {formatCurrency(amount)}
          </span>
        </Space>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Дата",
      dataIndex: "date",
      key: "date",
      width: 150,
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: "Заказ №",
      dataIndex: "order_id",
      key: "order_id",
      width: 100,
      render: (orderId) => <span className="text-gray-600">#{orderId}</span>,
    },
  ];

  const totalAmount = earningsData.reduce(
    (sum, item) => sum + (item.amount || 0),
    0
  );

  return (
    <Card className="earnings-table-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FaTable className="text-2xl text-purple-500 mr-3" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Детальная таблица заработков
            </h3>
            <p className="text-sm text-gray-600">
              Подробная информация по всем выплатам исполнителям
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select
            placeholder="Исполнитель"
            value={executerFilter}
            onChange={setExecuterFilter}
            allowClear
            style={{ width: 150 }}
            size="small"
          >
            {executersList.map((executer) => (
              <Option key={executer.id} value={executer.id}>
                {executer.name}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="Услуга"
            value={serviceFilter}
            onChange={setServiceFilter}
            allowClear
            style={{ width: 150 }}
            size="small"
          >
            {servicesList.map((service) => (
              <Option key={service.id} value={service.id}>
                {service.name}
              </Option>
            ))}
          </Select>

          <RangePicker
            size="small"
            onChange={(dates) => setDateRange(dates || [])}
            placeholder={["От", "До"]}
            format="DD.MM.YYYY"
          />
        </div>
      </div>

      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">
            Показано записей: <strong>{earningsData.length}</strong>
          </span>
          <span className="text-lg font-bold text-green-600">
            Общая сумма: {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={earningsData}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} из ${total} записей`,
          }}
          size="middle"
          scroll={{ x: 1000 }}
          className="earnings-table"
        />
      )}

      <style jsx>{`
        .earnings-table-card {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border: none;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .earnings-table .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 600;
          border: none;
        }

        .earnings-table .ant-table-tbody > tr:hover > td {
          background-color: rgba(102, 126, 234, 0.1);
        }

        .earnings-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f0f0f0;
        }
      `}</style>
    </Card>
  );
}
