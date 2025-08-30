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
  Tooltip,
} from "antd";
import { CSVLink } from "react-csv";
import { apiFetch } from "../../../lib/api";
import { DownloadOutlined } from "@ant-design/icons";

let successCount = 0;

async function getMateriallsServices(nameService) {
  try {
    await apiFetch("/api/admin/materials/service");
  } catch (err) {
    console.log("Ошибка", err);
  }
}

async function addMaterialls(row) {
  try {
    await apiFetch("/api/admin/materials/add", {
      method: "POST",
      body: JSON.stringify(row),
    });
    successCount++;
  } catch (err) {
    console.log("Ошибка", err);
  }
}

export function KeysMaterialsTable({
  refresh,
  onChange,
  search = "",
  statusFilter = "",
  serviceFilter = "",
  executerFilter = "",
}) {
  const [materials, setMaterials] = useState([]);
  const [services, setServices] = useState([]);
  const [replacements, setReplacements] = useState([]); // Добавляем состояние для замен
  const [editForm, setEditForm] = useState(false);
  const [replacementModalVisible, setReplacementModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [replacementMaterials, setReplacementMaterials] = useState([]);
  const [form, setForm] = useState({
    id: null,
    service_id: "",
    contents: "",
    status: "",
    executer_id: null,
    order_number: "",
  });

  const [executers, setExecuters] = useState([]);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignForm, setAssignForm] = useState({
    material_id: null,
    service_id: null,
    order_number: "",
    executer_id: null,
  });

  async function fetchExecuters() {
    try {
      const data = await apiFetch("/api/admin/executers/get");
      setExecuters(data || []);
    } catch (err) {
      console.error("Ошибка загрузки исполнителей:", err);
    }
  }

  function openAssignModal(record) {
    setAssignForm({
      material_id: record.id,
      service_id: record.service_id,
      order_number: record.order_number || "",
      executer_id: record.executer_id || null,
    });
    setAssignModalVisible(true);
  }

  function handleAssignChange(name, value) {
    setAssignForm({ ...assignForm, [name]: value });
  }
  async function handleAssignSubmit() {
    if (
      !assignForm.material_id ||
      !assignForm.service_id ||
      !assignForm.order_number ||
      !assignForm.executer_id
    ) {
      message.error("Заполните номер заказа и выберите исполнителя");
      return;
    }

    try {
      await apiFetch("/api/executers/use-material-for-order", {
        method: "POST",
        body: JSON.stringify({
          material_id: assignForm.material_id,
          service_id: assignForm.service_id,
          executer_id: assignForm.executer_id,
          order_number: assignForm.order_number,
        }),
      });

      // Оптимистично обновим локальный стейт: пометим материал как использованный
      const assignedExec = Array.isArray(executers)
        ? executers.find((e) => e.id === assignForm.executer_id)
        : null;
      setMaterials((prev) =>
        prev.map((m) =>
          m.id === assignForm.material_id
            ? {
                ...m,
                status: "used",
                executer_id: assignForm.executer_id || m.executer_id,
                executer_name:
                  (assignedExec &&
                    (assignedExec.name || assignedExec.executer_name)) ||
                  m.executer_name,
              }
            : m
        )
      );

      // Попробуем обновить статус и на сервере (не критично в случае ошибки)
      try {
        await handleStatusChange(assignForm.material_id, "used");
      } catch (e) {
        console.warn(
          "Не удалось обновить статус материала после назначения:",
          e
        );
      }

      message.success("Материал назначен и помечен как использованный");
      setAssignModalVisible(false);
      fetchMaterials();
      window.dispatchEvent(new Event("materials:changed"));
      if (onChange) onChange();
    } catch (err) {
      console.error("Ошибка при назначении материала:", err);
      message.error("Не удалось назначить материал");
    }
  }

  useEffect(() => {
    fetchMaterials();
    fetchServices();
    fetchExecuters();
  }, [refresh]);

  // Refresh materials when other parts of the app (services upload/add) signal changes
  useEffect(() => {
    const handler = () => {
      fetchMaterials();
      if (onChange) onChange();
    };
    window.addEventListener("materials:changed", handler);
    return () => window.removeEventListener("materials:changed", handler);
  }, []);

  async function fetchMaterials() {
    try {
      const data = await apiFetch("/api/admin/materials/get");
      setMaterials(data);

      // Также загружаем информацию о заменах
      await fetchReplacements();
    } catch (error) {
      console.error("Ошибка загрузки материалов:", error);
    }
  }

  async function fetchReplacements() {
    try {
      // Используем правильный API endpoint
      const replacementsData = await apiFetch(
        "/api/admin/material-replacements"
      );
      console.log("✅ Замены загружены:", replacementsData.length);
      setReplacements(replacementsData || []);
    } catch (error) {
      console.warn("Не удалось загрузить замены, продолжаем без них:", error);
      setReplacements([]);
    }
  }

  async function fetchServices() {
    try {
      const data = await apiFetch("/api/admin/services/get");
      setServices(data);
    } catch (error) {
      console.error("Ошибка загрузки услуг:", error);
    }
  }

  async function handleDelete(id) {
    try {
      await apiFetch(`/api/admin/materials/delete/${id}`, { method: "DELETE" });
      fetchMaterials();
      window.dispatchEvent(new Event("materials:changed"));
      if (onChange) onChange();
      message.success("Материал удален");
    } catch (error) {
      message.error("Ошибка при удалении материала");
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      await apiFetch(`/api/admin/materials/update-status/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      fetchMaterials();
      window.dispatchEvent(new Event("materials:changed"));
      if (onChange) onChange();
      message.success("Статус материала обновлен");
    } catch (error) {
      message.error("Ошибка при обновлении статуса");
    }
  }

  function openEditModal(material) {
    setForm({
      id: material.id,
      service_id: material.service_id,
      contents: material.contents,
      status: material.status,
      executer_id: material.executer_id || null,
      order_number: material.order_number || "",
    });
    setEditForm(true);
  }

  function handleChange(name, value) {
    setForm({ ...form, [name]: value });
  }

  async function handleEditSubmit() {
    try {
      await apiFetch(`/api/admin/materials/update/${form.id}`, {
        method: "PUT",
        body: JSON.stringify({
          service_id: form.service_id,
          contents: form.contents,
          status: form.status,
          executer_id: form.executer_id,
          order_number: form.order_number,
        }),
      });
      setEditForm(false);
      fetchMaterials();
      window.dispatchEvent(new Event("materials:changed"));
      if (onChange) onChange();
      message.success("Материал обновлен");
    } catch (error) {
      message.error("Ошибка при обновлении материала");
    }
  }

  function handleReplaceMaterial(material) {
    setSelectedMaterial(material);
    setReplacementModalVisible(true);
    fetchReplacementMaterials(material.service_id);
  }

  async function fetchReplacementMaterials(serviceId) {
    try {
      const data = await apiFetch("/api/admin/materials/get");
      // Фильтруем только доступные материалы той же услуги
      // Consider material available for replacement when it is not used and not bound to an order
      const availableMaterials = data.filter(
        (m) =>
          m.service_id === serviceId && !m.order_number && m.status !== "used"
      );
      setReplacementMaterials(availableMaterials);
    } catch (error) {
      console.error("Ошибка загрузки материалов для замены:", error);
    }
  }

  async function handleReplaceSubmit(newMaterialId) {
    try {
      await apiFetch("/api/admin/materials/replace", {
        method: "POST",
        body: JSON.stringify({
          oldMaterialId: selectedMaterial.id,
          newMaterialId: newMaterialId,
        }),
      });
      message.success("Материал успешно заменен");
      setReplacementModalVisible(false);
      fetchMaterials();
      window.dispatchEvent(new Event("materials:changed"));
      if (onChange) onChange();
    } catch (error) {
      console.error("Ошибка при замене материала:", error);
      message.error("Ошибка при замене материала");
    }
  }

  // Фильтрация перед отображением
  const filteredMaterials = materials.filter((m) => {
    const matchesSearch = m.contents
      ?.toLowerCase()
      .includes(search.toLowerCase());

    // Фильтр по статусу с поддержкой новых статусов
    let matchesStatus = true;
    if (statusFilter) {
      if (statusFilter === "available") {
        // Старая логика для совместимости
        matchesStatus = m.status !== "использован" && !m.order_number;
      } else {
        matchesStatus = m.status === statusFilter;
      }
    }

    // Фильтр по услуге
    let matchesService = true;
    if (serviceFilter) {
      matchesService = m.service_id == serviceFilter;
    }

    // Фильтр по исполнителю
    let matchesExecuter = true;
    if (executerFilter) {
      matchesExecuter = m.executer_id == executerFilter;
    }

    return matchesSearch && matchesStatus && matchesService && matchesExecuter;
  });
  console.log(filteredMaterials);

  const getServiceName = (serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    return service ? service.name : "Неизвестная услуга";
  };

  const getExecuterName = (executerId) => {
    const executer = executers.find((e) => e.id === executerId);
    return executer
      ? executer.name || `ID: ${executer.telegram_id}`
      : "Не назначен";
  };

  // Функция для определения реального статуса материала для отображения
  const getMaterialDisplayStatus = (material) => {
    // Если материал имеет статус "заменен" напрямую в БД
    if (material.status === "заменен") {
      return {
        text: "Заменен",
        color: "orange",
        originalStatus: material.status,
      };
    }

    // Проверяем, есть ли завершенная замена для этого материала
    const hasCompletedReplacement = replacements.some(
      (replacement) =>
        replacement.material_id === material.id &&
        replacement.status === "completed"
    );

    // Если есть завершенная замена - показываем "Заменен"
    if (hasCompletedReplacement) {
      return {
        text: "Заменен",
        color: "orange",
        originalStatus: material.status,
      };
    }

    // Иначе показываем обычный статус
    const materialStatus = material.status;

    if (materialStatus === "used" || materialStatus === "ИСПОЛЬЗОВАН") {
      return {
        text: "Использован",
        color: "red",
        originalStatus: materialStatus,
      };
    } else if (
      materialStatus === "available" ||
      materialStatus === "ДОСТУПЕН" ||
      materialStatus === "доступен" ||
      !materialStatus
    ) {
      return {
        text: "Доступен",
        color: "green",
        originalStatus: materialStatus,
      };
    } else if (materialStatus === "pending_replace") {
      return {
        text: "На замене",
        color: "orange",
        originalStatus: materialStatus,
      };
    } else {
      return {
        text: materialStatus,
        color: "blue",
        originalStatus: materialStatus,
      };
    }
  };

  // Функция для перевода источника на русский
  const getSourceLabel = (source) => {
    const sourceLabels = {
      manual: "Ручной ввод",
      manual_input: "Ручной ввод",
      api: "API",
      file: "Со склада",
      file_upload: "Со склада",
      upload: "Со склада",
      warehouse: "Со склада",
    };
    return sourceLabels[source] || source || "Со склада";
  };

  // Функция для перевода типа ключа на русский
  const getTypeLabel = (type) => {
    const typeLabels = {
      key: "Ключ",
      license: "Лицензия",
      code: "Код",
      password: "Пароль",
      account: "Аккаунт",
      token: "Токен",
      imported: "Импортирован",
      manual: "Ручной",
    };
    return typeLabels[type] || type || "Ключ";
  };

  const headers = [
    { label: "Название услуги", key: "service_name" },
    { label: "Содержимое", key: "contents" },
    { label: "Статус", key: "status" },
    { label: "Номер заказа", key: "order_number" },
    { label: "Исполнитель", key: "executer_name" },
    { label: "Источник", key: "source" },
  ];

  // Преобразуем данные для экспорта
  // Do not show "Доступен" в экспорте; экспортируем реальные поля или пустые строки
  const exportData = filteredMaterials.map((m) => ({
    ...m,
    service_name: getServiceName(m.service_id),
    order_number: m.order_number || "",
    executer_name: getExecuterName(m.executer_id),
  }));

  const columns = [
    {
      title: "Услуга",
      dataIndex: "service_id",
      key: "service_id",
      render: (serviceId) => getServiceName(serviceId),
    },
    {
      title: "Содержимое",
      dataIndex: "contents",
      key: "contents",
      render: (contents) => (
        <div
          style={{
            maxWidth: 200,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {contents}
        </div>
      ),
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      render: (materialStatus, record) => {
        // Используем новую функцию для определения статуса
        const displayStatus = getMaterialDisplayStatus(record);

        // Находим услугу для получения информации об исполнителях
        const service = services.find((s) => s.id === record.service_id);

        // Подготавливаем информацию об исполнителях для tooltip
        const executersList = [];

        // ДЛЯ РАСХОДНЫХ УСЛУГ: показываем исполнителей только если материал реально назначен
        if (service && service.is_consumable) {
          // Для расходных услуг показываем только реально назначенного исполнителя из материала
          if (record.executer_id && record.executer_name) {
            executersList.push({
              name: record.executer_name,
              status: "Назначен на заказ",
            });
          }
        } else if (
          service &&
          service.assigned_executers &&
          service.assigned_executers.length > 0
        ) {
          // Для НЕ расходных услуг - показываем всех назначенных через ServiceAccess
          for (const executer of service.assigned_executers) {
            const executerStatus =
              executer.status === "active"
                ? "Активен"
                : executer.status === "inactive"
                ? "Неактивен"
                : executer.status || "Неизвестен";
            executersList.push({
              name:
                executer.executer_name ||
                executer.name ||
                `ID: ${executer.executer_id}`,
              status: executerStatus,
            });
          }
        }

        // Tooltip с информацией об исполнителях и замене
        const tooltipContent = (
          <div style={{ maxWidth: 300 }}>
            <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
              📦 Материал: {displayStatus.text}
            </div>
            <div style={{ marginBottom: "8px" }}>
              🏷️ Услуга: {service?.name || "Неизвестная услуга"}
            </div>
            {displayStatus.text === "Заменен" && (
              <div style={{ marginBottom: "8px", color: "#ff7f00" }}>
                🔄 Статус в БД: "{displayStatus.originalStatus}" (после замены)
                <br />✅ Материал заменен и снова доступен для использования
              </div>
            )}
            {executersList.length > 0 ? (
              <div>
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  👥 Назначенные исполнители:
                </div>
                {executersList.map((exec, idx) => (
                  <div
                    key={idx}
                    style={{ marginBottom: "2px", fontSize: "12px" }}
                  >
                    • {exec.name} ({exec.status})
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "12px", color: "#888" }}>
                👤 Исполнители не назначены
              </div>
            )}
          </div>
        );

        return (
          <Tooltip title={tooltipContent}>
            <Tag color={displayStatus.color} style={{ fontSize: "12px" }}>
              {displayStatus.text}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Номера заказов",
      dataIndex: "order_number",
      key: "order_number",
      width: 200,
      render: (order_number, record) => {
        // Build normalized order list with executor info
        const activeOrders = Array.isArray(record.active_orders)
          ? record.active_orders
          : [];
        const orderNumbers = Array.isArray(record.order_numbers)
          ? record.order_numbers
          : [];

        // Fixed executors for consistent display
        const FIXED_EXECUTER_NAMES = ["кцукцук", "Роллан Сарсембаев", "Rollan"];

        // Normalize executor identity
        const normalizeExecutor = (obj) => {
          if (!obj) return { name: null };

          const name =
            obj.executer_name ||
            (obj.executer && obj.executer.name) ||
            obj.name ||
            null;

          // Try to match against fixed names first
          if (name) {
            const normalized = name.toString().trim().toLowerCase();
            const fixedMatch = FIXED_EXECUTER_NAMES.find(
              (fn) => fn.toString().trim().toLowerCase() === normalized
            );
            if (fixedMatch) {
              return { name: fixedMatch };
            }
          }

          return { name: name || null };
        };

        const orders = [];

        // Process active orders
        for (const o of activeOrders) {
          if (!o) continue;
          if (typeof o === "string" || typeof o === "number") {
            orders.push({
              order_number: o,
              executer_name: null,
              status: null,
            });
          } else {
            const { name } = normalizeExecutor(o);
            orders.push({
              order_number: o.order_number || o.order || o.id,
              executer_name: name,
              status: o.status || o.state || null,
            });
          }
        }

        // Process order numbers if no active orders
        if (orders.length === 0) {
          for (const n of orderNumbers) {
            if (!n) continue;
            if (typeof n === "object") {
              const { name } = normalizeExecutor(n);
              orders.push({
                ...n,
                executer_name: name || n.executer_name,
              });
            } else {
              const { name } = normalizeExecutor(record);
              orders.push({
                order_number: n,
                executer_name: name,
                status: null,
              });
            }
          }
        }

        // Fallback to single order from record
        if (orders.length === 0 && order_number) {
          const { name } = normalizeExecutor(record);
          orders.push({
            order_number: order_number,
            executer_name: name,
            status: record.status || null,
          });
        }

        if (orders.length === 0) {
          return <span style={{ color: "#64748b" }}>Не указан</span>;
        }

        // Check if this is a consumable material
        const isConsumable =
          record.is_consumable === true ||
          record.type === "consumable" ||
          record.type === "расходный" ||
          (typeof record.type === "string" &&
            record.type.toLowerCase().includes("consum"));

        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {orders.map((order, index) => {
              const isCompleted =
                (order.status || "")
                  .toString()
                  .toLowerCase()
                  .includes("completed") ||
                (order.status || "")
                  .toString()
                  .toLowerCase()
                  .includes("выполн") ||
                (order.status || "")
                  .toString()
                  .toLowerCase()
                  .includes("used") ||
                (order.status || "")
                  .toString()
                  .toLowerCase()
                  .includes("использ");

              return (
                <Tooltip
                  key={`${order.order_number}-${index}`}
                  title={
                    <div>
                      <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                        📋 Заказ #{order.order_number}
                      </div>
                      {order.executer_name && (
                        <div style={{ color: "#87ceeb" }}>
                          👤 Исполнитель: {order.executer_name}
                        </div>
                      )}
                      {order.status && (
                        <div
                          style={{
                            color: isCompleted ? "#90EE90" : "#FFA500",
                            fontSize: "12px",
                            marginTop: "2px",
                          }}
                        >
                          📊 Статус: {isCompleted ? "Выполнен" : "В процессе"}
                        </div>
                      )}
                    </div>
                  }
                  placement="top"
                >
                  <Tag
                    color={
                      isCompleted
                        ? "blue"
                        : record.status === "used"
                        ? "red"
                        : "blue"
                    }
                    style={{
                      cursor: "pointer",
                      margin: "2px",
                      fontSize: "12px",
                    }}
                  >
                    #{order.order_number}
                  </Tag>
                </Tooltip>
              );
            })}
          </div>
        );
      },
    },
    {
      title: "Исполнители",
      key: "executers",
      width: 200,
      render: (_, record) => {
        // Build normalized order list with executor info (same logic as order numbers)
        const activeOrders = Array.isArray(record.active_orders)
          ? record.active_orders
          : [];
        const orderNumbers = Array.isArray(record.order_numbers)
          ? record.order_numbers
          : [];

        // Fixed executors for consistent display
        const FIXED_EXECUTER_NAMES = ["кцукцук", "Роллан Сарсембаев", "Rollan"];

        // Normalize executor identity
        const normalizeExecutor = (obj) => {
          if (!obj) return { name: null };

          const name =
            obj.executer_name ||
            (obj.executer && obj.executer.name) ||
            obj.name ||
            null;

          // Try to match against fixed names first
          if (name) {
            const normalized = name.toString().trim().toLowerCase();
            const fixedMatch = FIXED_EXECUTER_NAMES.find(
              (fn) => fn.toString().trim().toLowerCase() === normalized
            );
            if (fixedMatch) {
              return { name: fixedMatch };
            }
          }

          return { name: name || null };
        };

        const orders = [];

        // Process active orders
        for (const o of activeOrders) {
          if (!o) continue;
          if (typeof o === "string" || typeof o === "number") {
            orders.push({
              order_number: o,
              executer_name: null,
              status: null,
            });
          } else {
            const { name } = normalizeExecutor(o);
            orders.push({
              order_number: o.order_number || o.order || o.id,
              executer_name: name,
              status: o.status || o.state || null,
            });
          }
        }

        // Process order numbers if no active orders
        if (orders.length === 0) {
          for (const n of orderNumbers) {
            if (!n) continue;
            if (typeof n === "object") {
              const { name } = normalizeExecutor(n);
              orders.push({
                ...n,
                executer_name: name || n.executer_name,
              });
            } else {
              const { name } = normalizeExecutor(record);
              orders.push({
                order_number: n,
                executer_name: name,
                status: null,
              });
            }
          }
        }

        // Fallback to single order from record
        if (orders.length === 0 && record.order_number) {
          const { name } = normalizeExecutor(record);
          orders.push({
            order_number: record.order_number,
            executer_name: name,
            status: record.status || null,
          });
        }

        // Extract unique executors from orders
        const uniqueExecuters = [];
        const executerNames = new Set();

        for (const order of orders) {
          if (order.executer_name && !executerNames.has(order.executer_name)) {
            executerNames.add(order.executer_name);
            uniqueExecuters.push({
              name: order.executer_name,
              status: order.status || null,
            });
          }
        }

        // If no executors from orders, try direct assignment
        if (uniqueExecuters.length === 0) {
          // 1. Проверяем прямое назначение через executer_id в материале
          if (record.executer_id && record.executer_name) {
            return <Tag color="green">{record.executer_name}</Tag>;
          }

          // 2. Проверяем прямое назначение через assignedExecuter
          const directExecuter = record.assignedExecuter;
          if (directExecuter) {
            return (
              <Tag
                color={directExecuter.status === "active" ? "green" : "orange"}
              >
                {directExecuter.name || "Неизвестный исполнитель"}
              </Tag>
            );
          }

          // 3. Проверяем назначение через ServiceAccess (включая архивированные услуги)
          const svc = services.find((s) => s.id === record.service_id);
          const assignedExecuters = svc?.assigned_executers || [];

          // ДЛЯ РАСХОДНЫХ УСЛУГ: НЕ показываем автоматически назначенных исполнителей
          // Исполнители должны показываться только если материал реально назначен на заказ
          if (svc && svc.is_consumable) {
            return <Tag color="default">Не назначены</Tag>;
          }

          // Если есть назначения через ServiceAccess (только для НЕ расходных услуг)
          if (assignedExecuters.length > 0) {
            if (assignedExecuters.length === 1) {
              const executer = assignedExecuters[0];
              return (
                <Tag color={executer.status === "active" ? "green" : "orange"}>
                  {executer.executer_name ||
                    executer.name ||
                    "Неизвестный исполнитель"}
                </Tag>
              );
            }

            return (
              <Tooltip
                title={
                  <div>
                    {assignedExecuters.map((executer, index) => (
                      <div key={index}>
                        •{" "}
                        {executer.executer_name ||
                          executer.name ||
                          "Неизвестный исполнитель"}
                      </div>
                    ))}
                  </div>
                }
              >
                <Tag color="blue">
                  {assignedExecuters.length} исполнител
                  {assignedExecuters.length === 1
                    ? "ь"
                    : assignedExecuters.length < 5
                    ? "я"
                    : "ей"}
                </Tag>
              </Tooltip>
            );
          }

          return <Tag color="default">Не назначены</Tag>;
        }

        // Display executors from orders
        if (uniqueExecuters.length === 0) {
          return <span style={{ color: "#64748b" }}>Не указан</span>;
        }

        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {uniqueExecuters.map((executer, index) => {
              const isCompleted =
                executer.status &&
                (executer.status
                  .toString()
                  .toLowerCase()
                  .includes("completed") ||
                  executer.status.toString().toLowerCase().includes("выполн") ||
                  executer.status.toString().toLowerCase().includes("used") ||
                  executer.status.toString().toLowerCase().includes("использ"));

              return (
                <Tooltip
                  key={`${executer.name}-${index}`}
                  title={
                    <div>
                      <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                        👤 Исполнитель: {executer.name}
                      </div>
                      {executer.status && (
                        <div
                          style={{
                            color: isCompleted ? "#90EE90" : "#FFA500",
                            fontSize: "12px",
                            marginTop: "2px",
                          }}
                        >
                          📊 Статус: {isCompleted ? "Выполнен" : "В процессе"}
                        </div>
                      )}
                    </div>
                  }
                  placement="top"
                >
                  <Tag
                    color={isCompleted ? "green" : "blue"}
                    style={{
                      cursor: "pointer",
                      margin: "2px",
                      fontSize: "12px",
                    }}
                  >
                    {executer.name}
                  </Tag>
                </Tooltip>
              );
            })}
          </div>
        );
      },
    },
    {
      title: "Источник",
      dataIndex: "source",
      key: "source",
      render: (source) => getSourceLabel(source),
    },
    {
      title: "Исполнитель",
      dataIndex: "executer_id",
      key: "executer_id",
      render: (executerId) => (
        <Tag color={executerId ? "blue" : "default"}>
          {getExecuterName(executerId)}
        </Tag>
      ),
    },
    {
      title: "Действия",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            icon={<FaEdit />}
            onClick={() => openEditModal(record)}
            size="small"
            title="Редактировать"
          />
          <Popconfirm
            title="Удалить материал?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button icon={<FaTrash />} danger size="small" title="Удалить" />
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
            📦 Список материалов
          </h2>
          <div
            style={{
              color: "#64748b",
              fontSize: "1rem",
              fontWeight: 400,
              marginTop: 2,
            }}
          >
            Здесь отображаются все материалы, доступные для услуг.
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
            filename="materials_export.csv"
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
        dataSource={filteredMaterials}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        bordered
        style={{ marginTop: 8 }}
        scroll={{ x: 1200 }}
      />
      <Modal
        open={editForm}
        title="Редактировать материал"
        onCancel={() => setEditForm(false)}
        onOk={handleEditSubmit}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Select
          name="service_id"
          value={form.service_id || undefined}
          onChange={(value) => handleChange("service_id", value)}
          placeholder="Привязать к услуге"
          className="w-full"
          style={{ marginBottom: 16 }}
        >
          {services.map((service) => (
            <Select.Option key={service.id} value={service.id}>
              {service.name}
            </Select.Option>
          ))}
        </Select>

        <Input
          name="contents"
          value={form.contents}
          onChange={(e) => handleChange("contents", e.target.value)}
          placeholder="Содержимое (ключ, код и т.п.)"
          style={{ marginBottom: 16 }}
        />

        <Select
          name="status"
          value={form.status || undefined}
          onChange={(value) => handleChange("status", value)}
          placeholder="Статус материала"
          className="w-full"
          style={{ marginBottom: 16 }}
        >
          <Select.Option value="available">Доступен</Select.Option>
          <Select.Option value="used">Использован</Select.Option>
          <Select.Option value="pending_replace">На замене</Select.Option>
        </Select>

        <Input
          name="order_number"
          value={form.order_number}
          onChange={(e) => handleChange("order_number", e.target.value)}
          placeholder="Номер заказа"
          style={{ marginBottom: 16 }}
        />

        <Select
          name="executer_id"
          value={form.executer_id || undefined}
          onChange={(value) => handleChange("executer_id", value)}
          placeholder="Выберите исполнителя"
          className="w-full"
          style={{ marginBottom: 8 }}
          allowClear
        >
          {executers.map((executer) => (
            <Select.Option key={executer.id} value={executer.id}>
              {executer.name || `ID: ${executer.id}`}
              {executer.telegram_id && ` (${executer.telegram_id})`}
            </Select.Option>
          ))}
        </Select>
      </Modal>

      {/* Модальное окно замены материала */}
      <Modal
        open={replacementModalVisible}
        title="Заменить материал"
        onCancel={() => setReplacementModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedMaterial && (
          <div>
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                background: "#f5f5f5",
                borderRadius: 8,
              }}
            >
              <h4 style={{ margin: 0, marginBottom: 8 }}>
                Заменяемый материал:
              </h4>
              <p style={{ margin: 0, fontSize: "14px" }}>
                <strong>Услуга:</strong>{" "}
                {getServiceName(selectedMaterial.service_id)}
                <br />
                <strong>Содержимое:</strong> {selectedMaterial.contents}
                <br />
                <strong>Статус:</strong> На замене
              </p>
            </div>

            <h4>Выберите новый материал:</h4>
            {replacementMaterials.length > 0 ? (
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {replacementMaterials.map((material) => (
                  <div
                    key={material.id}
                    style={{
                      padding: 12,
                      border: "1px solid #d9d9d9",
                      borderRadius: 8,
                      marginBottom: 8,
                      cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#f0f0f0";
                      e.target.style.borderColor = "#1890ff";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "white";
                      e.target.style.borderColor = "#d9d9d9";
                    }}
                    onClick={() => handleReplaceSubmit(material.id)}
                  >
                    <div style={{ fontSize: "14px" }}>
                      <strong>Содержимое:</strong> {material.contents}
                      <br />
                      <strong>Статус:</strong> <Tag color="green">Доступен</Tag>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 20, color: "#999" }}>
                Нет доступных материалов для замены этой услуги
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Модальное окно назначения материала на заказ (и пометка как использован) */}
      <Modal
        open={assignModalVisible}
        title="Назначить материал на заказ"
        onCancel={() => setAssignModalVisible(false)}
        onOk={handleAssignSubmit}
        okText="Назначить и пометить"
        cancelText="Отмена"
      >
        <Input
          placeholder="Номер заказа"
          value={assignForm.order_number}
          onChange={(e) => handleAssignChange("order_number", e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <Select
          placeholder="Выберите исполнителя"
          value={assignForm.executer_id || undefined}
          onChange={(val) => handleAssignChange("executer_id", val)}
          className="w-full"
        >
          {executers.map((ex) => (
            <Select.Option key={ex.id} value={ex.id}>
              {ex.name || `Исполнитель ${ex.id}`}
            </Select.Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
}
