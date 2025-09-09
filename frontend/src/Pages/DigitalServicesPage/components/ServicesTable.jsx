import {
  FaEdit,
  FaTrash,
  FaUpload,
  FaBoxOpen,
  FaDollarSign,
  FaArchive,
  FaUndo,
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
  const [showDeleted, setShowDeleted] = useState(false); // Новое состояние для показа архивных услуг
  const [form, setForm] = useState({
    id: null,
    name: "",
    category: "",
    price: 0,
  });

  useEffect(() => {
    fetchServices();
    fetchExecuters();

    // Логгирование для отладки автообновления статусов
    console.log(
      `🔄 ServicesTable: Обновление данных услуг и исполнителей (время: ${new Date().toLocaleTimeString()})`
    );
  }, [refresh, showDeleted]);

  async function fetchServices() {
    try {
      const url = showDeleted
        ? "/api/admin/services/get?includeDeleted=true"
        : "/api/admin/services/get";
      const data = await apiFetch(url);

      // Логгируем статусы исполнителей для отладки
      console.log(`📋 Получены данные услуг: ${data?.length || 0} записей`);

      if (Array.isArray(data)) {
        data.forEach((service) => {
          if (
            service.executer_statuses &&
            service.executer_statuses.length > 0
          ) {
            console.log(`🏢 Услуга "${service.name}" - статусы исполнителей:`);
            service.executer_statuses.forEach((executerStatus) => {
              console.log(
                `  👤 ${executerStatus.executer_name} (${executerStatus.telegram_id}): ` +
                  `статус исполнителя = ${executerStatus.executer_status}, ` +
                  `онлайн в боте = ${executerStatus.executer_is_bot_active}, ` +
                  `статус услуги = ${executerStatus.service_status}`
              );
            });
          }
        });
      }

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
    message.success("Услуга перемещена в архив");
  }

  async function handlePermanentDelete(id) {
    try {
      await apiFetch(`/api/admin/services/permanent-delete/${id}`, {
        method: "DELETE",
      });
      fetchServices();
      if (onChange) onChange();
      message.success("Услуга полностью удалена");
    } catch (error) {
      console.error("Ошибка при удалении услуги:", error);
      message.error("Ошибка при удалении услуги");
    }
  }

  async function handleRestore(id) {
    try {
      await apiFetch(`/api/admin/services/restore/${id}`, { method: "POST" });
      fetchServices();
      if (onChange) onChange();
      message.success("Услуга восстановлена из архива");
    } catch (error) {
      console.error("Ошибка при восстановлении услуги:", error);
      message.error("Ошибка при восстановлении услуги");
    }
  }

  function openEditModal(service) {
    setForm({
      id: service.id,
      name: service.name,
      category: service.category,
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

        // Логируем полученные данные для отладки
        console.log(
          `📦 Загружены материалы для услуги "${service.name}":`,
          materials
        );
        if (materials.length > 0) {
          console.log(`📋 Первый материал:`, {
            id: materials[0].id,
            status: materials[0].status,
            used_date: materials[0].used_date,
            replacement_requested_date: materials[0].replacement_requested_date,
            contents: materials[0].contents,
          });
        }

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

  // Функция для открытия модального окна загрузки расходников
  function openUploadModal(service) {
    setSelectedService(service);
    setUploadModal(true);
    setFileList([]);
    setManualInput("");
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
      // notify other components (materials list) to refresh
      try {
        window.dispatchEvent(new Event("materials:changed"));
      } catch (e) {}
      fetchServices();
      if (onChange) onChange();
    } catch (error) {
      message.error("Ошибка при добавлении расходников");
    }
  };

  // Фильтрация перед отображением
  const filteredServices = services.filter((s) => {
    // Фильтр по архивности - если showDeleted=true, показываем только архивные, иначе только активные
    const archiveFilter = showDeleted ? s.is_deleted : !s.is_deleted;

    return (
      archiveFilter &&
      s.name.toLowerCase().includes(search.toLowerCase()) &&
      (statusFilter ? s.status === statusFilter : true) &&
      (categoryFilter ? s.category === categoryFilter : true)
    );
  });

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

  // Функция для удаления материала
  async function handleDeleteMaterial(materialId) {
    try {
      await apiFetch(`/api/admin/materials/delete/${materialId}`, {
        method: "DELETE",
      });

      // Обновляем список материалов
      const materials = await apiFetch(
        `/api/admin/materials/service/${selectedService.id}`
      );
      setServiceMaterials(materials);

      // Обновляем статистику
      const stats = await apiFetch(
        `/api/admin/materials/service/${selectedService.id}/stats`
      );
      setMaterialStats(stats);

      // Обновляем общий список услуг (для обновления счетчиков)
      fetchServices();
      if (onChange) onChange();

      message.success("Материал успешно удален");
    } catch (error) {
      console.error("Ошибка при удалении материала:", error);
      message.error("Ошибка при удалении материала");
    }
  }

  const columns = [
    {
      title: "Название услуги",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <div>
          {record.is_deleted && (
            <div
              style={{
                fontSize: "11px",
                color: "#ff4d4f",
                fontWeight: "bold",
                marginBottom: "2px",
              }}
            >
              🗃️ АРХИВ
            </div>
          )}
          <div
            style={{
              color: record.is_deleted ? "#8c8c8c" : "inherit",
              fontWeight: record.is_deleted ? "normal" : "500",
            }}
          >
            {record.is_deleted && record.archived_name
              ? record.archived_name
              : name}
          </div>
        </div>
      ),
    },
    {
      title: "Категория",
      dataIndex: "category",
      key: "category",
      render: (category, record) => (
        <div
          style={{
            color: record.is_deleted ? "#8c8c8c" : "inherit",
          }}
        >
          {record.is_deleted && record.archived_category
            ? record.archived_category
            : category}
        </div>
      ),
    },
    {
      title: "Расходники",
      key: "materials",
      render: (_, record) => (
        <Button
          size="small"
          onClick={() => openMaterialsModal(record)}
          icon={<FaBoxOpen />}
          type="primary"
          ghost
        >
          Управление ключами
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
        // Используем новую систему индивидуального статуса для каждого исполнителя
        const executerStatuses = record.executer_statuses || [];

        // 🆕 ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ ВХОДЯЩИХ ДАННЫХ
        console.log(`\n🔍 === РЕНДЕР КОЛОНКИ ИСПОЛНИТЕЛИ ===`);
        console.log(`📋 Услуга: "${record.name}" (ID: ${record.id})`);
        console.log(`👥 Количество исполнителей: ${executerStatuses.length}`);
        console.log(`📊 Полные данные executerStatuses:`, executerStatuses);

        // Если нет назначенных исполнителей
        if (executerStatuses.length === 0) {
          console.log(
            `❌ Нет назначенных исполнителей для услуги "${record.name}"`
          );
          return <Tag color="default">Не назначены</Tag>;
        }

        // Определяем эмодзи и цвета для статуса исполнителя (онлайн/офлайн/заблокирован)
        const getExecuterStatusEmoji = (executerStatus, isBotActive) => {
          console.log(
            `🎯 getExecuterStatusEmoji: статус="${executerStatus}", онлайн="${isBotActive}"`
          );

          // Если заблокирован - всегда красный, независимо от активности в боте
          if (executerStatus === "blocked") {
            return "🔴"; // заблокирован
          }

          // Онлайн только если реально активен в боте
          if (isBotActive === true) {
            return "🟢"; // онлайн (реально активен в боте)
          }

          // Во всех остальных случаях - офлайн
          return "🟠"; // офлайн
        };

        // Определяем текст и цвет для статуса услуги
        const getServiceStatusDisplay = (serviceStatus) => {
          console.log(
            `🎯 getServiceStatusDisplay: получен статус услуги = "${serviceStatus}"`
          );

          switch (serviceStatus) {
            case "inactive":
              console.log(`📊 Статус услуги: inactive → НЕ АКТИВЕН (orange)`);
              return { color: "orange", text: "НЕ АКТИВЕН" };
            case "active":
              console.log(`📊 Статус услуги: active → АКТИВЕН (green)`);
              return { color: "green", text: "АКТИВЕН" };
            case "completed":
              console.log(`📊 Статус услуги: completed → ВЫПОЛНЕНА (blue)`);
              return { color: "blue", text: "ВЫПОЛНЕНА" };
            default:
              console.log(
                `📊 Статус услуги: unknown/undefined (${serviceStatus}) → НЕИЗВЕСТНО (default)`
              );
              return { color: "default", text: "НЕИЗВЕСТНО" };
          }
        };

        // Если один исполнитель
        if (executerStatuses.length === 1) {
          const executerStatus = executerStatuses[0];

          console.log(`👤 Рендерим одного исполнителя:`, {
            executer_name: executerStatus.executer_name,
            telegram_id: executerStatus.telegram_id,
            executer_status: executerStatus.executer_status,
            executer_is_bot_active: executerStatus.executer_is_bot_active,
            service_status: executerStatus.service_status,
          });

          const executerEmoji = getExecuterStatusEmoji(
            executerStatus.executer_status,
            executerStatus.executer_is_bot_active
          );
          const serviceDisplay = getServiceStatusDisplay(
            executerStatus.service_status
          );

          return (
            <Tag color={serviceDisplay.color}>
              {executerEmoji} {executerStatus.executer_name}
              {executerStatus.telegram_id &&
                `(${executerStatus.telegram_id})`}{" "}
              - {serviceDisplay.text}
            </Tag>
          );
        }

        // Если несколько исполнителей - показываем каждого со своим статусом
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {executerStatuses.map((executerStatus, index) => {
              console.log(`👥 Рендерим исполнителя ${index + 1}:`, {
                executer_name: executerStatus.executer_name,
                telegram_id: executerStatus.telegram_id,
                executer_status: executerStatus.executer_status,
                executer_is_bot_active: executerStatus.executer_is_bot_active,
                service_status: executerStatus.service_status,
              });

              const executerEmoji = getExecuterStatusEmoji(
                executerStatus.executer_status,
                executerStatus.executer_is_bot_active
              );
              const serviceDisplay = getServiceStatusDisplay(
                executerStatus.service_status
              );

              return (
                <Tag
                  key={executerStatus.executer_id || index}
                  color={serviceDisplay.color}
                  style={{ margin: "2px" }}
                >
                  {executerEmoji} {executerStatus.executer_name}
                  {executerStatus.telegram_id &&
                    `(${executerStatus.telegram_id})`}{" "}
                  - {serviceDisplay.text}
                </Tag>
              );
            })}
          </div>
        );
      },
    },
    {
      title: "Номера заказов",
      dataIndex: "active_orders",
      key: "active_orders",
      width: 200,
      render: (active_orders, record) => {
        // Collect orders from multiple possible fields but filter out failed attempts
        const orders = [];

        // Получаем список назначенных исполнителей для поиска по ID
        const assigned = Array.isArray(record.assigned_executers)
          ? record.assigned_executers
          : [];

        // Функция для получения имени исполнителя по различным источникам
        const getExecuterName = (orderObj) => {
          // Проверяем прямые поля
          if (orderObj.executer_name) return orderObj.executer_name;
          if (orderObj.executer && orderObj.executer.name)
            return orderObj.executer.name;

          // Если есть executer_id, ищем по ID в назначенных исполнителях
          if (orderObj.executer_id) {
            const foundExecuter = assigned.find(
              (exec) =>
                exec.executer_id === orderObj.executer_id ||
                exec.Executer?.id === orderObj.executer_id
            );
            if (foundExecuter) {
              return (
                foundExecuter.executer_name ||
                foundExecuter.Executer?.name ||
                `ID: ${orderObj.executer_id}`
              );
            }
            return `ID: ${orderObj.executer_id}`;
          }

          return null;
        };

        // Функция для проверки валидности заказа
        const isValidOrder = (orderObj, isCompletedOrder = false) => {
          // Исключаем заказы с неуспешными статусами
          const status = (orderObj.status || orderObj.state || "")
            .toString()
            .toLowerCase();
          const failedStatuses = [
            "failed",
            "duplicate",
            "rejected",
            "invalid",
            "error",
            "cancelled",
            "canceled",
            "abort",
          ];

          // Если статус явно указывает на неудачу, исключаем заказ
          if (
            failedStatuses.some((failedStatus) => status.includes(failedStatus))
          ) {
            return false;
          }

          // Дополнительная проверка: если есть флаг отмены/ошибки
          if (
            orderObj.cancelled ||
            orderObj.failed ||
            orderObj.is_duplicate ||
            orderObj.is_invalid
          ) {
            return false;
          }

          // Проверяем номер заказа - если он пустой или неопределенный, исключаем
          const orderNumber =
            orderObj.order_number || orderObj.order || orderObj.id;
          if (
            !orderNumber ||
            orderNumber === null ||
            orderNumber === undefined ||
            orderNumber === ""
          ) {
            return false;
          }

          // Дополнительная проверка: если заказ помечен как ошибочный в метаданных
          if (
            orderObj.error ||
            orderObj.duplicate_attempt ||
            orderObj.creation_failed
          ) {
            return false;
          }

          // 🆕 ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: исключаем заказы с сообщениями об ошибках
          if (orderObj.message && typeof orderObj.message === "string") {
            const errorMessage = orderObj.message.toLowerCase();
            if (
              errorMessage.includes("уже существует") ||
              errorMessage.includes("already exists") ||
              errorMessage.includes("duplicate") ||
              errorMessage.includes("failed")
            ) {
              return false;
            }
          }

          // 🆕 СМЯГЧЕННАЯ ПРОВЕРКА: для завершённых заказов проверяем только наличие номера заказа
          if (isCompletedOrder) {
            // Для завершённых заказов достаточно наличия номера заказа
            return true;
          }

          // 🆕 ПРОВЕРКА НА НЕУДАЧНЫЕ ПОПЫТКИ: если нет valid статуса или создания (только для активных заказов)
          if (
            !orderObj.created_at &&
            !orderObj.status &&
            !orderObj.state &&
            orderObj.order_number
          ) {
            // Это может быть неудачная попытка без полных данных
            return false;
          }

          return true;
        };

        if (
          Array.isArray(record.active_orders) &&
          record.active_orders.length > 0
        ) {
          record.active_orders.forEach((o) => {
            if (!o) return;

            if (typeof o === "string" || typeof o === "number") {
              orders.push({
                order_number: o,
                status: null,
                executer_name: null,
              });
            } else {
              // Проверяем валидность заказа перед добавлением
              if (isValidOrder(o)) {
                orders.push({
                  order_number: o.order_number || o.order || o.id,
                  status: o.status || o.state || null,
                  executer_name: getExecuterName(o),
                });
              }
            }
          });
        }

        if (
          orders.length === 0 &&
          Array.isArray(record.order_numbers) &&
          record.order_numbers.length > 0
        ) {
          record.order_numbers.forEach((n) => {
            if (!n) return;
            if (typeof n === "object") {
              // Проверяем валидность объекта заказа
              if (isValidOrder(n)) {
                orders.push(n);
              }
            } else {
              orders.push({
                order_number: n,
                status: null,
                executer_name: null,
              });
            }
          });
        }

        // Also include completed orders so numbers remain visible when status changes
        // but exclude failed/duplicate attempts
        if (
          Array.isArray(record.completed_orders) &&
          record.completed_orders.length > 0
        ) {
          console.log(
            `🔍 Обрабатываем завершённые заказы для услуги "${record.name}":`,
            record.completed_orders
          );

          record.completed_orders.forEach((o) => {
            if (!o) return;

            console.log(`  📋 Проверяем завершённый заказ:`, o);

            // Проверяем валидность завершенного заказа (смягчённая проверка)
            if (!isValidOrder(o, true)) {
              console.log(`  ❌ Завершённый заказ не прошёл валидацию:`, o);
              return;
            }

            const num =
              typeof o === "string" || typeof o === "number"
                ? o
                : o.order_number || o.order || o.id;
            // avoid duplicates
            if (orders.some((ex) => String(ex.order_number) === String(num))) {
              console.log(
                `  🔄 Завершённый заказ ${num} уже существует в списке`
              );
              return;
            }

            if (typeof o === "string" || typeof o === "number") {
              console.log(`  ✅ Добавляем простой завершённый заказ: ${o}`);
              orders.push({
                order_number: o,
                status: "completed",
                executer_name: null,
              });
            } else {
              const newOrder = {
                order_number: num,
                status: o.status || o.state || "completed",
                executer_name: getExecuterName(o),
              };
              console.log(`  ✅ Добавляем завершённый заказ:`, newOrder);
              orders.push(newOrder);
            }
          });
        }

        if (orders.length === 0 && record.order_number) {
          orders.push({
            order_number: record.order_number,
            status: record.status || null,
            executer_name: record.executer_name || null,
          });
        }

        if (orders.length === 0) {
          return <span style={{ color: "#64748b" }}>Не указан</span>;
        }

        // Финальная дедупликация по номеру заказа - оставляем только уникальные номера
        // При дублях отдаем приоритет заказам со статусом (они более информативны)
        const uniqueOrders = [];
        const seenNumbers = new Set();

        // Дополнительная дедупликация: группируем по исполнителю + номер заказа
        const executerOrderMap = new Map(); // "executerName:orderNumber" -> order

        // Сначала группируем заказы по исполнителю и номеру
        orders.forEach((order) => {
          const executerName = order.executer_name || "unknown";
          const orderNumber = String(order.order_number);
          const key = `${executerName}:${orderNumber}`;

          // Если уже есть заказ от этого исполнителя с этим номером
          if (executerOrderMap.has(key)) {
            const existing = executerOrderMap.get(key);

            // 🔧 НОВАЯ ЛОГИКА: отдаём приоритет завершённому заказу перед активным
            const orderIsCompleted = (order.status || "")
              .toString()
              .toLowerCase()
              .includes("completed");
            const existingIsCompleted = (existing.status || "")
              .toString()
              .toLowerCase()
              .includes("completed");

            if (orderIsCompleted && !existingIsCompleted) {
              // Завершённый заказ заменяет активный
              executerOrderMap.set(key, order);
            } else if (!orderIsCompleted && existingIsCompleted) {
              // Активный не заменяет завершённый
              // оставляем existing
            } else {
              // Оба одного типа - отдаём приоритет заказу со статусом
              if (order.status && !existing.status) {
                executerOrderMap.set(key, order);
              }
              // Или более новому заказу (если есть timestamps)
              else if (
                order.created_at &&
                existing.created_at &&
                new Date(order.created_at) > new Date(existing.created_at)
              ) {
                executerOrderMap.set(key, order);
              } else if (
                order.completed_at &&
                existing.completed_at &&
                new Date(order.completed_at) > new Date(existing.completed_at)
              ) {
                // Или более новому завершённому заказу
                executerOrderMap.set(key, order);
              }
            }
          } else {
            executerOrderMap.set(key, order);
          }
        });

        // Теперь из дедуплицированного набора формируем финальный список
        const deduplicatedOrders = Array.from(executerOrderMap.values());

        // 🔧 НОВАЯ СОРТИРОВКА: сначала завершённые заказы, потом активные
        const completedOrders = deduplicatedOrders.filter(
          (order) =>
            (order.status || "")
              .toString()
              .toLowerCase()
              .includes("completed") ||
            (order.status || "").toString().toLowerCase().includes("выполн")
        );

        const activeOrders = deduplicatedOrders.filter(
          (order) =>
            !(order.status || "")
              .toString()
              .toLowerCase()
              .includes("completed") &&
            !(order.status || "").toString().toLowerCase().includes("выполн")
        );

        // Добавляем завершённые заказы
        completedOrders.forEach((order) => {
          const orderNumber = String(order.order_number);
          if (!seenNumbers.has(orderNumber)) {
            uniqueOrders.push(order);
            seenNumbers.add(orderNumber);
          }
        });

        // Затем добавляем активные заказы
        activeOrders.forEach((order) => {
          const orderNumber = String(order.order_number);
          if (!seenNumbers.has(orderNumber)) {
            uniqueOrders.push(order);
            seenNumbers.add(orderNumber);
          }
        });

        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {uniqueOrders.map((order, idx) => {
              const isCompleted =
                (order.status || "")
                  .toString()
                  .toLowerCase()
                  .includes("completed") ||
                (order.status || "")
                  .toString()
                  .toLowerCase()
                  .includes("выполн");
              return (
                <Tooltip
                  key={`${order.order_number}-${idx}`}
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
                    color={isCompleted ? "blue" : "geekblue"}
                    style={{ cursor: "pointer", margin: 2 }}
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
      title: "Действия",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<FaDollarSign />}
            onClick={() => openPricingModal(record)}
            size="small"
            disabled={record.is_deleted}
            style={{
              backgroundColor: record.is_deleted ? "#d9d9d9" : "#52c41a",
              borderColor: record.is_deleted ? "#d9d9d9" : "#52c41a",
              color: record.is_deleted ? "#8c8c8c" : "white",
            }}
            title="Индивидуальные цены"
          />
          <Button
            icon={<FaEdit />}
            onClick={() => openEditModal(record)}
            size="small"
            disabled={record.is_deleted}
          />
          {record.is_deleted ? (
            <>
              <Popconfirm
                title="Восстановить услугу из архива?"
                onConfirm={() => handleRestore(record.id)}
                okText="Да"
                cancelText="Нет"
              >
                <Button
                  icon={<FaUndo />}
                  type="primary"
                  size="small"
                  title="Восстановить из архива"
                />
              </Popconfirm>
              <Popconfirm
                title="Удалить услугу навсегда?"
                description="Это действие необратимо! Услуга и все связанные с ней данные будут полностью удалены из системы."
                onConfirm={() => handlePermanentDelete(record.id)}
                okText="Да, удалить навсегда"
                cancelText="Отмена"
                okType="danger"
              >
                <Button
                  icon={<FaTrash />}
                  danger
                  size="small"
                  title="Удалить навсегда"
                  style={{ backgroundColor: "#ff4d4f", borderColor: "#ff4d4f" }}
                />
              </Popconfirm>
            </>
          ) : (
            <>
              <Popconfirm
                title="Переместить услугу в архив?"
                description="Услуга будет скрыта, но сохранится в системе со всей статистикой"
                onConfirm={() => handleDelete(record.id)}
                okText="Да"
                cancelText="Нет"
              >
                <Button
                  icon={<FaArchive />}
                  danger
                  size="small"
                  title="Переместить в архив"
                />
              </Popconfirm>
              <Popconfirm
                title="Удалить услугу навсегда?"
                description="Это действие необратимо! Услуга и все связанные с ней данные будут полностью удалены из системы."
                onConfirm={() => handlePermanentDelete(record.id)}
                okText="Да, удалить навсегда"
                cancelText="Отмена"
                okType="danger"
              >
                <Button
                  icon={<FaTrash />}
                  danger
                  size="small"
                  title="Удалить навсегда"
                  style={{
                    backgroundColor: "#d32f2f",
                    borderColor: "#d32f2f",
                    color: "white",
                  }}
                />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0 }}>Управление услугами</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button
            type={showDeleted ? "primary" : "default"}
            onClick={() => setShowDeleted(!showDeleted)}
            size="small"
          >
            {showDeleted ? "🗂️ Показать активные" : "🗃️ Показать архивные"}
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredServices}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        bordered
        rowClassName={(record) => {
          return record.is_deleted ? "deleted-service-row" : "";
        }}
      />

      <style jsx>{`
        :global(.deleted-service-row) {
          background-color: #f5f5f5 !important;
          opacity: 0.7;
        }
        :global(.deleted-service-row:hover) {
          background-color: #e8e8e8 !important;
        }
      `}</style>
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

        {/* Кнопка добавления расходников */}
        <div style={{ marginBottom: 16, textAlign: "right" }}>
          <Button
            type="primary"
            icon={<FaUpload />}
            onClick={() => {
              setMaterialsModal(false);
              openUploadModal(selectedService);
            }}
          >
            Добавить расходники
          </Button>
        </div>

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
                    // Русские статусы
                    доступен: "green",
                    использован: "red",
                    "на замене": "orange",
                    заменен: "gray",
                  };
                  const statusTexts = {
                    available: "Доступен",
                    used: "Использован",
                    pending_replace: "На замене",
                    replaced: "Использован",
                    // Русские статусы - оставляем как есть
                    доступен: "Доступен",
                    использован: "Использован",
                    "на замене": "На замене",
                    заменен: "Заменен",
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
                  console.log(
                    `🗓️ Рендер даты использования для материала ${record.id}:`,
                    {
                      status: record.status,
                      used_date: date,
                      raw_date: record.used_date,
                    }
                  );

                  // Показываем дату использования для всех статусов кроме "доступен"
                  if (
                    record.status === "used" ||
                    record.status === "replaced" ||
                    record.status === "pending_replace" ||
                    record.status === "использован" ||
                    record.status === "заменен" ||
                    record.status === "на замене"
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
                  console.log(
                    `🔄 Рендер даты запроса замены для материала ${record.id}:`,
                    {
                      status: record.status,
                      replacement_requested_date: date,
                      raw_date: record.replacement_requested_date,
                    }
                  );

                  // Показываем дату для статусов "pending_replace", "заменен" и "на замене"
                  if (
                    record.status === "pending_replace" ||
                    record.status === "заменен" ||
                    record.status === "на замене"
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
                title: "Действия",
                key: "actions",
                width: 100,
                render: (_, record) => (
                  <Popconfirm
                    title="Удалить материал?"
                    description="Это действие нельзя отменить. Материал будет полностью удален из системы."
                    onConfirm={() => handleDeleteMaterial(record.id)}
                    okText="Да"
                    cancelText="Нет"
                    okType="danger"
                  >
                    <Button
                      danger
                      size="small"
                      icon={<FaTrash />}
                      title="Удалить материал"
                    />
                  </Popconfirm>
                ),
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
