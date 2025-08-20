import { useState, useEffect } from "react";
import {
  FaUserCheck,
  FaUserTimes,
  FaCog,
  FaSave,
  FaEdit,
} from "react-icons/fa";
import { apiFetch } from "../../../lib/api";

export function ExecutorsRights() {
  const [executors, setExecutors] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedExecutor, setSelectedExecutor] = useState(null);
  const [accessRights, setAccessRights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Загрузка исполнителей
  useEffect(() => {
    fetchExecutors();
    fetchServices();
  }, []);

  const fetchExecutors = async () => {
    try {
      const data = await apiFetch("/api/admin/executers/get");
      setExecutors(data);
    } catch (error) {
      console.error("Ошибка загрузки исполнителей:", error);
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

  const fetchExecutorRights = async (executorId) => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/admin/executer-rights/${executorId}`);
      setAccessRights(data);
    } catch (error) {
      console.error("Ошибка загрузки прав:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecutorSelect = (executor) => {
    setSelectedExecutor(executor);
    fetchExecutorRights(executor.id);
  };

  const updateAccessRight = (serviceId, field, value) => {
    setAccessRights((prev) =>
      prev.map((right) =>
        right.service_id === serviceId ? { ...right, [field]: value } : right
      )
    );
  };

  const saveRights = async () => {
    if (!selectedExecutor) return;

    try {
      setSaving(true);
      await apiFetch(`/api/admin/executer-rights/${selectedExecutor.id}`, {
        method: "PUT",
        body: JSON.stringify({ rights: accessRights }),
      });

      alert("Права успешно сохранены!");
    } catch (error) {
      console.error("Ошибка сохранения прав:", error);
      alert("Ошибка при сохранении прав");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Настройка прав исполнителей
        </h1>
        <p className="text-gray-600">
          Управление доступом к услугам и настройка замены материалов
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Список исполнителей */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaUserCheck className="text-blue-600" />
            Исполнители
          </h2>

          <div className="space-y-2">
            {executors.map((executor) => (
              <div
                key={executor.id}
                onClick={() => handleExecutorSelect(executor)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedExecutor?.id === executor.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {executor.name || "Без имени"}
                    </p>
                    <p className="text-sm text-gray-500">
                      ID: {executor.telegram_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        executor.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {executor.status === "active"
                        ? "Активен"
                        : "Заблокирован"}
                    </span>
                    <FaEdit className="text-gray-400" size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Настройка прав */}
        <div className="lg:col-span-2">
          {selectedExecutor ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <FaCog className="text-blue-600" />
                  Права доступа: {selectedExecutor.name || "Без имени"}
                </h2>
                <p className="text-gray-600">
                  Telegram ID: {selectedExecutor.telegram_id}
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {services.map((service) => {
                    const right = accessRights.find(
                      (r) => r.service_id === service.id
                    ) || {
                      service_id: service.id,
                      has_access: false,
                      can_replace_materials: false,
                      requires_approval: true,
                    };

                    return (
                      <div
                        key={service.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium">{service.name}</h3>
                            <p className="text-sm text-gray-500">
                              {service.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={right.has_access}
                                onChange={(e) =>
                                  updateAccessRight(
                                    service.id,
                                    "has_access",
                                    e.target.checked
                                  )
                                }
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                            <span className="text-sm font-medium">
                              {right.has_access
                                ? "Доступ разрешен"
                                : "Доступ запрещен"}
                            </span>
                          </div>
                        </div>

                        {right.has_access && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Замена материалов
                              </label>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={right.can_replace_materials}
                                  onChange={(e) =>
                                    updateAccessRight(
                                      service.id,
                                      "can_replace_materials",
                                      e.target.checked
                                    )
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                              <span className="ml-3 text-sm text-gray-600">
                                {right.can_replace_materials
                                  ? "Разрешена"
                                  : "Запрещена"}
                              </span>
                            </div>

                            {right.can_replace_materials && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Требуется одобрение
                                </label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={right.requires_approval}
                                    onChange={(e) =>
                                      updateAccessRight(
                                        service.id,
                                        "requires_approval",
                                        e.target.checked
                                      )
                                    }
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                                <span className="ml-3 text-sm text-gray-600">
                                  {right.requires_approval ? "Да" : "Нет"}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={saveRights}
                      disabled={saving}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <FaSave />
                      {saving ? "Сохранение..." : "Сохранить права"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-8">
                <FaUserTimes className="mx-auto text-gray-400 text-4xl mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Выберите исполнителя
                </h3>
                <p className="text-gray-500">
                  Выберите исполнителя из списка слева для настройки прав
                  доступа
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
