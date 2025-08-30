import { useState, useEffect } from "react";
import {
  FaSearch,
  FaFilter,
  FaDownload,
  FaEye,
  FaUser,
  FaCog,
} from "react-icons/fa";
import { apiFetch } from "../../lib/api";

export function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [executors, setExecutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    executor_id: "",
    action: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
  });

  // Загрузка исполнителей
  useEffect(() => {
    async function fetchExecutors() {
      try {
        console.log("👥 [DEBUG] Загружаем исполнителей...");
        const data = await apiFetch("/api/admin/executers/get");
        console.log("👥 [DEBUG] Ответ API исполнителей:", data);
        setExecutors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("❌ [DEBUG] Ошибка загрузки исполнителей:", error);
      }
    }
    fetchExecutors();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
        ...(filters.executor_id && { executor_id: filters.executor_id }),
        ...(filters.action && { action: filters.action }),
      });

      const data = await apiFetch(`/api/admin/executers/logs?${params}`);

      setLogs(data.rows || []);
      setPagination((prev) => ({ ...prev, total: data.count || 0 }));
    } catch (error) {
      console.error("Ошибка загрузки логов:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams({
        limit: 5000, // Увеличиваем лимит для экспорта
        offset: 0,
        ...(filters.executor_id && { executor_id: filters.executor_id }),
        ...(filters.action && { action: filters.action }),
      });

      const data = await apiFetch(`/api/admin/executers/logs?${params}`);

      // Функция для определения исполнителя (такая же логика как в таблице)
      const getExecutorInfo = (log) => {
        if (log.user_type === "admin") {
          return "Админ";
        } else if (log.Executer) {
          const name = log.Executer.name || "Без имени";
          const tgId = log.Executer.telegram_id;
          return `${name} (${tgId})`;
        } else if (log.telegram_id) {
          // Ищем исполнителя в списке по telegram_id
          const foundExecutor = executors.find(
            (exec) => exec.telegram_id == log.telegram_id
          );

          if (foundExecutor) {
            const name = foundExecutor.name || "Без имени";
            return `${name} (${log.telegram_id})`;
          } else {
            return `Исполнитель (${log.telegram_id})`;
          }
        }
        return "Неизвестно";
      };

      // Создаем CSV с правильной структурой (4 колонки как в таблице)
      const csvContent = [
        ["Дата и время", "Исполнитель", "Действие", "Описание"],
        ...data.rows
          .filter(
            (log) =>
              !filters.search ||
              log.description
                .toLowerCase()
                .includes(filters.search.toLowerCase())
          )
          .map((log) => [
            new Date(log.created_at).toLocaleString(),
            getExecutorInfo(log),
            getActionText(log.action),
            log.description || "",
          ]),
      ]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

      // Добавляем BOM для правильного отображения русских символов
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `system_logs_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      link.click();

      // Очищаем URL после загрузки
      setTimeout(() => {
        URL.revokeObjectURL(link.href);
      }, 1000);
    } catch (error) {
      console.error("Ошибка экспорта логов:", error);
      alert("Ошибка при экспорте данных. Проверьте консоль для деталей.");
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "login":
        return <FaUser className="text-green-600" />;
      case "complete_order":
        return <FaEye className="text-blue-600" />;
      case "request_replacement":
        return <FaCog className="text-orange-600" />;
      default:
        return <FaCog className="text-gray-600" />;
    }
  };

  const getActionText = (action) => {
    const actions = {
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
      view_order: "Просмотр заказа",
      get_materials: "Получение материалов",
      complete_order: "Завершение заказа",
      update_rights: "Обновление прав",
      start_service_execution: "Начало выполнения услуги",
      view_available_services: "Просмотр доступных услуг",
      menu_navigation: "Навигация по меню",
    };
    return actions[action] || action;
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Системные логи
        </h1>
        <p className="text-gray-600">
          Просмотр всех действий пользователей в системе
        </p>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Исполнитель
            </label>
            <select
              value={filters.executor_id}
              onChange={(e) =>
                handleFilterChange("executor_id", e.target.value)
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все исполнители</option>
              {executors.map((executor) => (
                <option key={executor.id} value={executor.id}>
                  {executor.name || "Без имени"} ({executor.telegram_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Действие
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все действия</option>
              <option value="login">Вход в систему</option>
              <option value="bot_start">Запуск бота</option>
              <option value="bot_navigation">Навигация в боте</option>
              <option value="bot_button_click">Нажатие кнопки</option>
              <option value="start_service_execution">
                Начало выполнения услуги
              </option>
              <option value="complete_order">Завершение заказа</option>
              <option value="request_replacement">Запрос замены</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Поиск
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по описанию..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={exportLogs}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <FaDownload />
              Экспорт CSV
            </button>
          </div>
        </div>
      </div>

      {/* Таблица логов */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата и время
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Исполнитель
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действие
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Описание
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Логи не найдены
                  </td>
                </tr>
              ) : (
                logs
                  .filter(
                    (log) =>
                      !filters.search ||
                      log.description
                        .toLowerCase()
                        .includes(filters.search.toLowerCase())
                  )
                  .map((log) => {
                    console.log("🔍 [DEBUG] Обрабатываем лог:", log);

                    // Определяем исполнителя
                    let executerInfo = "Неизвестно";

                    if (log.user_type === "admin") {
                      executerInfo = "Админ";
                    } else if (log.Executer) {
                      const name = log.Executer.name || "Без имени";
                      const tgId = log.Executer.telegram_id;
                      executerInfo = `${name} (${tgId})`;
                      console.log(
                        "✅ [DEBUG] Найден через Executer связь:",
                        executerInfo
                      );
                    } else if (log.telegram_id) {
                      // Ищем исполнителя в списке по telegram_id
                      const foundExecutor = executors.find(
                        (exec) => exec.telegram_id == log.telegram_id
                      );

                      if (foundExecutor) {
                        const name = foundExecutor.name || "Без имени";
                        executerInfo = `${name} (${log.telegram_id})`;
                        console.log(
                          "✅ [DEBUG] Найден через поиск:",
                          executerInfo
                        );
                      } else {
                        executerInfo = `Исполнитель (${log.telegram_id})`;
                        console.log(
                          "⚠️ [DEBUG] Не найден исполнитель для telegram_id:",
                          log.telegram_id
                        );
                        console.log(
                          "📋 [DEBUG] Доступные исполнители:",
                          executors
                        );
                      }
                    }

                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {executerInfo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className="text-sm font-medium">
                              {getActionText(log.action)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {log.description}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Показано {(pagination.page - 1) * pagination.limit + 1} -{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              из {pagination.total} записей
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Предыдущая
              </button>
              <span className="px-3 py-1">
                Страница {pagination.page} из {totalPages}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Следующая
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
