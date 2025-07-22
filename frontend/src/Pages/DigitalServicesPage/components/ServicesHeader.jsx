import { useState } from 'react'

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
  "Общение и знакомства"
];

export function ServicesHeader({ onAdd, children }) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: '',
    required_keys: 1,
    status: 'АКТИВНА'
  })

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
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
      {/* Контент страницы */}
      <div>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex bg-white shadow p-6 rounded-4xl items-center justify-between">
            <h1 className="text-2xl font-bold">Управление услугами</h1>
            <button
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 hover:from-blue-600 hover:to-cyan-600 transition"
              onClick={() => setShowModal(true)}
            >
              + Добавить услугу
            </button>
          </div>
          {children}
        </div>
      </div>
      {/* Модальное окно по центру, без blur */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-40 backdrop-blur-sm transition-all">
          <form
            className="bg-gradient-to-br from-white via-gray-50 to-blue-50 p-8 rounded-2xl shadow-2xl flex flex-col gap-6 min-w-[340px] animate-fade-in"
            onSubmit={handleSubmit}
            style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}
          >
            <h2 className="text-2xl font-bold mb-2 text-blue-700 text-center">Добавить услугу</h2>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Название услуги"
              className="border border-blue-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
            />
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="border border-blue-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
            >
              <option value="" disabled>Выберите категорию</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              name="required_keys"
              type="number"
              min={1}
              value={form.required_keys}
              onChange={handleChange}
              placeholder="Требуется ключей"
              className="border border-blue-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
            />
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="border border-blue-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            >
              <option value="АКТИВНА">АКТИВНА</option>
              <option value="НЕАКТИВНА">НЕАКТИВНА</option>
            </select>
            <div className="flex gap-3 justify-end mt-2">
              <button
                type="button"
                className="px-5 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition font-medium"
                onClick={() => setShowModal(false)}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow hover:from-blue-600 hover:to-cyan-600 transition"
              >
                Сохранить
              </button>
            </div>
          </form>
          {/* Анимация появления */}
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