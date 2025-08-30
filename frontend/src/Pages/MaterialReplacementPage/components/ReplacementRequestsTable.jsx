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
} from "antd";
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  SwapOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;
const { Option } = Select;

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
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => showRequestDetails(record)}
          >
            Подробнее
          </Button>
          {record.status === "pending" && (
            <Button
              type="default"
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
      <Table
        columns={columns}
        dataSource={requests}
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
