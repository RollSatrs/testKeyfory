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
}) {
  const [materials, setMaterials] = useState([]);
  const [services, setServices] = useState([]);
  const [editForm, setEditForm] = useState(false);
  const [replacementModalVisible, setReplacementModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [replacementMaterials, setReplacementMaterials] = useState([]);
  const [form, setForm] = useState({
    id: null,
    service_id: "",
    contents: "",
    status: "",
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
    } catch (error) {
      console.error("Ошибка загрузки материалов:", error);
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
    // If statusFilter is provided, support filtering by 'available' meaning not used and not bound to order
    if (statusFilter) {
      if (statusFilter === "available") {
        return matchesSearch && m.status !== "used" && !m.order_number;
      }
      return matchesSearch && m.status === statusFilter;
    }
    return matchesSearch;
  });
  console.log(filteredMaterials);

  const getServiceName = (serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    return service ? service.name : "Неизвестная услуга";
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
  // Do not show "Доступен" in export; export real fields or empty strings
  const exportData = filteredMaterials.map((m) => ({
    ...m,
    service_name: getServiceName(m.service_id),
    order_number: m.order_number || "",
    executer_name: m.executer_name || "",
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
      render: () => {
        // Always show "Использован" for every material row per request
        return (
          <Tag color="red" style={{ fontSize: "12px" }}>
            Использован
          </Tag>
        );
      },
    },
    {
      title: "Номера заказов",
      dataIndex: "order_number",
      key: "order_number",
      width: 200,

      render: (order_number, record) => {
        // Если материал помечен как использованный - показываем использован
        if (record.status === "used") {
          // If there is explicit order info, prefer showing it below; otherwise indicate no order specified
          if (!order_number && !record.order_numbers && !record.active_orders) {
            return <span style={{ color: "#64748b" }}>Не указан</span>;
          }
        }

        // If no order_number and no active orders - show "Не указан"
        if (!order_number && !record.order_numbers && !record.active_orders) {
          return <span style={{ color: "#64748b" }}>Не указан</span>;
        }

        // Обрабатываем разные форматы данных заказов
        let orders = [];

        // Если есть массив активных заказов (как в услугах)
        if (record.active_orders && Array.isArray(record.active_orders)) {
          orders = record.active_orders;
        }
        // Если есть массив номеров заказов
        else if (record.order_numbers && Array.isArray(record.order_numbers)) {
          orders = record.order_numbers.map((num) => ({
            order_number: num,
            executer_name: record.executer_name || "Неизвестный исполнитель",
          }));
        }
        // Если есть один номер заказа
        else if (order_number) {
          orders = [
            {
              order_number: order_number,
              executer_name: record.executer_name || "Неизвестный исполнитель",
            },
          ];
        }

        // If no orders found, show "Не указан"
        if (orders.length === 0) {
          return <span style={{ color: "#64748b" }}>Не указан</span>;
        }

        // Если один заказ
        if (orders.length === 1) {
          const order = orders[0];
          return (
            <Tooltip
              title={`Исполнитель: ${order.executer_name}\nНомер заказа: ${
                order.order_number
              }\nСтатус: ${
                record.status === "used"
                  ? "Использован"
                  : record.status === "pending_replace"
                  ? "На замене"
                  : "В работе"
              }`}
              placement="top"
            >
              <Tag
                color={
                  record.status === "used"
                    ? "red"
                    : record.status === "pending_replace"
                    ? "volcano"
                    : "blue"
                }
                style={{
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                #{order.order_number}
              </Tag>
            </Tooltip>
          );
        }

        // Если несколько заказов
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {orders.map((order, index) => (
              <Tooltip
                key={`${order.order_number}-${index}`}
                title={`Исполнитель: ${order.executer_name}\nНомер заказа: ${
                  order.order_number
                }\nСтатус: ${
                  record.status === "used"
                    ? "Использован"
                    : record.status === "pending_replace"
                    ? "На замене"
                    : "В работе"
                }`}
                placement="top"
              >
                <Tag
                  color={record.status === "used" ? "red" : "blue"}
                  style={{ cursor: "pointer", margin: "2px", fontSize: "12px" }}
                >
                  #{order.order_number}
                </Tag>
              </Tooltip>
            ))}
          </div>
        );
      },
    },
    {
      title: "Исполнитель",
      dataIndex: "executer_name",
      key: "executer_name",
      width: 150,
      render: (executer_name, record) => {
        // Show only explicit executor name (no placeholders)
        if (executer_name) {
          return (
            <Tag color="blue" style={{ fontSize: "12px" }}>
              {executer_name}
            </Tag>
          );
        }
        // If executor present in active_orders, show unique names
        if (record.active_orders && record.active_orders.length > 0) {
          const uniqueExecuters = [
            ...new Set(record.active_orders.map((o) => o.executer_name)),
          ];
          if (uniqueExecuters.length === 1) {
            return (
              <Tag color="blue" style={{ fontSize: "12px" }}>
                {uniqueExecuters[0]}
              </Tag>
            );
          }
          return (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
              {uniqueExecuters.map((name, index) => (
                <Tag
                  key={index}
                  color="blue"
                  style={{ fontSize: "11px", margin: "1px" }}
                >
                  {name}
                </Tag>
              ))}
            </div>
          );
        }

        return null;
      },
    },
    {
      title: "Источник",
      dataIndex: "source",
      key: "source",
      render: (source) => getSourceLabel(source),
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
          {/* Only Edit and Delete actions per spec */}
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
          style={{ marginBottom: 8 }}
        >
          <Select.Option value="available">Доступен</Select.Option>
          <Select.Option value="used">Использован</Select.Option>
          <Select.Option value="pending_replace">На замене</Select.Option>
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
