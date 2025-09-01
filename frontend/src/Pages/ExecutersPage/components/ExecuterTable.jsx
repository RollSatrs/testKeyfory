import { FaEdit, FaTrash, FaBan } from "react-icons/fa";
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
  Tooltip,
} from "antd";
import { apiFetch } from "../../../lib/api";
import { useNavigate } from "react-router-dom";

export function ExecuterTable({ onChanged, setExecutors, executors, refresh }) {
  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState(false);
  const [form, setForm] = useState({
    id: null,
    name: "",
    telegram_id: "",
    active_services_limit: null,
  });

  // Получение данных из API
  async function fetchExecutors() {
    setLoading(true);
    try {
      const data = await apiFetch("/api/admin/executers/get");

      // Получаем информацию об активных услугах для каждого исполнителя
      const executorsWithActiveServices = await Promise.all(
        (Array.isArray(data) ? data : []).map(async (executor) => {
          try {
            // Получаем количество активных услуг
            const activeServicesData = await apiFetch(
              `/api/admin/active-services/executer/${executor.id}/active/count`
            );

            // Получаем количество активных заказов для логики удаления
            const ordersData = await apiFetch(
              `/api/admin/executers/orders/${executor.id}`
            );
            const activeOrders = (
              Array.isArray(ordersData) ? ordersData : []
            ).filter(
              (order) =>
                order.status === "pending" || order.status === "in_progress"
            ).length;

            return {
              ...executor,
              activeOrders: activeOrders || 0,
              activeServicesCount: activeServicesData?.count || 0,
            };
          } catch (error) {
            // Если 401 — перенаправим на логин
            if (error && error.status === 401) {
              try {
                localStorage.removeItem("admin_token");
              } catch {}
            }
            console.warn(
              `Не удалось получить данные для исполнителя ${executor.id}:`,
              error
            );

            return {
              ...executor,
              activeOrders: 0,
              activeServicesCount: 0,
            };
          }
        })
      );

      setExecutors(executorsWithActiveServices);
    } catch (e) {
      message.error("Ошибка при загрузке исполнителей");
      console.error("Fetch error:", e);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchExecutors();
    // eslint-disable-next-line
  }, [refresh]); // <--- добавьте refresh сюда

  // Вызывать обновление статистики после любого действия
  function notifyChanged() {
    fetchExecutors();
    if (onChanged) onChanged();
  }

  function openEditModal(executor) {
    setForm({
      id: executor.id,
      name: executor.name,
      telegram_id: executor.telegram_id,
      active_services_limit: executor.active_services_limit,
    });
    setEditForm(true);
  }

  function handleChange(name, value) {
    setForm({ ...form, [name]: value });
  }

  async function handleEditSubmit() {
    try {
      await apiFetch(`/api/admin/executers/update/${form.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      message.success("Исполнитель обновлен");
      setEditForm(false);
      setForm({
        id: null,
        name: "",
        telegram_id: "",
      });
      notifyChanged();
    } catch {
      message.error("Ошибка при обновлении исполнителя");
    }
  }

  async function handleDelete(id) {
    try {
      await apiFetch(`/api/admin/executers/delete/${id}`, { method: "DELETE" });
      message.success("Исполнитель удален");
      notifyChanged();
    } catch (error) {
      // apiFetch может возвращать объект error.data
      if (
        error &&
        error.data &&
        error.data.error &&
        error.data.error.includes("active orders")
      ) {
        message.error(
          "Нельзя удалить исполнителя с активными заказами. Сначала завершите или переназначьте заказы."
        );
      } else if (error && error.status === 401) {
        message.error("Нет доступа. Пожалуйста, войдите в систему.");
        try {
          localStorage.removeItem("admin_token");
        } catch {}
      } else {
        message.error("Ошибка при удалении исполнителя");
        console.error("Delete error:", error);
      }
    }
  }

  async function handleBlock(id) {
    try {
      await apiFetch(`/api/admin/executers/update/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "blocked" }),
      });
      message.success("Исполнитель заблокирован");
      notifyChanged();
    } catch {
      message.error("Ошибка при блокировке исполнителя");
    }
  }

  const columns = [
    {
      title: "Имя",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Телеграмм ID",
      dataIndex: "telegram_id",
      key: "telegram_id",
      render: (tg) => <span className="text-blue-600 font-mono">{tg}</span>,
    },
    // rating removed from table
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={
            status === "active"
              ? "green"
              : status === "blocked"
              ? "red"
              : "orange"
          }
        >
          {status === "active"
            ? "АКТИВЕН"
            : status === "blocked"
            ? "ЗАБЛОКИРОВАН"
            : "НЕАКТИВЕН"}
        </Tag>
      ),
    },
    {
      title: "Назначенные услуги",
      key: "services",
      width: 200,
      render: (_, record) => {
        const assignedServices = record.assigned_services || [];

        if (assignedServices.length === 0) {
          return <Tag color="default">Не назначены</Tag>;
        }

        if (assignedServices.length === 1) {
          const service = assignedServices[0];
          return (
            <Tag
              color={service.service_status === "active" ? "green" : "orange"}
            >
              {service.service_name}
            </Tag>
          );
        }

        return (
          <Tooltip
            title={
              <div>
                {assignedServices.map((service, index) => (
                  <div key={index}>
                    • {service.service_name} ({service.service_category})
                  </div>
                ))}
              </div>
            }
          >
            <Tag color="blue">
              {assignedServices.length} услуг
              {assignedServices.length === 1
                ? "а"
                : assignedServices.length < 5
                ? "и"
                : ""}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Ограничения",
      key: "limits",
      width: 120,
      render: (_, record) => {
        const current = record.activeServicesCount || 0;
        const limit = record.active_services_limit;
        const display = limit === null ? `${current}/∞` : `${current}/${limit}`;

        const isNearLimit = limit !== null && current >= limit * 0.8;
        const isAtLimit = limit !== null && current >= limit;

        return (
          <span
            style={{
              color: isAtLimit
                ? "#ff4d4f"
                : isNearLimit
                ? "#faad14"
                : "#52c41a",
              fontWeight: "bold",
            }}
          >
            {display}
          </span>
        );
      },
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
            title={
              record.status === "active" && record.activeOrders > 0
                ? `У активного исполнителя ${record.activeOrders} активных заказов. Деактивируйте исполнителя для удаления!`
                : record.status !== "active"
                ? "Удалить неактивного исполнителя?"
                : "Удалить исполнителя?"
            }
            onConfirm={
              record.status === "active" && record.activeOrders > 0
                ? undefined
                : () => handleDelete(record.id)
            }
            okText={
              record.status === "active" && record.activeOrders > 0
                ? undefined
                : "Да"
            }
            cancelText={
              record.status === "active" && record.activeOrders > 0
                ? "Понятно"
                : "Нет"
            }
            okButtonProps={{
              disabled: record.status === "active" && record.activeOrders > 0,
              style:
                record.status === "active" && record.activeOrders > 0
                  ? { display: "none" }
                  : {},
            }}
          >
            <Button
              icon={<FaTrash />}
              danger
              size="small"
              disabled={record.status === "active" && record.activeOrders > 0}
              title={
                record.status === "active" && record.activeOrders > 0
                  ? "Нельзя удалить активного исполнителя с активными заказами"
                  : "Удалить исполнителя"
              }
            />
          </Popconfirm>
          {record.status !== "blocked" && (
            <Popconfirm
              title="Заблокировать исполнителя?"
              onConfirm={() => handleBlock(record.id)}
              okText="Да"
              cancelText="Нет"
            >
              <Button
                icon={<FaBan />}
                size="small"
                style={{ color: "#e53e3e" }}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <Table
        columns={columns}
        dataSource={executors}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        bordered
        loading={loading}
      />
      <Modal
        open={editForm}
        title="Редактировать исполнителя"
        onCancel={() => {
          setEditForm(false);
          setForm({
            id: null,
            name: "",
            telegram_id: "",
            active_services_limit: null,
          });
        }}
        onOk={handleEditSubmit}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Input
          name="name"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Имя исполнителя"
          style={{ marginBottom: 16 }}
        />
        <Input
          name="telegram_id"
          value={form.telegram_id}
          onChange={(e) => handleChange("telegram_id", e.target.value)}
          placeholder="Telegram ID"
          style={{ marginBottom: 16 }}
        />
        <Input
          name="active_services_limit"
          type="number"
          min="0"
          value={form.active_services_limit || ""}
          onChange={(e) =>
            handleChange(
              "active_services_limit",
              e.target.value ? parseInt(e.target.value) : null
            )
          }
          placeholder="Лимит активных услуг (пусто = без ограничений)"
          style={{ marginBottom: 16 }}
          addonAfter="услуг"
        />
        {/* orders input removed */}
        {/* rating removed */}
      </Modal>
    </div>
  );
}
