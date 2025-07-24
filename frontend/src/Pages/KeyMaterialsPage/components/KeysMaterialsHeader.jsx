import { useState, useEffect } from 'react'
import { Input, Select, Button, message } from 'antd'
import { MdFileDownload, MdFileUpload } from 'react-icons/md'
import { CSVLink } from 'react-csv'

export function exportFunction(headers ,data){

}

export function KeysMaterialsHeader({ onAdd }) {
  const [showModal, setShowModal] = useState(false)
  const [services, setServices] = useState([])
  const [materials, setMaterials] = useState([])
  const [refreshTrigger, setRefreshTrigger] = useState(0) // Триггер для принудительного обновления
  const [form, setForm] = useState({
    type_key: '',
    service_id: '',
    contents: '',
    status: '',
    source: 'manual'
  })

  useEffect(() => {
    fetchServices()
    fetchMaterials()
  }, [])

  // Отдельный useEffect для отслеживания изменений в refreshTrigger
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchMaterials()
      fetchServices()
      
    }
  }, [refreshTrigger])

  // Функция для принудительного обновления данных
  const forceRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Слушатель событий для обновления при изменениях в других компонентах
  useEffect(() => {
    const handleStorageChange = () => {
      forceRefresh()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && showModal) {
        forceRefresh()
      }
    }

    // Периодическое обновление данных когда модальное окно открыто
    let intervalId = null
    if (showModal) {
      intervalId = setInterval(() => {
        fetchMaterials()
        fetchServices()
      }, 5000) // Обновляем каждые 5 секунд
    }

    // Добавляем слушатели
    window.addEventListener('storage', handleStorageChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleStorageChange)

    return () => {
      if (intervalId) clearInterval(intervalId)
      window.removeEventListener('storage', handleStorageChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleStorageChange)
    }
  }, [showModal])

  // Дополнительный эффект для прослушивания кастомных событий изменений
  useEffect(() => {
    const handleDataChange = (event) => {
      // Обновляем данные при получении уведомления об изменениях
      fetchMaterials()
      fetchServices()
    }

    window.addEventListener('materialsDataChanged', handleDataChange)

    return () => {
      window.removeEventListener('materialsDataChanged', handleDataChange)
    }
  }, [])

  async function fetchServices() {
    try {
      const res = await fetch('http://localhost:3000/api/services/get', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      const data = await res.json()
      setServices(data)
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error)
    }
  }

  async function fetchMaterials() {
    try {
      const res = await fetch('http://localhost:3000/api/materials/get', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      const data = await res.json()
      setMaterials(data)
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error)
    }
  }

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value })
  }

  // Функция для получения информации о ключах для выбранной услуги
  const getKeyInfo = () => {
    if (!form.service_id) return null;

    const selectedService = services.find(s => s.id == form.service_id);
    if (!selectedService) return null;

    const requiredKeys = selectedService.required_keys || 0;
    const availableKeys = materials.filter(m =>
      m.service_id == form.service_id &&
      (m.status === 'available' || m.status === 'reserved')
    ).length;

    return { requiredKeys, availableKeys, serviceName: selectedService.name };
  }

  // Функция для уведомления других компонентов об изменениях используется из utils


  const resetForm = () => {
    setForm({
      type_key: '',
      service_id: '',
      contents: '',
      status: '',
      source: 'manual'
    })
    // Обновляем материалы после закрытия формы
    fetchMaterials()
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:3000/api/materials/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(form)
      })

      const result = await response.json()

      if (!response.ok) {
        // Показываем ошибку от сервера
        throw new Error(result.error || 'Ошибка при добавлении материала')
      }

      setShowModal(false)
      resetForm()
      if (onAdd) onAdd()
      fetchMaterials() // Обновляем материалы после добавления

      message.success('Материал успешно добавлен')
    } catch (error) {
      console.error('Ошибка при добавлении материала:', error)
      message.error(error.message)
    }
  }

  const handleClose = () => {
    setShowModal(false)
    resetForm()
  }

  return (
    <>
      <div className="flex bg-white shadow p-6 rounded-4xl items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-black">Управление материалами</h1>
        <div className="flex gap-2">
          <Button icon={<MdFileUpload size={18} />}>Импорт</Button>
          <Button icon={<MdFileDownload size={18} />}>Экспорт</Button>
          <Button
            type="primary"
            style={{
              background: "linear-gradient(to right, #3b82f6, #06b6d4)",
              border: "none",

            }}
            onClick={() => setShowModal(true)}
          >
            + Добавить материал
          </Button>
        </div>
      </div>

      {showModal && (
        <div className="h-full fixed inset-0 flex items-center justify-center z-50 bg-opacity-40 backdrop-blur-sm transition-all">
          <form
            className="bg-gradient-to-br from-white via-gray-50 to-blue-50 p-8 rounded-2xl shadow-2xl flex flex-col gap-6 min-w-[340px] animate-fade-in"
            onSubmit={handleSubmit}
            style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}
          >
            <h2 className="text-2xl font-bold mb-2 text-blue-700 text-center">Добавить материал</h2>

            <Select
              name="type_key"
              value={form.type_key || undefined}
              onChange={value => handleChange('type_key', value)}
              placeholder="Тип материала"
              className="w-full"
              required
            >
              <Select.Option value="Ключ">Ключ</Select.Option>
              <Select.Option value="Лицензия">Лицензия</Select.Option>
              <Select.Option value="Код">Код</Select.Option>
            </Select>

            <Select
              name="service_id"
              value={form.service_id || undefined}
              onChange={value => handleChange('service_id', value)}
              placeholder="Привязать к услуге"
              className="w-full"
              required
            >
              {services.map(service => (
                <Select.Option key={service.id} value={service.id}>{service.name}</Select.Option>
              ))}
            </Select>

            {/* Предупреждение о количестве ключей */}
            {form.service_id && (() => {
              const keyInfo = getKeyInfo();
              if (keyInfo) {
                const { requiredKeys, availableKeys, serviceName } = keyInfo;
                if (availableKeys >= requiredKeys) {
                  return (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-600 font-semibold">⚠️ Внимание!</span>
                      </div>
                      <div className="text-sm text-yellow-700 mt-1">
                        Для услуги "{serviceName}" уже достаточно ключей:<br/>
                        <strong>Доступно: {availableKeys} из {requiredKeys} ключей</strong><br/>
                        Добавление нового ключа может быть заблокировано системой.
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 font-semibold">✅ Можно добавить</span>
                      </div>
                      <div className="text-sm text-green-700 mt-1">
                        Для услуги "{serviceName}" нужно больше ключей:<br/>
                        <strong>Доступно: {availableKeys} из {requiredKeys} ключей</strong><br/>
                        Осталось добавить: {requiredKeys - availableKeys} ключей
                      </div>
                    </div>
                  );
                }
              }
              return null;
            })()}

            <Input
              name="contents"
              value={form.contents}
              onChange={e => handleChange('contents', e.target.value)}
              placeholder="Содержимое (ключ, код и т.п.)"
              required
            />

            <Select
              name="status"
              value={form.status || undefined}
              onChange={value => handleChange('status', value)}
              placeholder="Статус материала"
              className="w-full"
              required
            >
              <Select.Option value="available">Доступен</Select.Option>
              <Select.Option value="used">Использован</Select.Option>
              <Select.Option value="reserved">Зарезервирован</Select.Option>
            </Select>

            <Select
              name="source"
              value={form.source || 'manual'}
              onChange={value => handleChange('source', value)}
              placeholder="Источник материала"
              className="w-full"
              required
            >
              <Select.Option value="manual">Ручной ввод</Select.Option>
              <Select.Option value="api">API</Select.Option>
            </Select>

            <div className="flex gap-3 justify-end mt-2">
              <Button type="default" onClick={handleClose}>Отмена</Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  background: "linear-gradient(to right, #3b82f6, #06b6d4)",
                  border: "none"
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
    </>
  )
}