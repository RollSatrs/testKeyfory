import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Input,
  message,
  Tag,
  Space,
  Card,
  Descriptions,
  Select,
  Row,
  Col,
  DatePicker,
} from "antd";
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  SwapOutlined,
  SearchOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ReplacementRequestsTable = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [processing, setProcessing] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [selectedNewMaterial, setSelectedNewMaterial] = useState(null);
  const [replaceModalVisible, setReplaceModalVisible] = useState(false);

  // Состояние фильтров
  const [filters, setFilters] = useState({
    status: null,
    serviceName: "",
    executerName: "",
    orderNumber: "",
    reason: "",
    dateRange: null,
  });
  const [filteredRequests, setFilteredRequests] = useState([]);

  // Загрузка запросов на замену
  const fetchReplacementRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/material-replacements", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Проверяем статус ответа
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Проверяем Content-Type
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Received non-JSON response:", text.substring(0, 200));
        throw new Error("Server returned non-JSON response");
      }

      const data = await response.json();
      setRequests(data);
      setFilteredRequests(data); // Инициализируем отфильтрованные данные
    } catch (error) {
      message.error("Ошибка при загрузке запросов на замену");
      console.error("Error fetching replacement requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplacementRequests();
  }, []);

  // Применение фильтров
  useEffect(() => {
    applyFilters();
  }, [requests, filters]);

  const applyFilters = () => {
    let filtered = [...requests];

    // Фильтр по статусу
    if (filters.status) {
      filtered = filtered.filter((req) => req.status === filters.status);
    }

    // Фильтр по названию услуги
    if (filters.serviceName.trim()) {
      filtered = filtered.filter((req) =>
        req.ServiceExecution?.Service?.name
          ?.toLowerCase()
          .includes(filters.serviceName.toLowerCase())
      );
    }

    // Фильтр по имени исполнителя
    if (filters.executerName.trim()) {
      filtered = filtered.filter((req) =>
        req.Executer?.name
          ?.toLowerCase()
          .includes(filters.executerName.toLowerCase())
      );
    }

    // Фильтр по номеру заказа
    if (filters.orderNumber.trim()) {
      filtered = filtered.filter((req) =>
        req.ServiceExecution?.order_number
          ?.toString()
          .includes(filters.orderNumber)
      );
    }

    // Фильтр по причине замены
    if (filters.reason.trim()) {
      filtered = filtered.filter((req) =>
        req.reason?.toLowerCase().includes(filters.reason.toLowerCase())
      );
    }

    // Фильтр по диапазону дат
    if (filters.dateRange && filters.dateRange.length === 2) {
      const [startDate, endDate] = filters.dateRange;
      filtered = filtered.filter((req) => {
        const requestDate = dayjs(req.created_at);
        return (
          requestDate.isAfter(startDate.startOf("day")) &&
          requestDate.isBefore(endDate.endOf("day"))
        );
      });
    }

    setFilteredRequests(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: null,
      serviceName: "",
      executerName: "",
      orderNumber: "",
      reason: "",
      dateRange: null,
    });
  };

  // Статистика по статусам
  const getStatusStats = () => {
    const stats = {
      total: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
      completed: requests.filter((r) => r.status === "completed").length,
    };
    return stats;
  };

  const statusStats = getStatusStats();

  // Загрузка доступных материалов для замены
  const fetchAvailableMaterials = async (requestId) => {
    console.log("Fetching available materials for request ID:", requestId);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `/api/admin/material-replacements/${requestId}/available-materials`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Available materials response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const materials = await response.json();
      console.log("Available materials received:", materials);
      setAvailableMaterials(materials);
    } catch (error) {
      message.error("Ошибка при загрузке доступных материалов");
      console.error("Error fetching available materials:", error);
    }
  };

  // Обработка замены материала
  const processReplacement = async () => {
    if (!selectedNewMaterial) {
      message.warning("Выберите материал для замены");
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `/api/admin/material-replacements/${selectedRequest.id}/replace`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            newMaterialId: selectedNewMaterial,
            admin_comment: adminResponse || null,
          }),
        }
      );

      if (response.ok) {
        message.success("Материал успешно заменен");
        setReplaceModalVisible(false);
        setModalVisible(false);
        setAdminResponse("");
        setSelectedNewMaterial(null);
        fetchReplacementRequests(); // Перезагрузка списка
      } else {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        message.error("Ошибка при замене материала");
      }
    } catch (error) {
      message.error("Ошибка при замене материала");
      console.error("Error processing replacement:", error);
    } finally {
      setProcessing(false);
    }
  };

  // Показать модальное окно замены материала
  const showReplaceModal = async (request) => {
    setSelectedRequest(request);
    await fetchAvailableMaterials(request.id);
    setReplaceModalVisible(true);
  };

  // Обработка запроса на замену
  const processRequest = async (requestId, decision) => {
    setProcessing(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `/api/admin/material-replacements/${requestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: decision,
            admin_comment: adminResponse || null,
          }),
        }
      );

      if (response.ok) {
        message.success(
          `Запрос ${decision === "approved" ? "одобрен" : "отклонён"}`
        );
        setModalVisible(false);
        setAdminResponse("");
        fetchReplacementRequests(); // Перезагрузка списка заявок

        // Уведомляем родительский компонент об изменениях для обновления списка материалов
        if (window.refreshMaterialsList) {
          window.refreshMaterialsList();
        }
      } else {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        message.error("Ошибка при обработке запроса");
      }
    } catch (error) {
      message.error("Ошибка при обработке запроса");
      console.error("Error processing request:", error);
    } finally {
      setProcessing(false);
    }
  };

  // Показать детали запроса
  const showRequestDetails = (request) => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  // Статус тэги
  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: "orange", text: "Ожидает" },
      approved: { color: "green", text: "Одобрен" },
      rejected: { color: "red", text: "Отклонён" },
      completed: { color: "blue", text: "Выполнен" },
    };

    const statusInfo = statusMap[status] || { color: "default", text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
    },
    {
      title: "Заказ",
      dataIndex: ["ServiceExecution", "order_number"],
      key: "orderNumber",
      width: 100,
      render: (orderNumber) => `#${orderNumber}`,
    },
    {
      title: "Услуга",
      dataIndex: ["ServiceExecution", "Service", "name"],
      key: "serviceName",
      width: 150,
    },
    {
      title: "Исполнитель",
      dataIndex: ["Executer", "name"],
      key: "executerName",
      width: 120,
    },
    {
      title: "Причина",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
      width: 200,
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: "Дата создания",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (date) => new Date(date).toLocaleDateString("ru-RU"),
    },
    {
      title: "Действия",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          {record.status === "pending" && (
            <Button
              type="primary"
              icon={<SwapOutlined />}
              size="small"
              onClick={() => showReplaceModal(record)}
            >
              Заменить
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card title="Запросы на замену материалов">
      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card
            size="small"
            style={{
              textAlign: "center",
              backgroundColor: filters.status === null ? "#e6f7ff" : "#f0f9ff",
              cursor: "pointer",
              border:
                filters.status === null
                  ? "2px solid #1890ff"
                  : "1px solid #d9d9d9",
            }}
            onClick={() => handleFilterChange("status", null)}
            hoverable
          >
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#1890ff" }}>
              {statusStats.total}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>Всего запросов</div>
          </Card>
        </Col>
        <Col span={4}>
          <Card
            size="small"
            style={{
              textAlign: "center",
              backgroundColor:
                filters.status === "pending" ? "#ffe7ba" : "#fff7e6",
              cursor: "pointer",
              border:
                filters.status === "pending"
                  ? "2px solid #fa8c16"
                  : "1px solid #d9d9d9",
            }}
            onClick={() => handleFilterChange("status", "pending")}
            hoverable
          >
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#fa8c16" }}>
              {statusStats.pending}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>Ожидают</div>
          </Card>
        </Col>
        <Col span={4}>
          <Card
            size="small"
            style={{
              textAlign: "center",
              backgroundColor:
                filters.status === "approved" ? "#d9f7be" : "#f6ffed",
              cursor: "pointer",
              border:
                filters.status === "approved"
                  ? "2px solid #52c41a"
                  : "1px solid #d9d9d9",
            }}
            onClick={() => handleFilterChange("status", "approved")}
            hoverable
          >
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#52c41a" }}>
              {statusStats.approved}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>Одобрены</div>
          </Card>
        </Col>
        <Col span={4}>
          <Card
            size="small"
            style={{
              textAlign: "center",
              backgroundColor:
                filters.status === "rejected" ? "#ffccc7" : "#fff1f0",
              cursor: "pointer",
              border:
                filters.status === "rejected"
                  ? "2px solid #ff4d4f"
                  : "1px solid #d9d9d9",
            }}
            onClick={() => handleFilterChange("status", "rejected")}
            hoverable
          >
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#ff4d4f" }}>
              {statusStats.rejected}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>Отклонены</div>
          </Card>
        </Col>
        <Col span={4}>
          <Card
            size="small"
            style={{
              textAlign: "center",
              backgroundColor:
                filters.status === "completed" ? "#bae7ff" : "#e6f7ff",
              cursor: "pointer",
              border:
                filters.status === "completed"
                  ? "2px solid #1890ff"
                  : "1px solid #d9d9d9",
            }}
            onClick={() => handleFilterChange("status", "completed")}
            hoverable
          >
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#1890ff" }}>
              {statusStats.completed}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>Выполнены</div>
          </Card>
        </Col>
      </Row>

      {/* Панель фильтров */}
      <Card
        size="small"
        title="Фильтры поиска"
        style={{ marginBottom: 16 }}
        extra={
          <Button icon={<ClearOutlined />} onClick={clearFilters} size="small">
            Очистить фильтры
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                Статус:
              </label>
              <Select
                placeholder="Все статусы"
                style={{ width: "100%" }}
                value={filters.status}
                onChange={(value) => handleFilterChange("status", value)}
                allowClear
                size="small"
              >
                <Option value="pending">Ожидает</Option>
                <Option value="approved">Одобрен</Option>
                <Option value="rejected">Отклонён</Option>
                <Option value="completed">Выполнен</Option>
              </Select>
            </div>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                Услуга:
              </label>
              <Input
                placeholder="Поиск по услуге"
                value={filters.serviceName}
                onChange={(e) =>
                  handleFilterChange("serviceName", e.target.value)
                }
                prefix={<SearchOutlined />}
                size="small"
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                Исполнитель:
              </label>
              <Input
                placeholder="Поиск по исполнителю"
                value={filters.executerName}
                onChange={(e) =>
                  handleFilterChange("executerName", e.target.value)
                }
                prefix={<SearchOutlined />}
                size="small"
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                Номер заказа:
              </label>
              <Input
                placeholder="Поиск по заказу"
                value={filters.orderNumber}
                onChange={(e) =>
                  handleFilterChange("orderNumber", e.target.value)
                }
                prefix={<SearchOutlined />}
                size="small"
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                Причина замены:
              </label>
              <Input
                placeholder="Поиск по причине"
                value={filters.reason}
                onChange={(e) => handleFilterChange("reason", e.target.value)}
                prefix={<SearchOutlined />}
                size="small"
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                Период:
              </label>
              <RangePicker
                style={{ width: "100%" }}
                value={filters.dateRange}
                onChange={(dates) => handleFilterChange("dateRange", dates)}
                format="DD.MM.YYYY"
                placeholder={["От", "До"]}
                size="small"
              />
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
          <strong>
            Найдено записей: {filteredRequests.length} из {requests.length}
          </strong>
        </div>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredRequests}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} из ${total} записей`,
        }}
      />

      <Modal
        title="Детали запроса на замену"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setAdminResponse("");
        }}
        footer={
          selectedRequest?.status === "pending"
            ? [
                <Button key="cancel" onClick={() => setModalVisible(false)}>
                  Отмена
                </Button>,
                <Button
                  key="reject"
                  danger
                  icon={<CloseOutlined />}
                  loading={processing}
                  onClick={() => processRequest(selectedRequest.id, "rejected")}
                >
                  Отклонить
                </Button>,
                <Button
                  key="approve"
                  type="primary"
                  icon={<CheckOutlined />}
                  loading={processing}
                  onClick={() => processRequest(selectedRequest.id, "approved")}
                >
                  Одобрить
                </Button>,
              ]
            : [
                <Button
                  key="close"
                  type="primary"
                  onClick={() => setModalVisible(false)}
                >
                  Закрыть
                </Button>,
              ]
        }
        width={700}
      >
        {selectedRequest && (
          <div>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="ID запроса">
                {selectedRequest.id}
              </Descriptions.Item>
              <Descriptions.Item label="Заказ">
                #{selectedRequest.ServiceExecution?.order_number}
              </Descriptions.Item>
              <Descriptions.Item label="Услуга">
                {selectedRequest.ServiceExecution?.Service?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Исполнитель">
                {selectedRequest.Executer?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Telegram ID">
                {selectedRequest.Executer?.telegram_id}
              </Descriptions.Item>
              <Descriptions.Item label="Статус">
                {getStatusTag(selectedRequest.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Дата создания">
                {new Date(selectedRequest.created_at).toLocaleString("ru-RU")}
              </Descriptions.Item>
              <Descriptions.Item label="Причина замены">
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {selectedRequest.reason}
                </div>
              </Descriptions.Item>
              {selectedRequest.admin_response && (
                <Descriptions.Item label="Ответ администратора">
                  <div style={{ whiteSpace: "pre-wrap" }}>
                    {selectedRequest.admin_response}
                  </div>
                </Descriptions.Item>
              )}
              {selectedRequest.processed_at && (
                <Descriptions.Item label="Дата обработки">
                  {new Date(selectedRequest.processed_at).toLocaleString(
                    "ru-RU"
                  )}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedRequest.status === "pending" && (
              <div style={{ marginTop: 16 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontWeight: "bold",
                  }}
                >
                  Ответ администратора (необязательно):
                </label>
                <TextArea
                  rows={4}
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Введите комментарий к решению..."
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="Замена материала"
        open={replaceModalVisible}
        onCancel={() => {
          setReplaceModalVisible(false);
          setSelectedNewMaterial(null);
          setAdminResponse("");
        }}
        footer={[
          <Button key="cancel" onClick={() => setReplaceModalVisible(false)}>
            Отмена
          </Button>,
          <Button
            key="replace"
            type="primary"
            icon={<SwapOutlined />}
            loading={processing}
            onClick={processReplacement}
          >
            Заменить материал
          </Button>,
        ]}
        width={600}
      >
        {selectedRequest && (
          <div>
            <Descriptions
              bordered
              column={1}
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="Заказ">
                #{selectedRequest.ServiceExecution?.order_number}
              </Descriptions.Item>
              <Descriptions.Item label="Услуга">
                {selectedRequest.ServiceExecution?.Service?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Исполнитель">
                {selectedRequest.Executer?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Причина замены">
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {selectedRequest.reason}
                </div>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: "bold",
                }}
              >
                Выберите новый материал:
              </label>
              <Select
                style={{ width: "100%" }}
                placeholder="Выберите материал для замены"
                value={selectedNewMaterial}
                onChange={(value) => setSelectedNewMaterial(value)}
                showSearch
                optionFilterProp="children"
              >
                {availableMaterials.map((material) => (
                  <Option key={material.id} value={material.id}>
                    {material.type_key} - {material.contents}
                  </Option>
                ))}
              </Select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: "bold",
                }}
              >
                Комментарий (необязательно):
              </label>
              <TextArea
                rows={3}
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Введите комментарий к замене..."
              />
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default ReplacementRequestsTable;
