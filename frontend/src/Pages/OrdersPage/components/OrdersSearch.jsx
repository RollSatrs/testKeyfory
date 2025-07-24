import { useState, useEffect } from 'react'
import { Input, Button, Select } from 'antd'
import { FiFilter } from 'react-icons/fi'

export function OrdersSearch({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  serviceFilter,
  setServiceFilter
}) {
    const [showFilters, setShowFilters] = useState(false)
    const [services, setServices] = useState([])

    useEffect(() => {
      fetchServices();
    }, []);

    async function fetchServices() {
      try {
        const res = await fetch('http://localhost:3000/api/services/get', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          }
        });
        const data = await res.json();
        setServices(data);
      } catch (error) {
        console.error('Ошибка загрузки услуг:', error);
      }
    }

    return(
    <div className="flex flex-col gap-2 bg-gradient-to-r from-blue-50 via-white to-blue-100 rounded-2xl px-4 py-3 shadow-md mb-6">
        <div className="flex gap-3 items-center">
          <Input
            allowClear
            placeholder="Поиск заказов по ID или услуге..."
            className="flex-1"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ minWidth: 0 }}
          />
          <Button
            type="primary"
            icon={<FiFilter size={20} />}
            style={{
              background: "linear-gradient(to right, #3b82f6, #06b6d4)",
              border: "none"
            }}
            onClick={() => setShowFilters(f => !f)}
          >
            Фильтры
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-col gap-2 md:flex-row md:gap-6 items-center">
            <Select
              className="w-full md:w-56"
              value={statusFilter}
              onChange={value => setStatusFilter(value)}
              placeholder="Все статусы"
              allowClear
            >
              <Select.Option value="">Все статусы</Select.Option>
              <Select.Option value="pending">Ожидает</Select.Option>
              <Select.Option value="in_progress">Выполняется</Select.Option>
              <Select.Option value="completed">Завершено</Select.Option>
              <Select.Option value="cancelled">Отменено</Select.Option>
            </Select>
            <Select
              className="w-full md:w-56"
              value={serviceFilter}
              onChange={value => setServiceFilter(value)}
              placeholder="Все услуги"
              allowClear
            >
              <Select.Option value="">Все услуги</Select.Option>
              {services.map(service => (
                <Select.Option key={service.id} value={service.id.toString()}>
                  {service.name}
                </Select.Option>
              ))}
            </Select>
          </div>
        )}
    </div>
    )
}