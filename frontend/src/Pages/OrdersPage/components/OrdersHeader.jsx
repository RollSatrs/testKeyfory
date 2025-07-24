import { useState, useEffect } from 'react'
import { Input, Select, Button, message, Modal } from 'antd'


export function OrdersHeader({ onAdd }) {
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [services, setServices] = useState([])
  const [executors, setExecutors] = useState([])
  const [materials, setMaterials] = useState([])
  const [selectedMaterials, setSelectedMaterials] = useState([])

  const [orderForm, setOrderForm] = useState({
    executer_id: '',
    service_id: '',
    total_sum: '',
    status: 'pending',
    payment_status: 'pending'
  })

  useEffect(() => {
    fetchServices()
    fetchExecutors()
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

  async function fetchExecutors() {
    try {
      const res = await fetch('http://localhost:3000/api/executers/get', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      const data = await res.json()
      setExecutors(data)
    } catch (error) {
      console.error('Ошибка загрузки исполнителей:', error)
    }
  }

  async function fetchMaterialsForService(serviceId) {
    try {
      const res = await fetch('http://localhost:3000/api/materials/get', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      const data = await res.json()
      // Фильтруем только доступные материалы для выбранной услуги
      const serviceMaterials = data.filter(m =>
        m.service_id == serviceId && m.status === 'available'
      )
      setMaterials(serviceMaterials)
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error)
    }
  }

  const handleServiceChange = (serviceId) => {
    setOrderForm({...orderForm, service_id: serviceId})
    if (serviceId) {
      fetchMaterialsForService(serviceId)
    }
  }

  const toggleMaterial = (material) => {
    const isSelected = selectedMaterials.find(m => m.id === material.id)
    if (isSelected) {
      setSelectedMaterials(selectedMaterials.filter(m => m.id !== material.id))
    } else {
      setSelectedMaterials([...selectedMaterials, material])
    }
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const resetForm = () => {
    setCurrentStep(0)
    setOrderForm({
      executer_id: '',
      service_id: '',
      total_sum: '',
      status: 'pending',
      payment_status: 'pending'
    })
    setSelectedMaterials([])
    setMaterials([])
  }

  // Добавление заказа
  const handleAddOrder = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/orders/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          ...orderForm,
          materials: selectedMaterials.map(m => m.id)
        })
      })

      if (response.ok) {
        setShowOrderModal(false)
        resetForm()
        if (onAdd) onAdd()
        message.success('Заказ успешно добавлен')
      } else {
        const error = await response.json()
        message.error(error.error || 'Ошибка при добавлении заказа')
      }
    } catch (error) {
      console.error('Ошибка при добавлении заказа:', error)
      message.error('Ошибка при добавлении заказа')
    }
  }

  const steps = [
    'Выбор исполнителя',
    'Выбор услуги',
    'Выбор материалов',
    'Цена и статус'
  ]

  const renderStepContent = () => {
    switch(currentStep) {
      case 0:
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">Шаг 1: Выберите исполнителя</h3>
            <Select
              placeholder="Выберите исполнителя"
              value={orderForm.executer_id}
              onChange={value => setOrderForm({...orderForm, executer_id: value})}
              style={{ width: '100%' }}
              size="large"
            >
              {executors.map(executor => (
                <Select.Option key={executor.id} value={executor.id}>
                  {executor.name} ({executor.telegram_id}) - Рейтинг: {executor.rating}/5
                </Select.Option>
              ))}
            </Select>
          </div>
        )
      case 1:
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">Шаг 2: Выберите услугу</h3>
            <Select
              placeholder="Выберите услугу"
              value={orderForm.service_id}
              onChange={handleServiceChange}
              style={{ width: '100%' }}
              size="large"
            >
              {services.map(service => (
                <Select.Option key={service.id} value={service.id}>
                  {service.name} - Требуется ключей: {service.required_keys}
                </Select.Option>
              ))}
            </Select>
          </div>
        )
      case 2:
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">Шаг 3: Выберите материалы для заказа</h3>
            <div className="mb-4">
              <span className="text-green-600 font-medium">
                Выбрано материалов: {selectedMaterials.length} из {materials.length}
              </span>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {materials.map(material => (
                <div
                  key={material.id}
                  className={`p-3 border rounded cursor-pointer transition ${
                    selectedMaterials.find(m => m.id === material.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleMaterial(material)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{material.type_key}:</span>
                      <span className="ml-2 font-mono text-sm">{material.contents}</span>
                    </div>
                    <span className="text-xs text-green-600">
                      {selectedMaterials.find(m => m.id === material.id) ? '✓' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {materials.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                Нет доступных материалов для выбранной услуги
              </div>
            )}
          </div>
        )
      case 3:
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">Шаг 4: Укажите цену и статус</h3>
            <Input
              placeholder="Цена заказа (₽)"
              value={orderForm.total_sum}
              onChange={e => setOrderForm({...orderForm, total_sum: e.target.value})}
              style={{ marginBottom: 16 }}
              size="large"
              type="number"
            />
            <Select
              placeholder="Статус заказа"
              value={orderForm.status}
              onChange={value => setOrderForm({...orderForm, status: value})}
              style={{ width: '100%', marginBottom: 16 }}
              size="large"
            >
              <Select.Option value="pending">Ожидает</Select.Option>
              <Select.Option value="in_progress">Выполняется</Select.Option>
              <Select.Option value="completed">Завершен</Select.Option>
            </Select>
            <Select
              placeholder="Статус оплаты"
              value={orderForm.payment_status}
              onChange={value => setOrderForm({...orderForm, payment_status: value})}
              style={{ width: '100%' }}
              size="large"
            >
              <Select.Option value="pending">Ожидает оплаты</Select.Option>
              <Select.Option value="paid">Оплачен</Select.Option>
              <Select.Option value="failed">Ошибка оплаты</Select.Option>
            </Select>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
      <div
        className="flex bg-white shadow p-6 rounded-4xl items-center justify-between mb-6"
      >
        <h1 className="text-2xl font-bold text-black">Управление заказами</h1>
        <div className="flex gap-2">
          <Button
            type="primary"
            size="large"
            style={{
              background: "linear-gradient(to right, #3b82f6, #06b6d4)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff"
            }}
            onClick={() => setShowOrderModal(true)}
          >
            + Добавить заказ
          </Button>
        </div>
      </div>

      {/* Модальное окно для добавления заказа */}
      <Modal
        open={showOrderModal}
        title={`Добавление заказа - ${steps[currentStep]}`}
        onCancel={() => {
          setShowOrderModal(false)
          resetForm()
        }}
        footer={[
          <Button
            key="prev"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            Назад
          </Button>,
          currentStep < 3 ? (
            <Button
              key="next"
              type="primary"
              onClick={handleNext}
              disabled={
                (currentStep === 0 && !orderForm.executer_id) ||
                (currentStep === 1 && !orderForm.service_id) ||
                (currentStep === 2 && selectedMaterials.length === 0)
              }
            >
              Далее
            </Button>
          ) : (
            <Button
              key="submit"
              type="primary"
              onClick={handleAddOrder}
              disabled={!orderForm.total_sum}
            >
              Создать заказ
            </Button>
          ),
          <Button
            key="cancel"
            onClick={() => {
              setShowOrderModal(false)
              resetForm()
            }}
          >
            Отмена
          </Button>
        ]}
        width={700}
      >
        {/* Индикатор шагов */}
        <div className="flex justify-between mb-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex-1 text-center pb-2 border-b-2 ${
                index <= currentStep
                  ? 'border-blue-500 text-blue-600'
                  : 'border-gray-300 text-gray-400'
              }`}
            >
              <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white ${
                index <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                {index + 1}
              </div>
              <span className="text-xs">{step}</span>
            </div>
          ))}
        </div>

        {/* Содержимое шага */}
        <div className="min-h-[300px]">
          {renderStepContent()}
        </div>
      </Modal>
    </>
  )
}