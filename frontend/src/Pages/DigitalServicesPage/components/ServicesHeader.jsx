import { useState } from 'react'
import { Input, Select, Button } from 'antd'

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
  "Общение и знакомства"
];

export function ServicesHeader({ onAdd, children }) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: '',
    required_keys: '',
    price: '',
    status: ''
  })

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    await fetch('http://localhost:3000/api/services/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      },
      body: JSON.stringify(form)
    })
    setShowModal(false)
    if (onAdd) onAdd()
  }

  return (
    <>
      <div>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex bg-white shadow p-6 rounded-4xl items-center justify-between">
            <h1 className="text-2xl font-bold">Управление услугами</h1>
            <Button
              type="primary"
              style={{
                background: "linear-gradient(to right, #3b82f6, #06b6d4)",
                border: "none"
              }}
              onClick={() => {
                setForm({
                  name: '',
                  category: '',
                  required_keys: '',
                  price: '',
                  status: ''
                });
                setShowModal(true);
              }}
            >
              + Добавить услугу
            </Button>
          </div>
          {children}
        </div>
      </div>
      {showModal && (
        <div className="h-full fixed inset-0 flex items-center justify-center z-50 bg-opacity-40 backdrop-blur-sm transition-all">
          <form
            className="bg-gradient-to-br from-white via-gray-50 to-blue-50 p-8 rounded-2xl shadow-2xl flex flex-col gap-6 min-w-[340px] animate-fade-in"
            onSubmit={handleSubmit}
            style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}
          >
            <h2 className="text-2xl font-bold mb-2 text-blue-700 text-center">Добавить услугу</h2>
            <Input
              name="name"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="Название услуги"
              required
            />
            <Select
              name="category"
              value={form.category || undefined} // важно!
              onChange={value => handleChange('category', value)}
              placeholder="Выберите категорию"
              className="w-full"
              required
            >
              {categories.map(cat => (
                <Select.Option key={cat} value={cat}>{cat}</Select.Option>
              ))}
            </Select>
            <Input
              name="required_keys"
              type="number"
              min={1}
              value={form.required_keys}
              onChange={e => handleChange('required_keys', e.target.value)}
              placeholder="Требуется ключей"
              required
            />
            <Select
              name="status"
              value={form.status || undefined}
              onChange={value => handleChange('status', value)}
              placeholder="Выберите статус"
              className="w-full"
              required
            >
              <Select.Option value="active">АКТИВНА</Select.Option>
              <Select.Option value="inactive">НЕАКТИВНА</Select.Option>
            </Select>
            <div className="flex gap-3 justify-end mt-2">
              <Button
                type="default"
                onClick={() => setShowModal(false)}
              >
                Отмена
              </Button>
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