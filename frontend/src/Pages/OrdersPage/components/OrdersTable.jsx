import { FaEdit, FaTrash } from "react-icons/fa";
import { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Modal,
  Input,
  Select,
  Space,
  Popconfirm,
  message,
} from "antd";
import { CSVLink } from "react-csv";
import { DownloadOutlined } from "@ant-design/icons";
import { BACKEND_URL } from "../../../lib/backendUrl";

export function OrdersTable({
  refresh,
  onChange,
  search = "",
  statusFilter = "",
  serviceFilter = "",
}) {
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [executors, setExecutors] = useState([]);
  const [editForm, setEditForm] = useState(false);
  const [form, setForm] = useState({
    id: null,
    service_id: "",
    executer_id: "",
    status: "",
    payment_status: "",
  });

  useEffect(() => {
    fetchOrders();
    fetchServices();
    fetchExecutors();
  }, [refresh]);

  async function fetchOrders() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/orders/get`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Ошибка загрузки заказов:", error);
    }
  }

  async function fetchServices() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/services/get`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });
      const data = await res.json();
      setServices(data);
    } catch (error) {
      console.error("Ошибка загрузки услуг:", error);
    }
  }

  async function fetchExecutors() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/executers/get`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });
      const data = await res.json();
      setExecutors(data);
    } catch (error) {
      console.error("Ошибка загрузки исполнителей:", error);
    }
  }

  async function handleDelete(id) {
    try {
      await fetch(`${BACKEND_URL}/api/admin/orders/delete/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });
      fetchOrders();
      if (onChange) onChange();
      message.success("Заказ удален");
    } catch (error) {
      message.error("Ошибка при удалении заказа");
    }
  }

  function openEditModal(order) {
    setForm({
      id: order.id,
      service_id: order.service_id,
      executer_id: order.executer_id,
      status: order.status,
      payment_status: order.payment_status,
    });
    setEditForm(true);
  }

  function handleChange(name, value) {
    setForm({ ...form, [name]: value });
  }

  async function handleEditSubmit() {
    try {
      await fetch(`${BACKEND_URL}/api/admin/orders/update/${form.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify({
          service_id: form.service_id,
          executer_id: form.executer_id,
          status: form.status,
          payment_status: form.payment_status,
        }),
      });
      setEditForm(false);
      fetchOrders();
      if (onChange) onChange();
      message.success("Заказ обновлен");
    } catch (error) {
      message.error("Ошибка при обновлении заказа");
    }
  }

  // Фильтрация перед отображением
  const filteredOrders = orders.filter(
    (order) =>
      (order.id?.toString().toLowerCase().includes(search.toLowerCase()) ||
        getServiceName(order.service_id)
          ?.toLowerCase()
          .includes(search.toLowerCase())) &&
      (statusFilter ? order.status === statusFilter : true) &&
      (serviceFilter ? order.service_id === parseInt(serviceFilter) : true)
  );
  console.log("weweweqe", filteredOrders);
  const getServiceName = (serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    return service ? service.name : "Неизвестная услуга";
  };

  const getExecutorName = (executorId) => {
    const executor = executors.find((e) => e.id === executorId);
    return executor ? executor.name : "Не назначен";
  };

  const headers = [
    { label: "ID заказа", key: "id" },
    { label: "Услуга", key: "service_name" },
    { label: "Исполнитель", key: "executor_name" },
    { label: "Сумма", key: "total_sum" },
    { label: "Статус заказа", key: "status" },
    { label: "Статус оплаты", key: "payment_status" },
    { label: "Дата создания", key: "created_at" },
  ];

  // Преобразуем данные для экспорта
  const exportData = filteredOrders.map((order) => ({
    ...order,
    service_name: getServiceName(order.service_id),
    executor_name: order.Executer
      ? `${order.Executer.name} (${order.Executer.telegram_id})`
      : getExecutorName(order.executer_id),
  }));

  const columns = [
    {
      title: "ID заказа",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Услуга",
      dataIndex: "service_id",
      key: "service_id",
      render: (serviceId) => getServiceName(serviceId),
    },
    {
      title: "Исполнитель",
      dataIndex: "executer_id",
      key: "executer_id",
      render: (executerId, record) => {
        if (record.Executer) {
          return `${record.Executer.name} (${record.Executer.telegram_id})`;
        }
        return getExecutorName(executerId);
      },
    },
    {
      title: "Сумма",
      dataIndex: "total_sum",
      key: "total_sum",
      render: (sum) => `₽${sum || 0}`,
    },
    {
      title: "Статус заказа",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={
            status === "completed"
              ? "green"
              : status === "in_progress"
              ? "blue"
              : status === "pending"
              ? "orange"
              : status === "cancelled"
              ? "red"
              : "default"
          }
        >
          {status === "completed"
            ? "ЗАВЕРШЕН"
            : status === "in_progress"
            ? "ВЫПОЛНЯЕТСЯ"
            : status === "pending"
            ? "ОЖИДАЕТ"
            : status === "cancelled"
            ? "ОТМЕНЕН"
            : status}
        </Tag>
      ),
    },
    {
      title: "Статус оплаты",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (paymentStatus) => (
        <Tag
          color={
            paymentStatus === "paid"
              ? "green"
              : paymentStatus === "pending"
              ? "orange"
              : paymentStatus === "failed"
              ? "red"
              : "default"
          }
        >
          {paymentStatus === "paid"
            ? "ОПЛАЧЕН"
            : paymentStatus === "pending"
            ? "ОЖИДАЕТ ОПЛАТЫ"
            : paymentStatus === "failed"
            ? "ОШИБКА ОПЛАТЫ"
            : paymentStatus}
        </Tag>
      ),
    },
    {
      title: "Дата создания",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => new Date(date).toLocaleString("ru-RU"),
    },
    {
      title: "Действия",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<FaEdit />}
            onClick={() => openEditModal(record)}
            size="small"
          />
          <Popconfirm
            title="Удалить заказ?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button icon={<FaTrash />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "1.6rem",
              fontWeight: 700,
              color: "#1e293b",
              marginBottom: 2,
              letterSpacing: "0.5px",
            }}
          >
            📋 Список заказов
          </h2>
          <div
            style={{
              color: "#64748b",
              fontSize: "1rem",
              fontWeight: 400,
              marginTop: 2,
            }}
          >
            Здесь отображаются все заказы в системе.
            <br />
            Вы можете{" "}
            <span style={{ color: "#06b6d4", fontWeight: 500 }}>
              экспортировать
            </span>{" "}
            данные, а также редактировать и удалять записи.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <CSVLink
            headers={headers}
            data={exportData}
            filename="orders_export.csv"
            separator=";"
            style={{ textDecoration: "none" }}
          >
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              style={{
                background: "linear-gradient(to right, #3b82f6, #06b6d4)",
                border: "none",
                color: "#fff",
                fontWeight: 500,
                boxShadow: "0 2px 8px 0 rgba(59,130,246,0.15)",
              }}
            >
              Экспорт данных
            </Button>
          </CSVLink>
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={filteredOrders}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        bordered
        style={{ marginTop: 8 }}
      />
      <Modal
        open={editForm}
        title="Редактировать заказ"
        onCancel={() => setEditForm(false)}
        onOk={handleEditSubmit}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Select
          name="service_id"
          value={form.service_id || undefined}
          onChange={(value) => handleChange("service_id", value)}
          placeholder="Выберите услугу"
          className="w-full"
          style={{ marginBottom: 16 }}
        >
          {services.map((service) => (
            <Select.Option key={service.id} value={service.id}>
              {service.name}
            </Select.Option>
          ))}
        </Select>

        <Select
          name="executer_id"
          value={form.executer_id || undefined}
          onChange={(value) => handleChange("executer_id", value)}
          placeholder="Выберите исполнителя"
          className="w-full"
          style={{ marginBottom: 16 }}
        >
          {executors.map((executor) => (
            <Select.Option key={executor.id} value={executor.id}>
              {executor.name}
            </Select.Option>
          ))}
        </Select>

        <Select
          name="status"
          value={form.status || undefined}
          onChange={(value) => handleChange("status", value)}
          placeholder="Статус заказа"
          className="w-full"
          style={{ marginBottom: 16 }}
        >
          <Select.Option value="pending">ОЖИДАЕТ</Select.Option>
          <Select.Option value="in_progress">ВЫПОЛНЯЕТСЯ</Select.Option>
          <Select.Option value="completed">ЗАВЕРШЕН</Select.Option>
          <Select.Option value="cancelled">ОТМЕНЕН</Select.Option>
        </Select>

        <Select
          name="payment_status"
          value={form.payment_status || undefined}
          onChange={(value) => handleChange("payment_status", value)}
          placeholder="Статус оплаты"
          className="w-full"
          style={{ marginBottom: 8 }}
        >
          <Select.Option value="pending">ОЖИДАЕТ ОПЛАТЫ</Select.Option>
          <Select.Option value="paid">ОПЛАЧЕН</Select.Option>
          <Select.Option value="failed">ОШИБКА ОПЛАТЫ</Select.Option>
        </Select>
      </Modal>
    </div>
  );
}
