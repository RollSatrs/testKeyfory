import { FaEdit, FaTrash } from 'react-icons/fa'
import React, { useEffect, useState } from 'react'

export function ServicesTable({ refresh }) {
  const [services, setServices] = useState([])
  const [editForm, setEditForm] = useState(false)
  const [form, setForm] = useState({
    id: null,
    name: '',
    category: '',
    required_keys: 1,
    price: '',
    status: 'АКТИВНА'
  })

  useEffect(() => {
    fetchServices()
  }, [refresh]) // обновлять при изменении refresh

  async function fetchServices() {
    const res = await fetch('http://localhost:3000/api/services/get', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    })
    const data = await res.json()
    setServices(data)
  }

  async function handleDelete(id) {
    await fetch(`http://localhost:3000/api/services/delete/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    })
    fetchServices()
  }

  function openEditModal(service) {
    setForm({
      id: service.id,
      name: service.name,
      category: service.category,
      required_keys: service.required_keys,
      price: service.price,
      status: service.status
    })
    setEditForm(true)
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    await fetch(`http://localhost:3000/api/services/update/${form.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      },
      body: JSON.stringify({
        name: form.name,
        category: form.category,
        required_keys: form.required_keys,
        price: form.price,
        status: form.status
      })
    })
    setEditForm(false)
    fetchServices()
  }

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <table className="min-w-full">
        <thead>
          <tr className="text-gray-500 text-left text-sm">
            <th className="pb-2">Название услуги</th>
            <th className="pb-2">Категория</th>
            <th className="pb-2">Требуется ключей</th>
            <th className="pb-2">Цена</th>
            <th className="pb-2">Статус</th>
            <th className="pb-2">Действия</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s, idx) => (
            <tr key={idx} className={idx !== services.length - 1 ? "border-b border-gray-100" : ""}>
              <td className="py-2">{s.name}</td>
              <td className="py-2">{s.category}</td>
              <td className="py-2">{s.required_keys}</td>
              <td className="py-2">{s.price} ₽</td>
              <td className="py-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    s.status === 'АКТИВНА' ? 'bg-green-50 text-green-600'
                    : s.status === 'НЕАКТИВНА' ? 'bg-yellow-50 text-yellow-700'
                    : s.status === 'ОЖИДАЕТ' ? 'bg-gray-100 text-gray-500'
                    : s.status === 'ЗАВЕРШЕНА' ? 'bg-blue-50 text-blue-600'
                    : ''
                  }`}
                >
                  {s.status}
                </span>
              </td>
              <td className="py-2 flex gap-2">
                <button
                  className="bg-gray-100 p-2 rounded hover:bg-gray-200"
                  onClick={() => openEditModal(s)}
                >
                  <FaEdit className="text-gray-500" size={16} />
                </button>
                <button
                  className="bg-red-100 p-2 rounded hover:bg-red-200"
                  onClick={() => handleDelete(s.id)}
                >
                  <FaTrash className="text-red-500" size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-40 backdrop-blur-sm transition-all">
          <form
            className="bg-gradient-to-br from-white via-gray-50 to-blue-50 p-8 rounded-2xl shadow-2xl flex flex-col gap-6 min-w-[340px] animate-fade-in"
            onSubmit={handleEditSubmit}
            style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}
          >
            <h2 className="text-2xl font-bold mb-2 text-blue-700 text-center">Редактировать услугу</h2>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Название услуги"
              className="border border-blue-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
            />
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Категория"
              className="border border-blue-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              required
            />
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
            <input
              name="price"
              type="number"
              min={0}
              value={form.price || ''}
              onChange={handleChange}
              placeholder="Цена (₽)"
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
                onClick={() => setEditForm(false)}
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
    </div>
  )
}