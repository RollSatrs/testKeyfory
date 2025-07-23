import { FaEdit, FaTrash } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { Table, Tag, Button, Modal, Input, Select, Space, Popconfirm, message } from 'antd'

const categories = [
  "Игры", "Программное обеспечение", "Образование", "Развлечения", "Услуги", "Другое", "Музыка",
  "Видео и кино", "Социальные сети", "Облако и хостинг", "Безопасность", "VPN и прокси",
  "Дизайн и графика", "Разработка", "Фриланс", "Путешествия и билеты", "Электронные книги",
  "Новости и СМИ", "Почта и коммуникации", "Финансы и банки", "Онлайн-магазины", "Здоровье и спорт",
  "Авто и транспорт", "Дом и быт", "Для бизнеса", "Подарочные карты", "Мобильные приложения",
  "Фото и видео", "Технологии", "Криптовалюты", "Маркетинг", "Общение и знакомства"
];

export function ServicesTable({ refresh, onChange, search = '', statusFilter = '', categoryFilter = '' }) {
  const [services, setServices] = useState([])
  const [editForm, setEditForm] = useState(false)
  const [form, setForm] = useState({
    id: null,
    name: '',
    category: '',
    required_keys: 1,
    price: '',
    status: ''
  })

  useEffect(() => {
    fetchServices()
  }, [refresh])

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
    if (onChange) onChange()
    message.success('Услуга удалена')
  }

  function openEditModal(service) {
    setForm({
      id: service.id,
      name: service.name,
      category: service.category,
      required_keys: service.required_keys,
      status: service.status
    })
    setEditForm(true)
  }

  function handleChange(name, value) {
    setForm({ ...form, [name]: value })
  }

  async function handleEditSubmit() {
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
    if (onChange) onChange()
    message.success('Услуга обновлена')
  }

  // Фильтрация перед отображением
  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter ? s.status === statusFilter : true) &&
    (categoryFilter ? s.category === categoryFilter : true)
  );

  const columns = [
    {
      title: 'Название услуги',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Требуется ключей',
      dataIndex: 'required_keys',
      key: 'required_keys',
    },

    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={
          status === 'active' ? 'green' :
          status === 'inactive' ? 'orange' :
          status === 'ОЖИДАЕТ' ? 'default' :
          status === 'ЗАВЕРШЕНА' ? 'blue' : 'default'
        }>
          {status === 'active' ? 'АКТИВНА' : status === 'inactive' ? 'НЕАКТИВНА' : status}
        </Tag>
      )
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<FaEdit />}
            onClick={() => openEditModal(record)}
            size="small"
          />
          <Popconfirm
            title="Удалить услугу?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button
              icon={<FaTrash />}
              danger
              size="small"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <Table
        columns={columns}
        dataSource={filteredServices}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        bordered
      />
      <Modal
        open={editForm}
        title="Редактировать услугу"
        onCancel={() => setEditForm(false)}
        onOk={handleEditSubmit}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Input
          name="name"
          value={form.name}
          onChange={e => handleChange('name', e.target.value)}
          placeholder="Название услуги"
          style={{ marginBottom: 16 }}
        />
        <Select
          name="category"
          value={form.category || undefined}
          onChange={value => handleChange('category', value)}
          placeholder="Выберите категорию"
          className="w-full"
          style={{ marginBottom: 16 }}
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
          style={{ marginBottom: 16 }}
        />
        <Input
          name="price"
          type="number"
          min={0}
          value={form.price}
          onChange={e => handleChange('price', e.target.value)}
          placeholder="Цена (₽)"
          style={{ marginBottom: 16 }}
        />
        <Select
          name="status"
          value={form.status || undefined}
          onChange={value => handleChange('status', value)}
          placeholder="Выберите статус"
          className="w-full"
          style={{ marginBottom: 8 }}
        >
          <Select.Option value="active">АКТИВНА</Select.Option>
          <Select.Option value="inactive">НЕАКТИВНА</Select.Option>
        </Select>
      </Modal>
    </div>
  )
}