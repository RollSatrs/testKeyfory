import { useState, useEffect } from "react";
import { apiFetch } from "../../../lib/api";
import {
  Input,
  Select,
  Button,
  Card,
  Space,
  InputNumber,
  Modal,
  Upload,
  message,
} from "antd";
import { FaTrash, FaPlus, FaUpload } from "react-icons/fa";

const { TextArea } = Input;

const categories = [
  "Другое",
  "Игры",
  "Программное обеспечение",
  "Образование",
  "Развлечения",
  "Услуги",
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

export function ServicesHeader({ onAdd, children }) {
  const [showModal, setShowModal] = useState(false);
  const [executers, setExecuters] = useState([]);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingModalType, setLoadingModalType] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [manualInput, setManualInput] = useState("");
  const [apiConfig, setApiConfig] = useState({
    url: "",
    headers: "",
    method: "GET",
  });

  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    status: "",
    loadingMethod: "manual",
    executer_id: "",
    customPricing: [], // [{executer_id, executer_name, custom_price}]
  });
  const [selectedExecuters, setSelectedExecuters] = useState([]);

  useEffect(() => {
    if (showModal) {
      fetchExecuters();
    }
  }, [showModal]);

  const fetchExecuters = async () => {
    try {
      console.log("🔄 Загружаем исполнителей...");

      const data = await apiFetch("/api/admin/executers/get");
      console.log("✅ Получены исполнители:", data);
      console.log("📊 Количество исполнителей:", data.length);

      // Детальный лог каждого исполнителя
      data.forEach((executer, index) => {
        console.log(`👤 Исполнитель ${index + 1}:`, {
          id: executer.id,
          name: executer.name,
          telegram_id: executer.telegram_id,
          status: executer.status,
          fullObject: executer,
        });
      });

      setExecuters(data);
    } catch (error) {
      console.error("❌ Ошибка загрузки исполнителей:", error);
      message.error("Ошибка загрузки исполнителей: " + error.message);
    }
  };

  const addCustomPricing = () => {
    setForm({
      ...form,
      customPricing: [
        ...form.customPricing,
        { executer_id: "", executer_name: "", custom_price: "" },
      ],
    });
  };

  const removeCustomPricing = (index) => {
    const newPricing = form.customPricing.filter((_, i) => i !== index);
    setForm({ ...form, customPricing: newPricing });
  };

  const updateCustomPricing = (index, field, value) => {
    const newPricing = [...form.customPricing];
    if (field === "executer_id") {
      const executer = executers.find((e) => (e.id || e.executer_id) === value);
      console.log(
        "🔄 Обновляем индивидуальную цену для исполнителя:",
        executer
      );

      newPricing[index] = {
        ...newPricing[index],
        executer_id: value,
        executer_name: executer
          ? executer.name || executer.executer_name || `Исполнитель ${value}`
          : "",
      };
    } else {
      newPricing[index][field] = value;
    }
    setForm({ ...form, customPricing: newPricing });
  };

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });

    // Если изменился способ загрузки, показываем соответствующее модальное окно
    if (name === "loadingMethod" && value !== "manual") {
      setLoadingModalType(value);
      setShowLoadingModal(true);

      // Очищаем предыдущие данные
      if (value === "file") {
        setFileList([]);
      } else if (value === "api") {
        setApiConfig({ url: "", headers: "", method: "GET" });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const serviceData = await apiFetch("/api/admin/services/add", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          price: parseFloat(form.price) || 0,
          status: form.status,
          loading_method: form.loadingMethod,
          executer_id: form.executer_id || null,
        }),
      });

      const serviceId = serviceData && serviceData.id;

      if (form.loadingMethod === "manual" && manualInput.trim()) {
        const materials = manualInput
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        for (const material of materials) {
          await apiFetch("/api/admin/materials/add-single", {
            method: "POST",
            body: JSON.stringify({
              service_id: serviceId,
              contents: material,
              source: "manual",
            }),
          });
        }
      }

      if (form.loadingMethod === "file" && fileList.length > 0) {
        const formData = new FormData();
        formData.append("file", fileList[0].originFileObj || fileList[0]);
        formData.append("service_id", serviceId);
        const uploadResult = await apiFetch("/api/admin/materials/upload", {
          method: "POST",
          body: formData,
        });
        message.success(
          `Загружено ${uploadResult?.count || 0} материалов из файла`
        );
      }

      for (const pricing of form.customPricing) {
        if (pricing.executer_id && pricing.custom_price) {
          await apiFetch("/api/admin/pricing/add", {
            method: "POST",
            body: JSON.stringify({
              executer_id: pricing.executer_id,
              service_id: serviceId,
              custom_price: parseFloat(pricing.custom_price),
            }),
          });
        }
      }

      // Если были выбраны исполнители в модалке — назначаем их на услугу
      if (selectedExecuters && selectedExecuters.length > 0 && serviceId) {
        try {
          await apiFetch(`/api/admin/services/${serviceId}/executers`, {
            method: "POST",
            body: JSON.stringify({ executerIds: selectedExecuters }),
          });
        } catch (assignErr) {
          console.warn(
            "Не удалось назначить исполнителей после создания услуги",
            assignErr
          );
        }
      }

      message.success("Услуга создана успешно");
      setShowModal(false);
      resetForm();
      if (onAdd) onAdd();
    } catch (error) {
      message.error("Ошибка при создании услуги");
      console.error(error);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: "",
      price: "",
      status: "",
      loadingMethod: "manual",
      executer_id: "",
      customPricing: [],
    });
    setFileList([]);
    setManualInput("");
    setApiConfig({ url: "", headers: "", method: "GET" });
    setSelectedExecuters([]);
  };

  return (
    <>
      <div>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex bg-white shadow p-6 rounded-4xl items-center justify-between">
            <h1 className="text-2xl font-bold">Управление услугами</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Button
                type="primary"
                style={{
                  background: "linear-gradient(to right, #3b82f6, #06b6d4)",
                  border: "none",
                }}
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
              >
                + Добавить услугу
              </Button>
            </div>
          </div>
          {children}
        </div>
      </div>
      {showModal && (
        <div className="h-full fixed inset-0 flex items-center justify-center z-50 bg-opacity-40 backdrop-blur-sm transition-all overflow-auto py-8">
          <form
            className="bg-gradient-to-br from-white via-gray-50 to-blue-50 p-8 rounded-2xl shadow-2xl flex flex-col gap-6 min-w-[340px] animate-fade-in max-h-[80vh] overflow-y-auto"
            onSubmit={handleSubmit}
            style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)" }}
          >
            <h2 className="text-2xl font-bold mb-2 text-blue-700 text-center">
              Добавить услугу
            </h2>
            <Input
              name="name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Название услуги"
              required
            />
            <Select
              name="category"
              value={form.category || undefined} // важно!
              onChange={(value) => handleChange("category", value)}
              placeholder="Выберите категорию"
              className="w-full"
              required
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
            />
            <Select
              name="loadingMethod"
              value={form.loadingMethod || undefined}
              onChange={(value) => handleChange("loadingMethod", value)}
              placeholder="Способ загрузки ключей"
              className="w-full"
            >
              <Select.Option value="manual">Ручная загрузка</Select.Option>
              <Select.Option value="file">Загрузка из файла</Select.Option>
              <Select.Option value="api">Через API</Select.Option>
            </Select>

            {/* Поле для ручного ввода материалов */}
            {form.loadingMethod === "manual" && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Материалы (каждый с новой строки):
                </label>
                <TextArea
                  placeholder="Введите материалы, каждый с новой строки:&#10;material1&#10;material2&#10;material3"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  rows={4}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Каждая строка = один материал. Пустые строки будут
                  игнорироваться.
                </div>
              </div>
            )}
            <Select
              name="status"
              value={form.status || undefined}
              onChange={(value) => handleChange("status", value)}
              placeholder="Выберите статус"
              className="w-full"
              required
            >
              <Select.Option value="active">АКТИВНА</Select.Option>
              <Select.Option value="inactive">НЕАКТИВНА</Select.Option>
            </Select>

            {/* Исполнители: множественный выбор + быстрые кнопки */}
            <div className="mt-2">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Исполнители (можно выбрать несколько):
              </label>
              <Select
                mode="multiple"
                name="executers"
                value={
                  selectedExecuters.length > 0 ? selectedExecuters : undefined
                }
                onChange={(value) => setSelectedExecuters(value)}
                placeholder="Выберите исполнителей (опционально)"
                className="w-full"
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  String(option.children)
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {executers.map((executer) => {
                  const executerName =
                    executer.name || executer.executer_name || "Без имени";
                  const telegramId =
                    executer.telegram_id ||
                    executer.telegramId ||
                    "ID не указан";
                  const executerId = executer.id || executer.executer_id;
                  return (
                    <Select.Option key={executerId} value={executerId}>
                      {executerName} (Telegram: {telegramId})
                    </Select.Option>
                  );
                })}
              </Select>

              <div className="flex gap-2 mt-2">
                <Button
                  size="small"
                  onClick={() => {
                    if (executers && executers.length > 0) {
                      const allIds = executers
                        .map((e) => e.id || e.executer_id)
                        .filter(Boolean);
                      setSelectedExecuters(allIds);
                      message.info("Выбраны все исполнители");
                    } else {
                      message.warning("Нет доступных исполнителей");
                    }
                  }}
                >
                  Добавить всех
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedExecuters([]);
                    message.info("Выбор исполнителей очищен");
                  }}
                >
                  Снять всех
                </Button>
              </div>
            </div>

            {/* Секция индивидуального ценообразования */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-700">
                  Индивидуальные цены
                </h3>
                <Button
                  type="dashed"
                  icon={<FaPlus />}
                  onClick={addCustomPricing}
                  size="small"
                >
                  Добавить исключение
                </Button>
              </div>

              {form.customPricing.map((pricing, index) => (
                <Card key={index} size="small" className="mb-2">
                  <div className="flex gap-2 items-center">
                    <Select
                      placeholder="Выберите исполнителя"
                      style={{ flex: 1 }}
                      value={pricing.executer_id || undefined}
                      onChange={(value) =>
                        updateCustomPricing(index, "executer_id", value)
                      }
                      showSearch
                      filterOption={(input, option) =>
                        option.children
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
                      {executers.map((executer) => {
                        const executerName =
                          executer.name ||
                          executer.executer_name ||
                          "Без имени";
                        const telegramId =
                          executer.telegram_id ||
                          executer.telegramId ||
                          "ID не указан";
                        const executerId = executer.id || executer.executer_id;

                        return (
                          <Select.Option key={executerId} value={executerId}>
                            {executerName} (Telegram: {telegramId})
                          </Select.Option>
                        );
                      })}
                    </Select>
                    <InputNumber
                      placeholder="Цена"
                      min={0}
                      step={0.01}
                      style={{ width: 120 }}
                      value={pricing.custom_price}
                      onChange={(value) =>
                        updateCustomPricing(index, "custom_price", value)
                      }
                      addonAfter="₽"
                    />
                    <Button
                      type="text"
                      danger
                      icon={<FaTrash />}
                      onClick={() => removeCustomPricing(index)}
                      size="small"
                    />
                  </div>
                </Card>
              ))}

              {form.customPricing.length === 0 && (
                <div className="text-gray-500 text-sm text-center py-2">
                  Индивидуальные цены не заданы. Будет использоваться базовая
                  цена услуги.
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-2">
              <Button type="default" onClick={() => setShowModal(false)}>
                Отмена
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  background: "linear-gradient(to right, #3b82f6, #06b6d4)",
                  border: "none",
                }}
              >
                Сохранить
              </Button>
            </div>
          </form>
          <style>
            {`
              .animate-fade-in {
                animation: fadeIn 0.3s ease;
              }
              @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.97);}
                to { opacity: 1; transform: scale(1);}
              }
            `}
          </style>
        </div>
      )}

      {/* Модальные окна для способов загрузки */}
      <Modal
        open={showLoadingModal}
        title={`Настройка ${
          loadingModalType === "file" ? "файловой загрузки" : "API загрузки"
        }`}
        onCancel={() => setShowLoadingModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowLoadingModal(false)}>
            Отмена
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={() => setShowLoadingModal(false)}
          >
            Сохранить
          </Button>,
        ]}
      >
        {loadingModalType === "file" && (
          <div>
            <p className="mb-4">
              Выберите файл с материалами (.txt, .csv, .xlsx):
            </p>
            <Upload.Dragger
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false} // Не загружаем сразу, сохраняем для потом
              accept=".txt,.csv,.xlsx"
              maxCount={1}
            >
              <p className="ant-upload-drag-icon">
                <FaUpload style={{ fontSize: "48px", color: "#1890ff" }} />
              </p>
              <p className="ant-upload-text">
                Выберите файл или перетащите его сюда
              </p>
              <p className="ant-upload-hint">
                Поддерживаются файлы .txt, .csv, .xlsx
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Каждая строка файла = один материал
              </p>
            </Upload.Dragger>
            {fileList.length > 0 && (
              <div className="mt-3 p-2 bg-green-50 rounded">
                <p className="text-green-700 text-sm">
                  ✅ Файл "{fileList[0].name}" готов к загрузке
                </p>
              </div>
            )}
          </div>
        )}

        {loadingModalType === "api" && (
          <div className="space-y-4">
            <p className="mb-4">
              Настройте параметры API для загрузки материалов:
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">URL API:</label>
              <Input
                placeholder="https://api.example.com/materials"
                value={apiConfig.url}
                onChange={(e) =>
                  setApiConfig({ ...apiConfig, url: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Метод:</label>
              <Select
                value={apiConfig.method}
                onChange={(value) =>
                  setApiConfig({ ...apiConfig, method: value })
                }
                className="w-full"
              >
                <Select.Option value="GET">GET</Select.Option>
                <Select.Option value="POST">POST</Select.Option>
              </Select>

              {/* Быстрые кнопки: добавить всех / снять всех (для удобства) */}
              <div className="flex gap-2 mt-2">
                <Button
                  size="small"
                  onClick={() => {
                    // If there are executers, set the primary executer to the first one
                    if (executers && executers.length > 0) {
                      const firstId =
                        executers[0].id || executers[0].executer_id;
                      handleChange("executer_id", firstId);
                      message.info("Выбран первый исполнитель как основной");
                    } else {
                      message.warning("Нет доступных исполнителей");
                    }
                  }}
                >
                  Добавить всех
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    handleChange("executer_id", null);
                    message.info("Снята привязка основного исполнителя");
                  }}
                >
                  Снять всех
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Заголовки (JSON):
              </label>
              <TextArea
                placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                value={apiConfig.headers}
                onChange={(e) =>
                  setApiConfig({ ...apiConfig, headers: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
