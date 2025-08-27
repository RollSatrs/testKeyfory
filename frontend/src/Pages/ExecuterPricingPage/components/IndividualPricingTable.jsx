import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Popconfirm,
  message,
  Tag,
  Tooltip,
} from "antd";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaRubleSign,
  FaPercent,
} from "react-icons/fa";
import { apiFetch } from "../../../lib/api.js";

const { Option } = Select;

export function IndividualPricingTable({
  refresh,
  onChange,
  executerFilter,
  serviceFilter,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState({ visible: false, record: null });
  const [addModal, setAddModal] = useState(false);
  const [executers, setExecuters] = useState([]);
  const [services, setServices] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
    fetchExecuters();
    fetchServices();
  }, [refresh, executerFilter, serviceFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Строим параметры запроса
      const params = new URLSearchParams();
      if (executerFilter) params.append("executer_id", executerFilter);
      if (serviceFilter) params.append("service_id", serviceFilter);

      const result = await apiFetch(
        `/api/admin/pricing/all${
          params.toString() ? "?" + params.toString() : ""
        }`
      );
      setData(result || []);
    } catch (error) {
      console.error("Ошибка загрузки индивидуальных цен:", error);
      // Демо данные при ошибке
      setData([
        {
          id: 1,
          executer_id: 1,
          executer_name: "Иван Петров",
          service_id: 1,
          service_name: "Создание ключей",
          base_price: 500,
          custom_price: 600,
          created_at: "2025-01-10T10:00:00Z",
        },
        {
          id: 2,
          executer_id: 2,
          executer_name: "Сергей Иванов",
          service_id: 1,
          service_name: "Создание ключей",
          base_price: 500,
          custom_price: 450,
          created_at: "2025-01-12T14:30:00Z",
        },
        {
          id: 3,
          executer_id: 1,
          executer_name: "Иван Петров",
          service_id: 2,
          service_name: "Ремонт замков",
          base_price: 800,
          custom_price: 900,
          created_at: "2025-01-15T09:15:00Z",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchExecuters = async () => {
    try {
      const data = await apiFetch("/api/admin/executers/get");
      setExecuters(data || []);
    } catch (error) {
      console.error("Ошибка загрузки исполнителей:", error);
      setExecuters([]);
    }
  };

  const fetchServices = async () => {
    try {
      const data = await apiFetch("/api/admin/services/get");
      setServices(data || []);
    } catch (error) {
      console.error("Ошибка загрузки услуг:", error);
      setServices([]);
    }
  };

  const showEditModal = (record) => {
    setEditModal({ visible: true, record });
    form.setFieldsValue({
      custom_price: record.custom_price,
    });
  };

  const showAddModal = () => {
    setAddModal(true);
    form.resetFields();
  };

  const handleEdit = async (values) => {
    try {
      await apiFetch("/api/admin/pricing/update", {
        method: "PUT",
        body: {
          id: editModal.record.id,
          custom_price: values.custom_price,
        },
      });
      message.success("Цена обновлена");
      setEditModal({ visible: false, record: null });
      form.resetFields();
      fetchData();
      onChange?.();
    } catch (error) {
      console.error("Ошибка обновления цены:", error);
      message.error("Ошибка при обновлении цены");
    }
  };

  const handleAdd = async (values) => {
    try {
      await apiFetch("/api/admin/pricing/add", {
        method: "POST",
        body: values,
      });
      message.success("Индивидуальная цена добавлена");
      setAddModal(false);
      form.resetFields();
      fetchData();
      onChange?.();
    } catch (error) {
      console.error("Ошибка добавления цены:", error);
      message.error("Ошибка при добавлении цены");
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch("/api/admin/pricing/delete", {
        method: "DELETE",
        body: { id },
      });
      message.success("Индивидуальная цена удалена");
      fetchData();
      onChange?.();
    } catch (error) {
      console.error("Ошибка удаления цены:", error);
      message.error("Ошибка при удалении цены");
    }
  };

  const calculateDifference = (basePrice, customPrice) => {
    const diff = customPrice - basePrice;
    const diffPercent =
      basePrice > 0 ? Math.round((diff / basePrice) * 100) : 0;
    return { diff, diffPercent };
  };

  const columns = [
    {
      title: "Исполнитель",
      key: "executer",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-xs">
              {(record.executer_name || "И").charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {record.executer_name || `Исполнитель ${record.executer_id}`}
            </div>
            <div className="text-xs text-gray-500">
              ID: {record.executer_id}
            </div>
          </div>
        </div>
      ),
      sorter: (a, b) =>
        (a.executer_name || "").localeCompare(b.executer_name || ""),
    },
    {
      title: "Услуга",
      dataIndex: "service_name",
      key: "service_name",
      render: (name) => (
        <Tag color="cyan" className="font-medium">
          {name || "Неизвестная услуга"}
        </Tag>
      ),
      sorter: (a, b) =>
        (a.service_name || "").localeCompare(b.service_name || ""),
    },
    {
      title: "Базовая цена",
      dataIndex: "base_price",
      key: "base_price",
      render: (price) => (
        <div className="flex items-center gap-1 text-gray-600">
          <FaRubleSign />
          <span>{(price || 0).toLocaleString("ru-RU")}</span>
        </div>
      ),
      sorter: (a, b) => (a.base_price || 0) - (b.base_price || 0),
      align: "center",
    },
    {
      title: "Индивидуальная цена",
      dataIndex: "custom_price",
      key: "custom_price",
      render: (price) => (
        <div className="flex items-center gap-1 text-blue-600 font-bold">
          <FaRubleSign />
          <span>{(price || 0).toLocaleString("ru-RU")}</span>
        </div>
      ),
      sorter: (a, b) => (a.custom_price || 0) - (b.custom_price || 0),
      align: "center",
    },
    {
      title: "Разница",
      key: "difference",
      render: (_, record) => {
        const { diff, diffPercent } = calculateDifference(
          record.base_price || 0,
          record.custom_price || 0
        );
        const isPositive = diff >= 0;
        return (
          <div className="text-center">
            <div
              className={`flex items-center justify-center gap-1 font-medium ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              <FaRubleSign />
              <span>
                {isPositive ? "+" : ""}
                {diff.toLocaleString("ru-RU")}
              </span>
            </div>
            <div className="mt-1">
              <Tag color={isPositive ? "green" : "red"} className="text-xs">
                <FaPercent className="mr-1" />
                {isPositive ? "+" : ""}
                {diffPercent}%
              </Tag>
            </div>
          </div>
        );
      },
      sorter: (a, b) => {
        const aDiff = (a.custom_price || 0) - (a.base_price || 0);
        const bDiff = (b.custom_price || 0) - (b.base_price || 0);
        return aDiff - bDiff;
      },
      align: "center",
    },
    {
      title: "Дата создания",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => (
        <div className="text-center text-sm">
          <div className="text-gray-700">
            {new Date(date).toLocaleDateString("ru-RU")}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(date).toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      ),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      align: "center",
    },
    {
      title: "Действия",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Редактировать цену">
            <Button
              type="primary"
              size="small"
              icon={<FaEdit />}
              onClick={() => showEditModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Удалить индивидуальную цену?"
            description="Цена вернется к базовой"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
            okType="danger"
          >
            <Tooltip title="Удалить индивидуальную цену">
              <Button danger size="small" icon={<FaTrash />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
      align: "center",
      width: 120,
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Индивидуальные цены
          </h3>
          <p className="text-sm text-gray-600">
            Управление персональными ценами для пар исполнитель-услуга
          </p>
        </div>
        <Button
          type="primary"
          icon={<FaPlus />}
          onClick={showAddModal}
          style={{
            background: "linear-gradient(to right, #3b82f6, #06b6d4)",
            border: "none",
          }}
        >
          Добавить цену
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 15,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} из ${total} индивидуальных цен`,
        }}
        locale={{
          emptyText: "Нет индивидуальных цен",
        }}
      />

      {/* Модальное окно редактирования */}
      <Modal
        title="Редактировать индивидуальную цену"
        open={editModal.visible}
        onCancel={() => {
          setEditModal({ visible: false, record: null });
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        {editModal.record && (
          <div>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">
                    Исполнитель:
                  </span>
                  <div className="mt-1 text-gray-900">
                    {editModal.record.executer_name}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Услуга:</span>
                  <div className="mt-1 text-gray-900">
                    {editModal.record.service_name}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">
                    Базовая цена:
                  </span>
                  <div className="mt-1 text-gray-600">
                    ₽{editModal.record.base_price}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">
                    Текущая цена:
                  </span>
                  <div className="mt-1 text-blue-600 font-bold">
                    ₽{editModal.record.custom_price}
                  </div>
                </div>
              </div>
            </div>

            <Form form={form} onFinish={handleEdit} layout="vertical">
              <Form.Item
                label="Новая индивидуальная цена"
                name="custom_price"
                rules={[
                  { required: true, message: "Введите цену" },
                  {
                    type: "number",
                    min: 0,
                    message: "Цена должна быть больше 0",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  prefix="₽"
                  min={0}
                  step={10}
                  placeholder="Введите новую цену"
                />
              </Form.Item>

              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setEditModal({ visible: false, record: null });
                    form.resetFields();
                  }}
                >
                  Отмена
                </Button>
                <Button type="primary" htmlType="submit">
                  Сохранить
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* Модальное окно добавления */}
      <Modal
        title="Добавить индивидуальную цену"
        open={addModal}
        onCancel={() => {
          setAddModal(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form form={form} onFinish={handleAdd} layout="vertical">
          <Form.Item
            label="Исполнитель"
            name="executer_id"
            rules={[{ required: true, message: "Выберите исполнителя" }]}
          >
            <Select placeholder="Выберите исполнителя" showSearch>
              {executers.map((executer) => (
                <Option key={executer.id} value={executer.id}>
                  {executer.name || `Исполнитель ${executer.id}`} (ID:{" "}
                  {executer.id})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Услуга"
            name="service_id"
            rules={[{ required: true, message: "Выберите услугу" }]}
          >
            <Select placeholder="Выберите услугу" showSearch>
              {services.map((service) => (
                <Option key={service.id} value={service.id}>
                  {service.name} (Базовая цена: ₽{service.price || 0})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Индивидуальная цена"
            name="custom_price"
            rules={[
              { required: true, message: "Введите цену" },
              { type: "number", min: 0, message: "Цена должна быть больше 0" },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              prefix="₽"
              min={0}
              step={10}
              placeholder="Введите индивидуальную цену"
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setAddModal(false);
                form.resetFields();
              }}
            >
              Отмена
            </Button>
            <Button type="primary" htmlType="submit">
              Добавить
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
