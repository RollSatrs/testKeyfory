import { FaEdit, FaTrash, FaBan, FaCheck, FaSyncAlt } from "react-icons/fa";
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
      console.log(
        `👥 Запрашиваем данные исполнителей... (время: ${new Date().toLocaleTimeString()})`
      );
      const data = await apiFetch("/api/admin/executers/get");
      console.log(
        `👥 Получены данные исполнителей:`,
        data?.length || 0,
        "записей"
      );

      // 🔍 ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ НАЗНАЧЕННЫХ УСЛУГ
      if (Array.isArray(data)) {
        data.forEach((executor) => {
          console.log(
            `👤 Исполнитель ${executor.id} (${executor.name}): статус = ${
              executor.status
            }, назначенных услуг = ${executor.assigned_services?.length || 0}`
          );

          // Логируем все назначенные услуги для отладки
          if (
            executor.assigned_services &&
            executor.assigned_services.length > 0
          ) {
            executor.assigned_services.forEach((service, index) => {
              console.log(
                `  📋 Услуга ${index + 1}: ID=${
                  service.service_id
                }, Название="${service.service_name}"`
              );
            });
          } else {
            console.log(`  📭 У исполнителя нет назначенных услуг`);
          }
        });
      }

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

            const result = {
              ...executor,
              activeOrders: activeOrders || 0,
              activeServicesCount: activeServicesData?.count || 0,
            };

            console.log(
              `👤 Исполнитель ${executor.id}: статус=${executor.status}, активных заказов=${activeOrders}`
            );

            return result;
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

      console.log(
        `✅ Обработано ${executorsWithActiveServices.length} исполнителей`
      );

      // Логируем финальные статусы
      executorsWithActiveServices.forEach((executor) => {
        console.log(
          `📋 ФИНАЛЬНЫЕ ДАННЫЕ - Исполнитель ${executor.id} (${executor.name}): статус = ${executor.status}, активных заказов = ${executor.activeOrders}`
        );
      });

      setExecutors(executorsWithActiveServices);
    } catch (e) {
      message.error("Ошибка при загрузке исполнителей");
      console.error("Fetch error:", e);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchExecutors();

    // 🔄 ПРИНУДИТЕЛЬНОЕ ПЕРИОДИЧЕСКОЕ ОБНОВЛЕНИЕ ДАННЫХ
    // Обновляем данные каждые 10 секунд для синхронизации с изменениями от бота
    const autoRefreshInterval = setInterval(() => {
      console.log(
        `🔄 Автоматическое обновление данных исполнителей (${new Date().toLocaleTimeString()})`
      );
      fetchExecutors();
    }, 10000); // 10 секунд

    // Очищаем интервал при размонтировании компонента
    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        console.log("🛑 Автоматическое обновление данных остановлено");
      }
    };
    // eslint-disable-next-line
  }, [refresh]); // <--- добавьте refresh сюда

  // Вызывать обновление статистики после любого действия
  function notifyChanged() {
    console.log(
      `🔄 notifyChanged() вызвана в ${new Date().toLocaleTimeString()}`
    );
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
      console.log(`🚫 Блокируем исполнителя с ID: ${id}`);

      const response = await apiFetch(`/api/admin/executers/update/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "blocked" }),
      });

      console.log(`✅ Ответ от API:`, response);
      message.success("Исполнитель заблокирован");

      // Принудительно обновляем данные с задержкой
      setTimeout(() => {
        console.log(`🔄 Обновляем данные после блокировки исполнителя ${id}`);
        notifyChanged();
      }, 500);

      // Также обновляем сразу
      notifyChanged();
    } catch (error) {
      console.error(`❌ Ошибка блокировки исполнителя ${id}:`, error);
      message.error("Ошибка при блокировке исполнителя");
    }
  }

  async function handleUnblock(id) {
    try {
      console.log(`✅ Разблокируем исполнителя с ID: ${id}`);

      const response = await apiFetch(`/api/admin/executers/update/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "active" }), // Разблокированные исполнители становятся активными
      });

      console.log(`✅ Ответ от API (разблокировка):`, response);
      message.success("Исполнитель разблокирован и активирован");

      // Принудительно обновляем данные с задержкой
      setTimeout(() => {
        console.log(
          `🔄 Обновляем данные после разблокировки исполнителя ${id}`
        );
        notifyChanged();
      }, 500);

      // Также обновляем сразу
      notifyChanged();
    } catch (error) {
      console.error(`❌ Ошибка разблокировки исполнителя ${id}:`, error);
      message.error("Ошибка при разблокировке исполнителя");
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
      render: (status, record) => {
        console.log(
          `🏷️ Рендерим статус для исполнителя ${record.id}: status=${status}, is_bot_active=${record.is_bot_active}`
        );

        // Определяем статус на основе реальной активности в боте
        let statusText, color;

        if (status === "blocked") {
          statusText = "● ЗАБЛОКИРОВАН";
          color = "red";
        } else if (record.is_bot_active === true) {
          statusText = "● ОНЛАЙН";
          color = "green";
        } else {
          statusText = "● ОФЛАЙН";
          color = "orange";
        }

        return <Tag color={color}>{statusText}</Tag>;
      },
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
      render: (_, record) => {
        console.log(
          `🎯 Рендерим действия для исполнителя ${record.id} со статусом: ${record.status}`
        );
        return (
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
            {(() => {
              const isBlocked = record.status === "blocked";
              console.log(
                `🔒 Исполнитель ${record.id}: isBlocked = ${isBlocked}, статус = ${record.status}`
              );

              if (isBlocked) {
                console.log(
                  `🟢 Показываем кнопку РАЗБЛОКИРОВАТЬ для исполнителя ${record.id}`
                );
                return (
                  <Popconfirm
                    title="Разблокировать исполнителя?"
                    onConfirm={() => handleUnblock(record.id)}
                    okText="Да"
                    cancelText="Нет"
                  >
                    <Button
                      icon={<FaCheck />}
                      size="small"
                      style={{ color: "#52c41a" }}
                      title="Разблокировать исполнителя"
                    />
                  </Popconfirm>
                );
              } else {
                console.log(
                  `🚫 Показываем кнопку ЗАБЛОКИРОВАТЬ для исполнителя ${record.id}`
                );
                return (
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
                      title="Заблокировать исполнителя"
                    />
                  </Popconfirm>
                );
              }
            })()}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Исполнители ({executors.length})
        </h3>
        <Button
          icon={<FaSyncAlt />}
          onClick={() => {
            console.log("🔄 Принудительное обновление данных исполнителей");
            fetchExecutors();
          }}
          loading={loading}
          size="small"
          type="primary"
          title="Обновить данные исполнителей"
        >
          Обновить
        </Button>
      </div>

      {(() => {
        console.log(`🗂️ Рендерим таблицу с ${executors.length} исполнителями:`);
        executors.forEach((executor, index) => {
          console.log(
            `  ${index + 1}. ID: ${executor.id}, Имя: ${
              executor.name
            }, Статус: ${executor.status}, Услуг: ${
              executor.assigned_services?.length || 0
            }`
          );
        });
        return null;
      })()}
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
