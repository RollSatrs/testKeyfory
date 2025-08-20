import { useState, useEffect } from "react";
import {
  Card,
  Select,
  Input,
  Button,
  Statistic,
  Row,
  Col,
  message,
  Modal,
} from "antd";
import {
  FaKey,
  FaCheckCircle,
  FaExchangeAlt,
  FaClock,
  FaSearch,
} from "react-icons/fa";

export function ExecuterMaterials() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [materialStats, setMaterialStats] = useState({
    total: 0,
    used: 0,
    replaced: 0,
    available: 0,
  });
  const [orderNumber, setOrderNumber] = useState("");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvailableServices();
  }, []);

  useEffect(() => {
    if (selectedService) fetchMaterialStats(selectedService);
  }, [selectedService]);

  async function fetchAvailableServices() {
    try {
      const res = await fetch("/api/executer/services/available", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("executer_token")}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setServices(data || []);
    } catch (err) {
      console.error("Ошибка загрузки услуг:", err);
      message.error("Ошибка загрузки доступных услуг");
    }
  }

  async function fetchMaterialStats(serviceId) {
    try {
      const res = await fetch(`/api/executer/materials/stats/${serviceId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("executer_token")}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMaterialStats(data || {});
    } catch (err) {
      console.error("Ошибка загрузки статистики:", err);
      message.error("Ошибка загрузки статистики материалов");
    }
  }

  async function handleGetMaterial() {
    if (!orderNumber.trim()) return message.error("Введите номер заказа");
    if (!selectedService) return message.error("Выберите услугу");

    setLoading(true);
    try {
      const res = await fetch("/api/executer/materials/get-by-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("executer_token")}`,
        },
        body: JSON.stringify({
          service_id: selectedService,
          order_number: orderNumber,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Ошибка получения материала");
      }
      const data = await res.json();

      Modal.success({
        title: "Материал получен",
        content: (
          <div>
            <p>
              <strong>Заказ:</strong> {orderNumber}
            </p>
            <p>
              <strong>Материал:</strong> {data.material}
            </p>
            <p>
              <strong>Услуга:</strong>{" "}
              {services.find((s) => s.id === selectedService)?.name}
            </p>
          </div>
        ),
        onOk: () => {
          setOrderNumber("");
          setShowOrderModal(false);
          fetchMaterialStats(selectedService);
        },
      });
    } catch (err) {
      message.error(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  const getServiceName = (serviceId) => {
    const s = services.find((x) => x.id === serviceId);
    return s ? s.name : "Неизвестная услуга";
  };

  return (
    <div className="p-6">
      <Card title="Управление материалами" className="mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Выберите услугу:
          </label>
          <Select
            placeholder="Выберите услугу для просмотра материалов"
            style={{ width: "100%" }}
            value={selectedService}
            onChange={setSelectedService}
            size="large"
          >
            {services.map((service) => (
              <Select.Option key={service.id} value={service.id}>
                {service.name} ({service.category})
              </Select.Option>
            ))}
          </Select>
        </div>

        {selectedService ? (
          <>
            <Row gutter={[16, 16]} className="mb-6">
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Всего материалов"
                    value={materialStats.total}
                    prefix={<FaKey />}
                    valueStyle={{ color: "#1890ff" }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Доступно"
                    value={materialStats.available}
                    prefix={<FaClock />}
                    valueStyle={{ color: "#52c41a" }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Использовано"
                    value={materialStats.used}
                    prefix={<FaCheckCircle />}
                    valueStyle={{ color: "#faad14" }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Заменено"
                    value={materialStats.replaced}
                    prefix={<FaExchangeAlt />}
                    valueStyle={{ color: "#f5222d" }}
                  />
                </Card>
              </Col>
            </Row>
            <div className="text-center">
              <Button
                type="primary"
                size="large"
                icon={<FaSearch />}
                onClick={() => setShowOrderModal(true)}
                disabled={materialStats.available === 0}
              >
                Получить материал по номеру заказа
              </Button>
              {materialStats.available === 0 && (
                <div className="text-red-500 mt-2">
                  Нет доступных материалов для этой услуги
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">
            Выберите услугу для просмотра статистики материалов
          </div>
        )}
      </Card>

      <Modal
        title="Получить материал"
        open={showOrderModal}
        onCancel={() => setShowOrderModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowOrderModal(false)}>
            Отмена
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleGetMaterial}
          >
            Получить материал
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Услуга: <strong>{getServiceName(selectedService)}</strong>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Номер заказа:
            </label>
            <Input
              placeholder="Введите номер заказа"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              size="large"
              onPressEnter={handleGetMaterial}
            />
          </div>
          <div className="text-sm text-gray-500">
            Введите номер заказа для получения соответствующего материала
          </div>
        </div>
      </Modal>
    </div>
  );
}
