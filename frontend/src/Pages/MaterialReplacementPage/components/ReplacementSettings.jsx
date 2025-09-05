import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  message,
  Tag,
  Space,
  Card,
  Select,
  Input,
  Row,
  Col,
} from "antd";
import {
  SettingOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  ClearOutlined,
} from "@ant-design/icons";

const { Option } = Select;

const ReplacementSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [newReplacementType, setNewReplacementType] = useState("manual");
  const [processing, setProcessing] = useState(false);

  // Состояние фильтров
  const [filters, setFilters] = useState({
    serviceName: "",
    replacementType: null,
    category: "",
  });
  const [filteredSettings, setFilteredSettings] = useState([]);

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
          serviceCategory: service.category || "Без категории",
          replacementType: service.replacement_type || "manual",
        }));

        setSettings(settingsArray);
        setFilteredSettings(settingsArray); // Инициализируем отфильтрованные данные
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

  // Применение фильтров
  useEffect(() => {
    applyFilters();
  }, [settings, filters]);

  const applyFilters = () => {
    let filtered = [...settings];

    // Фильтр по названию услуги
    if (filters.serviceName.trim()) {
      filtered = filtered.filter((setting) =>
        setting.serviceName
          .toLowerCase()
          .includes(filters.serviceName.toLowerCase())
      );
    }

    // Фильтр по типу замены
    if (filters.replacementType) {
      filtered = filtered.filter(
        (setting) => setting.replacementType === filters.replacementType
      );
    }

    // Фильтр по категории
    if (filters.category.trim()) {
      filtered = filtered.filter((setting) =>
        setting.serviceCategory
          .toLowerCase()
          .includes(filters.category.toLowerCase())
      );
    }

    setFilteredSettings(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      serviceName: "",
      replacementType: null,
      category: "",
    });
  };

  // Получить статистику по типам замены
  const getTypeStats = () => {
    const stats = {
      total: settings.length,
      manual: settings.filter((s) => s.replacementType === "manual").length,
      auto: settings.filter((s) => s.replacementType === "auto").length,
    };
    return stats;
  };

  const typeStats = getTypeStats();

  // Получить уникальные категории для фильтра
  const getUniqueCategories = () => {
    const categories = settings.map((s) => s.serviceCategory);
    return [...new Set(categories)].filter(Boolean).sort();
  };

  const uniqueCategories = getUniqueCategories();

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
      width: "35%",
    },
    {
      title: "Категория",
      dataIndex: "serviceCategory",
      key: "serviceCategory",
      sorter: (a, b) => a.serviceCategory.localeCompare(b.serviceCategory),
      width: "25%",
      render: (category) => (
        <Tag color="blue">{category || "Без категории"}</Tag>
      ),
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
      width: "20%",
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
      width: "20%",
    },
  ];

  return (
    <Card title="Настройки замены материалов">
      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card
            size="small"
            style={{
              textAlign: "center",
              backgroundColor:
                filters.replacementType === null ? "#e6f7ff" : "#f0f9ff",
              cursor: "pointer",
              border:
                filters.replacementType === null
                  ? "2px solid #1890ff"
                  : "1px solid #d9d9d9",
            }}
            onClick={() => handleFilterChange("replacementType", null)}
            hoverable
          >
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#1890ff" }}>
              {typeStats.total}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>Всего услуг</div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            size="small"
            style={{
              textAlign: "center",
              backgroundColor:
                filters.replacementType === "manual" ? "#ffe7ba" : "#fff7e6",
              cursor: "pointer",
              border:
                filters.replacementType === "manual"
                  ? "2px solid #fa8c16"
                  : "1px solid #d9d9d9",
            }}
            onClick={() => handleFilterChange("replacementType", "manual")}
            hoverable
          >
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#fa8c16" }}>
              {typeStats.manual}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>Ручная замена</div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            size="small"
            style={{
              textAlign: "center",
              backgroundColor:
                filters.replacementType === "auto" ? "#d9f7be" : "#f6ffed",
              cursor: "pointer",
              border:
                filters.replacementType === "auto"
                  ? "2px solid #52c41a"
                  : "1px solid #d9d9d9",
            }}
            onClick={() => handleFilterChange("replacementType", "auto")}
            hoverable
          >
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#52c41a" }}>
              {typeStats.auto}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>Авто-замена</div>
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
          <Col xs={24} sm={12} md={8}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                Название услуги:
              </label>
              <Input
                placeholder="Поиск по названию"
                value={filters.serviceName}
                onChange={(e) =>
                  handleFilterChange("serviceName", e.target.value)
                }
                prefix={<SearchOutlined />}
                size="small"
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                Тип замены:
              </label>
              <Select
                placeholder="Все типы"
                style={{ width: "100%" }}
                value={filters.replacementType}
                onChange={(value) =>
                  handleFilterChange("replacementType", value)
                }
                allowClear
                size="small"
              >
                <Option value="manual">Ручная замена</Option>
                <Option value="auto">Авто-замена</Option>
              </Select>
            </div>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                Категория:
              </label>
              <Select
                placeholder="Все категории"
                style={{ width: "100%" }}
                value={filters.category || undefined}
                onChange={(value) =>
                  handleFilterChange("category", value || "")
                }
                allowClear
                size="small"
                showSearch
                optionFilterProp="children"
              >
                {uniqueCategories.map((category) => (
                  <Option key={category} value={category}>
                    {category}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
          <strong>
            Найдено записей: {filteredSettings.length} из {settings.length}
          </strong>
        </div>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredSettings}
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
