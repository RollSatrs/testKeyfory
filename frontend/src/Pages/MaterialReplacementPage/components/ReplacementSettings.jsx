import React, { useState, useEffect } from "react";
import { Table, Button, Modal, message, Tag, Space, Card, Select } from "antd";
import {
  SettingOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";

const { Option } = Select;

const ReplacementSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [newReplacementType, setNewReplacementType] = useState("manual");
  const [processing, setProcessing] = useState(false);

  // Загрузка настроек замены
  const fetchReplacementSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/replacement-settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const services = await response.json();

        // Преобразуем услуги в формат для таблицы
        const settingsArray = services.map((service) => ({
          key: service.id.toString(),
          serviceId: service.id,
          serviceName: service.name,
          replacementType: service.replacement_type || "manual",
        }));

        setSettings(settingsArray);
      } else {
        message.error("Ошибка при загрузке настроек замены");
      }
    } catch (error) {
      message.error("Ошибка при загрузке настроек замены");
      console.error("Error fetching replacement settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplacementSettings();
  }, []);

  // Показать модальное окно настроек
  const showSettingsModal = (setting) => {
    setSelectedSetting(setting);
    setNewReplacementType(setting.replacementType);
    setModalVisible(true);
  };

  // Сохранить настройки замены
  const saveReplacementSettings = async () => {
    if (!selectedSetting) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/replacement-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId: selectedSetting.serviceId,
          replacementType: newReplacementType,
        }),
      });

      if (response.ok) {
        message.success("Настройки сохранены");
        setModalVisible(false);
        await fetchReplacementSettings(); // Перезагружаем настройки
      } else {
        const errorData = await response.json();
        message.error(errorData.error || "Ошибка при сохранении настроек");
      }
    } catch (error) {
      message.error("Ошибка при сохранении настроек");
      console.error("Error saving settings:", error);
    } finally {
      setProcessing(false);
    }
  };

  // Получить тег типа замены
  const getReplacementTypeTag = (type) => {
    return type === "auto" ? (
      <Tag color="green">Авто-замена</Tag>
    ) : (
      <Tag color="orange">Ручная замена</Tag>
    );
  };

  const columns = [
    {
      title: "Услуга",
      dataIndex: "serviceName",
      key: "serviceName",
      sorter: (a, b) => a.serviceName.localeCompare(b.serviceName),
    },
    {
      title: "Тип замены",
      key: "replacementType",
      render: (_, record) => getReplacementTypeTag(record.replacementType),
      filters: [
        { text: "Авто-замена", value: "auto" },
        { text: "Ручная замена", value: "manual" },
      ],
      onFilter: (value, record) => record.replacementType === value,
    },
    {
      title: "Действия",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<SettingOutlined />}
          size="small"
          onClick={() => showSettingsModal(record)}
        >
          Изменить
        </Button>
      ),
    },
  ];

  return (
    <Card title="Настройки замены материалов">
      <Table
        columns={columns}
        dataSource={settings}
        loading={loading}
        rowKey="key"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} из ${total} записей`,
        }}
      />

      <Modal
        title="Настройка типа замены материалов"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Отмена
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<CheckOutlined />}
            loading={processing}
            onClick={saveReplacementSettings}
          >
            Сохранить
          </Button>,
        ]}
        width={500}
      >
        {selectedSetting && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <p>
                <strong>Услуга:</strong> {selectedSetting.serviceName}
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: "bold",
                }}
              >
                Тип замены материалов:
              </label>
              <Select
                style={{ width: "100%" }}
                value={newReplacementType}
                onChange={setNewReplacementType}
              >
                <Option value="manual">
                  <Space>
                    <Tag color="orange">Ручная замена</Tag>
                    <span>Требуется подтверждение администратора</span>
                  </Space>
                </Option>
                <Option value="auto">
                  <Space>
                    <Tag color="green">Авто-замена</Tag>
                    <span>Автоматическое одобрение запросов</span>
                  </Space>
                </Option>
              </Select>
            </div>

            <div
              style={{ background: "#f5f5f5", padding: 12, borderRadius: 4 }}
            >
              <p style={{ margin: 0, color: "#666" }}>
                <strong>Ручная замена:</strong> Все запросы на замену материалов
                для этой услуги будут требовать ручного подтверждения
                администратором.
              </p>
              <p style={{ margin: "8px 0 0 0", color: "#666" }}>
                <strong>Авто-замена:</strong> Запросы на замену материалов для
                этой услуги будут автоматически одобряться системой.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default ReplacementSettings;
