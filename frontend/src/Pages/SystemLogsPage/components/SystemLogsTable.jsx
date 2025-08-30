import { useState, useEffect } from "react";
import { Table, Tag, Button, message, Select, Input } from "antd";
import { apiFetch } from "../../../lib/api";

const actionTypes = {
  login: "Вход в систему",
  logout: "Выход из системы",
  view_orders: "Просмотр заказов",
  create_order: "Создание заказа",
  update_order: "Обновление заказа",
  view_materials: "Просмотр материалов",
  use_material: "Использование материала",
  request_replacement: "Запрос замены",
  bot_start: "Запуск бота",
  bot_menu_main: "Главное меню",
  bot_menu_orders: "Меню заказов",
  bot_menu_materials: "Меню материалов",
  bot_button_click: "Нажатие кнопки",
  bot_navigation: "Навигация в боте",
  bot_view_order_details: "Просмотр деталей заказа",
  bot_accept_order: "Принятие заказа",
  bot_complete_order: "Завершение заказа",
};

const getActionName = (action) => actionTypes[action] || action;

const levelColors = {
  INFO: "blue",
  SUCCESS: "green",
  WARNING: "orange",
  ERROR: "red",
};

export function SystemLogsTable() {
  const [logs, setLogs] = useState([]);
  const [executors, setExecutors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    user_type: "",
    action: "",
    executor_id: "",
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Загрузка исполнителей для фильтра
  useEffect(() => {
    async function fetchExecutors() {
      try {
        console.log("👥 [DEBUG] Загружаем исполнителей...");
        const data = await apiFetch("/api/admin/executers/get");
        console.log("👥 [DEBUG] Ответ API исполнителей:", data);
        setExecutors(Array.isArray(data) ? data : []);
        console.log(
          "👥 [DEBUG] Исполнители установлены:",
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error("❌ [DEBUG] Ошибка загрузки исполнителей:", error);
      }
    }
    fetchExecutors();
  }, []);

  // Загрузка логов
  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.current, pagination.pageSize]);

  async function fetchLogs() {
    setLoading(true);
    console.log("🚀 [DEBUG] Начинаем загрузку логов...");
    try {
      const params = new URLSearchParams({
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== "")
        ),
      });

      console.log("📋 [DEBUG] Параметры запроса:", Object.fromEntries(params));
      const response = await apiFetch(`/api/admin/executers/logs?${params}`);
      console.log("📥 [DEBUG] Ответ от API:", response);

      const data = response.rows || [];
      const total = response.count || 0;

      console.log("📊 [DEBUG] Обработанные данные:", {
        data,
        total,
        dataLength: data.length,
      });
      setLogs(data);
      setPagination((prev) => ({ ...prev, total }));
    } catch (error) {
      message.error("Ошибка загрузки логов");
      console.error("❌ [DEBUG] Ошибка загрузки логов:", error);
    } finally {
      setLoading(false);
      console.log("✅ [DEBUG] Загрузка логов завершена");
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const columns = [
    {
      title: "Дата и время",
      dataIndex: "created_at",
      key: "created_at",
      width: 150,
      render: (date) => new Date(date).toLocaleString("ru-RU"),
    },
    {
      title: "Исполнитель",
      key: "user",
      width: 200,
      render: (_, record) => {
        console.log("🔍 [DEBUG] Запись лога:", record);

        if (record.user_type === "admin") {
          return "Админ";
        }

        // Для исполнителей - всегда пытаемся показать информацию
        let executerName = "Неизвестно";
        let telegramId = null;

        // Сначала пробуем взять из связанной таблицы Executer
        if (record.Executer) {
          executerName = record.Executer.name || "Без имени";
          telegramId = record.Executer.telegram_id;
          console.log("✅ Найден через Executer связь:", {
            executerName,
            telegramId,
          });
        }
        // Если нет связи, но есть telegram_id в логе, найдем исполнителя по нему
        else if (record.telegram_id) {
          telegramId = record.telegram_id;
          console.log("🔍 Ищем исполнителя по telegram_id:", telegramId);
          console.log("📋 Доступные исполнители:", executors);

          // Ищем исполнителя в списке executors по telegram_id
          const foundExecutor = executors.find(
            (exec) => exec.telegram_id == record.telegram_id
          );

          console.log("🔍 Найденный исполнитель:", foundExecutor);

          if (foundExecutor) {
            executerName = foundExecutor.name || "Без имени";
            console.log("✅ Найден через поиск:", { executerName, telegramId });
          } else {
            executerName = "Исполнитель не найден";
            console.log(
              "❌ Не найден исполнитель для telegram_id:",
              telegramId
            );
          }
        }

        const result = telegramId
          ? `${executerName} (${telegramId})`
          : executerName;
        console.log("📊 Результат отображения:", result);
        return result;
      },
    },
    {
      title: "Действие",
      dataIndex: "action",
      key: "action",
      render: (action) => getActionName(action),
    },
    {
      title: "Описание",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
  ];
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="font-semibold mb-4">Журнал событий</div>

      {/* Фильтры */}
      <div className="mb-4 flex gap-4 flex-wrap">
        <Select
          style={{ width: 200 }}
          placeholder="Тип пользователя"
          allowClear
          value={filters.user_type}
          onChange={(value) => handleFilterChange("user_type", value)}
          options={[
            { value: "admin", label: "Админ" },
            { value: "executer", label: "Исполнитель" },
          ]}
        />

        <Select
          style={{ width: 200 }}
          placeholder="Исполнитель"
          allowClear
          value={filters.executor_id}
          onChange={(value) => handleFilterChange("executor_id", value)}
          options={executors.map((executor) => ({
            value: executor.id,
            label: `${executor.name || "Без имени"} (${executor.telegram_id})`,
          }))}
          disabled={filters.user_type === "admin"}
        />

        <Select
          style={{ width: 200 }}
          placeholder="Действие"
          allowClear
          value={filters.action}
          onChange={(value) => handleFilterChange("action", value)}
          options={Object.entries(actionTypes).map(([key, value]) => ({
            value: key,
            label: value,
          }))}
        />
      </div>

      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} из ${total} записей`,
          onChange: (page, pageSize) => {
            setPagination((prev) => ({
              ...prev,
              current: page,
              pageSize,
            }));
          },
        }}
      />
    </div>
  );
}
