import {
  FaEdit,
  FaTrash,
  FaUpload,
  FaBoxOpen,
  FaDollarSign,
} from "react-icons/fa";
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
  Upload,
  Card,
  Row,
  Col,
  Statistic,
  Divider,
  Tooltip,
} from "antd";
import { apiFetch } from "../../../lib/api";

const categories = [
  "Игры",
  "Программное обеспечение",
  "Образование",
  "Развлечения",
  "Услуги",
  "Другое",
  "Музыка",
  "Видео и кино",
  "Социальные сети",
  "Облако и хостинг",
  "Безопасность",
  "VPN и прокси",
  "Дизайн и графика",
  "Разработка",
  "Фриланс",
  "Путешествия и билеты",
  "Электронные книги",
  "Новости и СМИ",
  "Почта и коммуникации",
  "Финансы и банки",
  "Онлайн-магазины",
  "Здоровье и спорт",
  "Авто и транспорт",
  "Дом и быт",
  "Для бизнеса",
  "Подарочные карты",
  "Мобильные приложения",
  "Фото и видео",
  "Технологии",
  "Криптовалюты",
  "Маркетинг",
  "Общение и знакомства",
];

export function ServicesTable({
  refresh,
  onChange,
  search = "",
  statusFilter = "",
  categoryFilter = "",
}) {
  const [services, setServices] = useState([]);
  const [executers, setExecuters] = useState([]);
  const [editForm, setEditForm] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [apiModal, setApiModal] = useState(false);
  const [manualModal, setManualModal] = useState(false);
  const [materialsModal, setMaterialsModal] = useState(false);
  const [pricingModal, setPricingModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceMaterials, setServiceMaterials] = useState([]);
  const [materialStats, setMaterialStats] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [manualInput, setManualInput] = useState("");
  const [apiConfig, setApiConfig] = useState({
    url: "",
    headers: "",
    method: "GET",
  });
  const [selectedExecuters, setSelectedExecuters] = useState([]);
  const [executerPrices, setExecuterPrices] = useState([]);
  const [form, setForm] = useState({
    id: null,
    name: "",
    category: "",
    status: "",
    price: 0,
  });

  useEffect(() => {
    fetchServices();
    fetchExecuters();
  }, [refresh]);

  async function fetchServices() {
    try {
      const data = await apiFetch("/api/admin/services/get");
      setServices(data);
    } catch (error) {
      console.error("Ошибка загрузки услуг:", error);
    }
  }

  async function fetchExecuters() {
    try {
      const data = await apiFetch("/api/admin/executers/get");
      setExecuters(data);
    } catch (error) {
      console.error("Ошибка загрузки исполнителей:", error);
    }
  }

  async function handleDelete(id) {
    await apiFetch(`/api/admin/services/delete/${id}`, { method: "DELETE" });
    fetchServices();
    if (onChange) onChange();
    message.success("Услуга удалена");
  }

  function openEditModal(service) {
    setForm({
      id: service.id,
      name: service.name,
      category: service.category,
      status: service.status,
      price: service.price || 0,
    });

    // Загружаем текущих исполнителей услуги
    let currentExecuters = [];

    // Сначала проверяем прямое назначение через executer_id
    if (service.assignedExecuter) {
      currentExecuters.push(service.assignedExecuter.id);
    }

    // Затем добавляем исполнителей из ServiceAccess (если есть)
    const serviceAccessExecuters = (service.assigned_executers || []).map(
      (ex) => ex.executer_id
    );
    currentExecuters = [
      ...new Set([...currentExecuters, ...serviceAccessExecuters]),
    ]; // убираем дубликаты

    setSelectedExecuters(currentExecuters);
    setEditForm(true);
  }

  function handleChange(name, value) {
    setForm({ ...form, [name]: value });
  }

  async function handleEditSubmit() {
    try {
      // Определяем основного исполнителя (первый в списке) для прямого назначения
      const primaryExecuterId =
        selectedExecuters.length > 0 ? selectedExecuters[0] : null;

      // Обновляем данные услуги включая executer_id
      await apiFetch(`/api/admin/services/update/${form.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          status: form.status,
          price: parseFloat(form.price) || 0,
          executer_id: primaryExecuterId,
        }),
      });

      // Обновляем назначенных исполнителей через ServiceAccess (для множественного назначения)
      if (selectedExecuters.length > 0) {
        await apiFetch(`/api/admin/services/${form.id}/executers`, {
          method: "POST",
          body: JSON.stringify({ executerIds: selectedExecuters }),
        });
      }

      setEditForm(false);
      setSelectedExecuters([]);
      fetchServices();
      if (onChange) onChange();
      message.success("Услуга обновлена");
    } catch (error) {
      console.error("Ошибка обновления услуги:", error);
      message.error("Ошибка при обновлении услуги");
    }
  }

  // Функция для открытия модального окна загрузки расходников
  function openUploadModal(service) {
    setSelectedService(service);

    // Определяем какое окно открыть в зависимости от способа загрузки услуги
    const loadingMethod = service.loadingMethod || "file"; // по умолчанию файл

    switch (loadingMethod) {
      case "file":
        setUploadModal(true);
        setFileList([]);
        break;
      case "api":
        setApiModal(true);
        setApiConfig({ url: "", headers: "", method: "GET" });
        break;
      case "manual":
      default:
        setManualModal(true);
        setManualInput("");
        break;
    }
  }

  // Функция для открытия модального окна с материалами
  async function openMaterialsModal(service) {
    setSelectedService(service);
    setMaterialsModal(true);

    try {
      // Загружаем материалы и статистику параллельно
      try {
        const [materials, stats] = await Promise.all([
          apiFetch(`/api/admin/materials/service/${service.id}`),
          apiFetch(`/api/admin/materials/service/${service.id}/stats`),
        ]);
        setServiceMaterials(materials);
        setMaterialStats(stats);
      } catch (err) {
        message.error("Ошибка при загрузке материалов");
        setServiceMaterials([]);
        setMaterialStats(null);
      }
    } catch (error) {
      message.error("Ошибка при загрузке материалов");
      setServiceMaterials([]);
      setMaterialStats(null);
    }
  }

  // Функция для открытия модального окна ценообразования
  async function openPricingModal(service) {
    setSelectedService(service);
    setPricingModal(true);

    try {
      // Загружаем текущие индивидуальные цены для всех исполнителей
      const allPricing = await apiFetch("/api/admin/pricing/all");
      // Фильтруем только цены для текущей услуги
      const servicePricing = allPricing.filter(
        (p) => p.service_id === service.id
      );

      // Создаем массив с ценами для всех исполнителей
      const prices = executers.map((executer) => {
        const existingPrice = servicePricing.find(
          (p) => p.executer_id === executer.id
        );
        return {
          executer_id: executer.id,
          executer_name: executer.name,
          service_id: service.id,
          custom_price: existingPrice
            ? existingPrice.custom_price
            : service.price,
          has_custom_price: !!existingPrice,
          pricing_id: existingPrice ? existingPrice.id : null,
        };
      });

      setExecuterPrices(prices);
    } catch (error) {
      console.error("Ошибка при загрузке цен:", error);
      message.error("Ошибка при загрузке данных о ценах");
    }
  }

  // Функция загрузки расходников из файла
  const handleFileUpload = async (options) => {
    const { file } = options;

    if (!selectedService) {
      message.error("Услуга не выбрана");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("service_id", selectedService.id);

    try {
      try {
        const result = await apiFetch("/api/admin/materials/upload", {
          method: "POST",
          body: formData,
        });
        message.success(`Загружено ${result.count || 0} расходников`);
        setUploadModal(false);
        fetchServices();
        if (onChange) onChange();
      } catch (err) {
        message.error("Ошибка при загрузке файла");
      }
    } catch (error) {
      message.error("Ошибка при загрузке файла");
    }
  };

  // Функция добавления расходника вручную
  const handleManualAdd = async () => {
    if (!manualInput.trim() || !selectedService) {
      message.error("Введите содержимое расходника");
      return;
    }

    // Split by new lines - each line is one material
    const lines = manualInput
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      message.error("Нет корректных строк для добавления");
      return;
    }

    try {
      const added = [];
      for (const content of lines) {
        try {
          const res = await apiFetch("/api/admin/materials/add-single", {
            method: "POST",
            body: JSON.stringify({
              service_id: selectedService.id,
              contents: content,
              type_key: "manual",
            }),
          });
          added.push(res.material || res);
        } catch (err) {
          console.warn("Failed to add material line", content, err);
        }
      }

      message.success(`Добавлено ${added.length} расходников`);
      setManualInput("");
      setUploadModal(false);
      fetchServices();
      if (onChange) onChange();
    } catch (error) {
      message.error("Ошибка при добавлении расходников");
    }
  };

  // Фильтрация перед отображением
  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) &&
      (statusFilter ? s.status === statusFilter : true) &&
      (categoryFilter ? s.category === categoryFilter : true)
  );

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

  // Функция для сохранения индивидуальных цен
  async function handleSavePricing() {
    try {
      for (const price of executerPrices) {
        if (
          price.has_custom_price &&
          price.custom_price !== selectedService.price
        ) {
          // Если есть индивидуальная цена и она отличается от базовой
          if (price.pricing_id) {
            // Обновляем существующую цену
            await apiFetch(`/api/admin/pricing/update/${price.pricing_id}`, {
              method: "PUT",
              body: JSON.stringify({
                custom_price: parseFloat(price.custom_price),
              }),
            });
          } else {
            // Создаем новую индивидуальную цену
            await apiFetch("/api/admin/pricing/add", {
              method: "POST",
              body: JSON.stringify({
                executer_id: price.executer_id,
                service_id: price.service_id,
                custom_price: parseFloat(price.custom_price),
              }),
            });
          }
        } else if (!price.has_custom_price && price.pricing_id) {
          // Если убрали индивидуальную цену, удаляем запись
          await apiFetch(`/api/admin/pricing/delete/${price.pricing_id}`, {
            method: "DELETE",
          });
        }
      }

      setPricingModal(false);
      message.success("Индивидуальные цены сохранены");
      fetchServices();
      if (onChange) onChange();
    } catch (error) {
      console.error("Ошибка при сохранении цен:", error);
      message.error("Ошибка при сохранении индивидуальных цен");
    }
  }

  // Функция для изменения цены исполнителя
  function handlePriceChange(executerId, newPrice, hasCustomPrice) {
    setExecuterPrices((prices) =>
      prices.map((price) =>
        price.executer_id === executerId
          ? {
              ...price,
              custom_price: newPrice,
              has_custom_price: hasCustomPrice,
            }
          : price
      )
    );
  }

  const columns = [
    {
      title: "Название услуги",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Категория",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Расходники",
      key: "materials",
      render: (_, record) => (
        <Button
          size="small"
          onClick={() => openMaterialsModal(record)}
          icon={<FaBoxOpen />}
        >
          Посмотреть ключи
        </Button>
      ),
    },
    {
      title: "Цена",
      dataIndex: "price",
      key: "price",
      width: 160,
      render: (price, record) => {
        const basePrice = `₽${price || 0}`;
        const customPricing = record.custom_pricing || [];

        if (customPricing.length === 0) {
          return <div>{basePrice}</div>;
        }

        const tooltipContent = (
          <div>
            <div style={{ marginBottom: 8, fontWeight: "bold" }}>
              Базовая цена: {basePrice}
            </div>
            <div style={{ fontWeight: "bold", marginBottom: 4 }}>
              Индивидуальные цены:
            </div>
            {customPricing.map((pricing, index) => (
              <div key={index}>
                • {pricing.executer_name}: ₽{pricing.custom_price}
              </div>
            ))}
          </div>
        );

        return (
          <Tooltip title={tooltipContent} placement="topLeft">
            <div style={{ cursor: "pointer" }}>
              <div style={{ fontWeight: "bold" }}>{basePrice}</div>
              <div style={{ fontSize: "11px", color: "#1890ff" }}>
                +{customPricing.length} исключ.
              </div>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Исполнители",
      key: "executers",
      width: 200,
      render: (_, record) => {
        // Проверяем прямое назначение через executer_id
        const directExecuter = record.assignedExecuter;

        // Проверяем назначение через ServiceAccess (старая система)
        const assignedExecuters = record.assigned_executers || [];

        // Если есть прямое назначение
        if (directExecuter) {
          return (
            <Tag
              color={directExecuter.status === "active" ? "green" : "orange"}
            >
              {directExecuter.name || `ID: ${directExecuter.id}`}
              {directExecuter.telegram_id && ` (${directExecuter.telegram_id})`}
            </Tag>
          );
        }

        // Если есть назначения через ServiceAccess
        if (assignedExecuters.length > 0) {
          if (assignedExecuters.length === 1) {
            const executer = assignedExecuters[0];
            return (
              <Tag color={executer.status === "active" ? "green" : "orange"}>
                {executer.executer_name}
              </Tag>
            );
          }

          return (
            <Tooltip
              title={
                <div>
                  {assignedExecuters.map((executer, index) => (
                    <div key={index}>
                      • {executer.executer_name} (
                      {executer.status === "active" ? "Активен" : "Неактивен"})
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

        // Если никого не назначено
        return <Tag color="default">Не назначены</Tag>;
      },
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={
            status === "active"
              ? "green"
              : status === "inactive"
              ? "orange"
              : status === "ОЖИДАЕТ"
              ? "default"
              : status === "ЗАВЕРШЕНА"
              ? "blue"
              : "default"
          }
        >
          {status === "active"
            ? "АКТИВНА"
            : status === "inactive"
            ? "НЕАКТИВНА"
            : status}
        </Tag>
      ),
    },
    {
      title: "Номера заказов",
      dataIndex: "active_orders",
      key: "active_orders",
      width: 200,
      render: (active_orders, record) => {
        // Если нет активных заказов
        if (!active_orders || active_orders.length === 0) {
          return <Tag color="default">Нет заказов</Tag>;
        }

        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {active_orders.map((order, index) => (
              <Tooltip
                key={`${order.order_number}-${index}`}
                title={`Исполнитель: ${
                  order.executer_name || "Неизвестный"
                }\nНомер заказа: ${order.order_number}`}
                placement="top"
              >
                <Tag
                  color="blue"
                  style={{
                    cursor: "pointer",
                    margin: "2px",
                    fontSize: "12px",
                  }}
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
      title: "Действия",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<FaUpload />}
            onClick={() => openUploadModal(record)}
            size="small"
            type="primary"
            ghost
            title="Загрузить расходники"
          />
          <Button
            icon={<FaDollarSign />}
            onClick={() => openPricingModal(record)}
            size="small"
            style={{
              backgroundColor: "#52c41a",
              borderColor: "#52c41a",
              color: "white",
            }}
            title="Индивидуальные цены"
          />
          <Button
            icon={<FaEdit />}
            onClick={() => openEditModal(record)}
            size="small"
          />
          <Popconfirm
            title="Удалить услугу?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button icon={<FaTrash />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <Table
        columns={columns}
        dataSource={filteredServices}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        bordered
      />
      <Modal
        open={editForm}
        title="Редактировать услугу"
        onCancel={() => setEditForm(false)}
        onOk={handleEditSubmit}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Input
          name="name"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Название услуги"
          style={{ marginBottom: 16 }}
        />
        <Select
          name="category"
          value={form.category || undefined}
          onChange={(value) => handleChange("category", value)}
          placeholder="Выберите категорию"
          className="w-full"
          style={{ marginBottom: 16 }}
        >
          {categories.map((cat) => (
            <Select.Option key={cat} value={cat}>
              {cat}
            </Select.Option>
          ))}
        </Select>
        <Input
          name="price"
          type="number"
          min={0}
          step={0.01}
          value={form.price}
          onChange={(e) => handleChange("price", e.target.value)}
          placeholder="Цена услуги (₽)"
          style={{ marginBottom: 16 }}
        />
        <Select
          name="status"
          value={form.status || undefined}
          onChange={(value) => handleChange("status", value)}
          placeholder="Выберите статус"
          className="w-full"
          style={{ marginBottom: 16 }}
        >
          <Select.Option value="active">АКТИВНА</Select.Option>
          <Select.Option value="inactive">НЕАКТИВНА</Select.Option>
        </Select>
        <Select
          mode="multiple"
          value={selectedExecuters}
          onChange={setSelectedExecuters}
          placeholder="Выберите исполнителей"
          className="w-full"
          style={{ marginBottom: 8 }}
          showSearch
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
        >
          {executers.map((executer) => (
            <Select.Option key={executer.id} value={executer.id}>
              {executer.name || `ID: ${executer.id}`}
              {executer.telegram_id && ` (${executer.telegram_id})`}
            </Select.Option>
          ))}
        </Select>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <Button
            size="small"
            onClick={() => setSelectedExecuters(executers.map((e) => e.id))}
          >
            Добавить всех
          </Button>
          <Button size="small" onClick={() => setSelectedExecuters([])}>
            Снять всех
          </Button>
        </div>
      </Modal>

      {/* Модальное окно загрузки расходников */}
      <Modal
        open={uploadModal}
        title={`Загрузить расходники для "${selectedService?.name}"`}
        onCancel={() => setUploadModal(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 24 }}>
          <h4>Загрузить из файла (.csv, .xlsx, .txt)</h4>
          <p style={{ color: "#666", marginBottom: 16 }}>
            Каждая строка файла = один расходник (ключ, код и т.д.)
          </p>
          <Upload.Dragger
            customRequest={handleFileUpload}
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            accept=".csv,.xlsx,.txt"
            maxCount={1}
          >
            <p className="ant-upload-drag-icon">📁</p>
            <p className="ant-upload-text">Нажмите или перетащите файл сюда</p>
            <p className="ant-upload-hint">
              Поддерживаются файлы .csv, .xlsx, .txt
            </p>
          </Upload.Dragger>
        </div>

        <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 24 }}>
          <h4>Или добавить вручную</h4>
          <Input.TextArea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Введите содержимое расходника (ключ, код и т.д.)"
            rows={3}
            style={{ marginBottom: 16 }}
          />
          <Button
            type="primary"
            onClick={handleManualAdd}
            disabled={!manualInput.trim()}
          >
            Добавить расходник
          </Button>
        </div>
      </Modal>

      {/* Модальное окно просмотра материалов */}
      <Modal
        open={materialsModal}
        title={`Расходники для "${selectedService?.name}"`}
        onCancel={() => {
          setMaterialsModal(false);
          setMaterialStats(null);
        }}
        footer={null}
        width={1400}
      >
        {/* Статистика материалов */}
        {materialStats && (
          <div style={{ marginBottom: 24 }}>
            <Card>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="Всего материалов"
                    value={materialStats.stats.total}
                    valueStyle={{ color: "#1890ff" }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Доступно"
                    value={materialStats.stats.available}
                    valueStyle={{ color: "#52c41a" }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Использовано"
                    value={materialStats.stats.used}
                    valueStyle={{ color: "#ff4d4f" }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="На замене"
                    value={materialStats.stats.pending_replace}
                    valueStyle={{ color: "#faad14" }}
                  />
                </Col>
              </Row>
            </Card>
          </div>
        )}

        {/* Таблица материалов */}
        {serviceMaterials.length > 0 ? (
          <Table
            dataSource={serviceMaterials}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
            columns={[
              {
                title: "ID",
                dataIndex: "id",
                key: "id",
                width: 60,
              },
              {
                title: "Содержимое (Ключ/Код)",
                dataIndex: "contents",
                key: "contents",
                ellipsis: true,
              },
              {
                title: "Статус",
                dataIndex: "status",
                key: "status",
                width: 120,
                render: (status) => {
                  const statusColors = {
                    available: "green",
                    used: "red",
                    pending_replace: "orange",
                    replaced: "gray",
                  };
                  const statusTexts = {
                    available: "Доступен",
                    used: "Использован",
                    pending_replace: "На замене",
                    replaced: "Использован",
                  };
                  return (
                    <Tag color={statusColors[status] || "default"}>
                      {statusTexts[status] || status}
                    </Tag>
                  );
                },
              },
              {
                title: "Источник",
                dataIndex: "source",
                key: "source",
                width: 120,
                render: (source) => getSourceLabel(source),
              },
              {
                title: "Дата добавления",
                dataIndex: "added_date",
                key: "added_date",
                width: 120,
                render: (date) =>
                  date ? new Date(date).toLocaleDateString("ru-RU") : "-",
              },
              {
                title: "Дата использования",
                dataIndex: "used_date",
                key: "used_date",
                width: 140,
                render: (date, record) => {
                  if (
                    record.status === "used" ||
                    record.status === "replaced" ||
                    record.status === "pending_replace"
                  ) {
                    return date
                      ? new Date(date).toLocaleString("ru-RU", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-";
                  }
                  return "-";
                },
              },
              {
                title: "Дата запроса замены",
                dataIndex: "replacement_requested_date",
                key: "replacement_requested_date",
                width: 150,
                render: (date, record) => {
                  if (record.status === "pending_replace") {
                    return date
                      ? new Date(date).toLocaleString("ru-RU", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-";
                  }
                  return "-";
                },
              },
            ]}
          />
        ) : (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p>Нет расходников для этой услуги</p>
            <Button
              type="primary"
              onClick={() => {
                setMaterialsModal(false);
                openUploadModal(selectedService);
              }}
            >
              Добавить расходники
            </Button>
          </div>
        )}
      </Modal>

      {/* Модальное окно для API загрузки */}
      <Modal
        open={apiModal}
        title={`Настройка API для "${selectedService?.name}"`}
        onCancel={() => setApiModal(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 24 }}>
          <h4>Настройки API</h4>
          <p style={{ color: "#666", marginBottom: 16 }}>
            Настройте API для автоматической загрузки расходников
          </p>

          <div style={{ marginBottom: 16 }}>
            <label>URL API:</label>
            <Input
              value={apiConfig.url}
              onChange={(e) =>
                setApiConfig({ ...apiConfig, url: e.target.value })
              }
              placeholder="https://api.example.com/materials"
              style={{ marginTop: 8 }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Метод:</label>
            <Select
              value={apiConfig.method}
              onChange={(value) =>
                setApiConfig({ ...apiConfig, method: value })
              }
              style={{ width: "100%", marginTop: 8 }}
            >
              <Select.Option value="GET">GET</Select.Option>
              <Select.Option value="POST">POST</Select.Option>
            </Select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Заголовки (JSON):</label>
            <Input.TextArea
              value={apiConfig.headers}
              onChange={(e) =>
                setApiConfig({ ...apiConfig, headers: e.target.value })
              }
              placeholder='{"Authorization": "Bearer your-token", "Content-Type": "application/json"}'
              rows={3}
              style={{ marginTop: 8 }}
            />
          </div>

          <Button
            type="primary"
            onClick={() => {
              message.info("API настройка сохранена (функция в разработке)");
              setApiModal(false);
            }}
          >
            Сохранить настройки API
          </Button>
        </div>
      </Modal>

      {/* Модальное окно для ручного ввода */}
      <Modal
        open={manualModal}
        title={`Добавить расходники для "${selectedService?.name}"`}
        onCancel={() => setManualModal(false)}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: 24 }}>
          <h4>Ручное добавление</h4>
          <p style={{ color: "#666", marginBottom: 16 }}>
            Введите содержимое расходника (ключ, код и т.д.)
          </p>
          <Input.TextArea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Введите содержимое расходника (ключ, код и т.д.)"
            rows={4}
            style={{ marginBottom: 16 }}
          />
          <Button
            type="primary"
            onClick={handleManualAdd}
            disabled={!manualInput.trim()}
            block
          >
            Добавить расходник
          </Button>
        </div>
      </Modal>

      {/* Модальное окно для управления индивидуальными ценами */}
      <Modal
        open={pricingModal}
        title={`Индивидуальные цены для "${selectedService?.name}"`}
        onCancel={() => setPricingModal(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setPricingModal(false)}>
            Отмена
          </Button>,
          <Button key="save" type="primary" onClick={handleSavePricing}>
            Сохранить цены
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#f0f9ff",
              border: "1px solid #bae6fd",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                color: "#0369a1",
                marginBottom: "4px",
              }}
            >
              Базовая цена услуги: ₽{selectedService?.price || 0}
            </div>
            <div style={{ color: "#0369a1", fontSize: "14px" }}>
              Установите индивидуальные цены для каждого исполнителя или
              оставьте базовую цену
            </div>
          </div>

          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {executerPrices.map((price, index) => (
              <div
                key={price.executer_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  backgroundColor: index % 2 === 0 ? "#fafafa" : "white",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  border: "1px solid #f0f0f0",
                }}
              >
                <div style={{ flex: 1, fontWeight: "500" }}>
                  {price.executer_name}
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div style={{ fontSize: "14px", color: "#666" }}>
                    Базовая: ₽{selectedService?.price || 0}
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>→</div>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={price.custom_price}
                    onChange={(e) =>
                      handlePriceChange(
                        price.executer_id,
                        e.target.value,
                        parseFloat(e.target.value) !== selectedService?.price
                      )
                    }
                    style={{ width: "120px" }}
                    prefix="₽"
                  />
                  <div
                    style={{
                      fontSize: "12px",
                      color:
                        price.has_custom_price &&
                        price.custom_price !== selectedService?.price
                          ? "#52c41a"
                          : "#666",
                      fontWeight:
                        price.has_custom_price &&
                        price.custom_price !== selectedService?.price
                          ? "bold"
                          : "normal",
                      minWidth: "80px",
                    }}
                  >
                    {price.has_custom_price &&
                    price.custom_price !== selectedService?.price
                      ? "Индивид."
                      : "Базовая"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
