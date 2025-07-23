import { useState, useEffect } from 'react'
import { Input, Select, Button } from 'antd'
import { FiFilter } from 'react-icons/fi'
import { MdFileDownload } from 'react-icons/md'

export function OrdersHeader({
  onAdd,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  serviceFilter,
  setServiceFilter
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [services, setServices] = useState([]);

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

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div
        className="flex bg-white shadow p-6 rounded-4xl items-center justify-between"
        style={{ background: "linear-gradient(to right, #3b82f6, #06b6d4)" }}
      >
        <h1 className="text-2xl font-bold text-white">Управление заказами</h1>
        <div className="flex gap-2">
          <Button icon={<MdFileDownload size={18} />}>
            Экспорт
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 bg-gradient-to-r from-blue-50 via-white to-blue-100 rounded-2xl px-4 py-3 shadow-md">
        <div className="flex gap-3 items-center">
          <Input
            allowClear
            placeholder="Поиск заказов по ID, услуге или клиенту..."
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
              options={[
                { value: '', label: 'Все статусы' },
                { value: 'pending', label: 'Ожидает' },
                { value: 'in_progress', label: 'Выполняется' },
                { value: 'completed', label: 'Завершено' },
                { value: 'cancelled', label: 'Отменено' }
              ]}
              allowClear
            />
            <Select
              className="w-full md:w-56"
              value={serviceFilter}
              onChange={value => setServiceFilter(value)}
              placeholder="Все услуги"
              options={[
                { value: '', label: 'Все услуги' },
                ...services.map(service => ({
                  value: service.id,
                  label: service.name
                }))
              ]}
              allowClear
            />
          </div>
        )}
      </div>
    </div>
  );
}