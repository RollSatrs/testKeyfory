import { FaEdit, FaTrash, FaUpload } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { Table, Tag, Button, Modal, Input, Select, Space, Popconfirm, message, Upload } from 'antd'

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
  const [uploadModal, setUploadModal] = useState(false)
  const [selectedService, setSelectedService] = useState(null)
  const [fileList, setFileList] = useState([])
  const [manualInput, setManualInput] = useState('')
  const [form, setForm] = useState({
    id: null,
    name: '',
    category: '',
    required_keys: 1,
    status: '',
    price: 0
  })

  useEffect(() => {
    fetchServices()
  }, [refresh])

  async function fetchServices() {
    const res = await fetch('http://localhost:3000/api/services/admin/get', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    })
    const data = await res.json()
    setServices(data)
  }

  async function handleDelete(id) {
    await fetch(`http://localhost:3000/api/services/admin/delete/${id}`, {
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
      status: service.status,
      price: service.price || 0
    })
    setEditForm(true)
  }

  function handleChange(name, value) {
    setForm({ ...form, [name]: value })
  }

  async function handleEditSubmit() {
    await fetch(`http://localhost:3000/api/services/admin/update/${form.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      },
      body: JSON.stringify({
        name: form.name,
        category: form.category,
        required_keys: form.required_keys,
        status: form.status,
        price: parseFloat(form.price) || 0
      })
    })
    setEditForm(false)
    fetchServices()
    if (onChange) onChange()
    message.success('Услуга обновлена')
  }

  // Функция для открытия модального окна загрузки расходников
  function openUploadModal(service) {
    setSelectedService(service)
    setUploadModal(true)
    setFileList([])
    setManualInput('')
  }

  // Функция загрузки расходников из файла
  const handleFileUpload = async (options) => {
    const { file } = options

    if (!selectedService) {
      message.error('Услуга не выбрана')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('service_id', selectedService.id)

    try {
      const response = await fetch('http://localhost:3000/api/materials/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        message.success(`Загружено ${result.count || 0} расходников`)
        setUploadModal(false)
        fetchServices()
        if (onChange) onChange()
      } else {
        message.error('Ошибка при загрузке файла')
      }
    } catch (error) {
      message.error('Ошибка при загрузке файла')
    }
  }

  // Функция добавления расходника вручную
  const handleManualAdd = async () => {
    if (!manualInput.trim() || !selectedService) {
      message.error('Введите содержимое расходника')
      return
    }

    try {
      const response = await fetch('http://localhost:3000/api/materials/admin/add-single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          service_id: selectedService.id,
          contents: manualInput.trim(),
          type_key: 'manual'
        })
      })

      if (response.ok) {
        message.success('Расходник добавлен')
        setManualInput('')
        setUploadModal(false)
        fetchServices()
        if (onChange) onChange()
      } else {
        message.error('Ошибка при добавлении расходника')
      }
    } catch (error) {
      message.error('Ошибка при добавлении расходника')
    }
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
      title: 'Ключи',
      dataIndex: 'keys',
      key: 'keys',
      render: (_, record) => {
        const required = record.required_keys ?? 0;
        const available = record.available_keys ?? 0; // это поле должно приходить с бэка!
        let color = available >= required ? 'green' : available > 0 ? 'red' : 'gray';

        return (
          <div>
            <div style={{ marginBottom: 4, color: '#666' }}>Требуются ключи</div>
            <div style={{ color, fontWeight: 500, fontSize: '14px' }}>
              Доступно: {available} из {required} ключей
            </div>
          </div>
        );
      }
    },
    {
      title: 'Цена',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `₽${price || 0}`
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
            icon={<FaUpload />}
            onClick={() => openUploadModal(record)}
            size="small"
            type="primary"
            ghost
            title="Загрузить расходники"
          />
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
          step={0.01}
          value={form.price}
          onChange={e => handleChange('price', e.target.value)}
          placeholder="Цена услуги (₽)"
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

      {/* Модальное окно загрузки расходников */}
      <Modal
        open={uploadModal}
        title={`Загрузить расходники для "${selectedService?.name}"`}
        onCancel={() => setUploadModal(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 24 }}>
          <h4>Загрузить из файла (.csv, .xlsx, .txt)</h4>
          <p style={{ color: '#666', marginBottom: 16 }}>
            Каждая строка файла = один расходник (ключ, код и т.д.)
          </p>
          <Upload.Dragger
            customRequest={handleFileUpload}
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            accept=".csv,.xlsx,.txt"
            maxCount={1}
          >
            <p className="ant-upload-drag-icon">📁</p>
            <p className="ant-upload-text">Нажмите или перетащите файл сюда</p>
            <p className="ant-upload-hint">Поддерживаются файлы .csv, .xlsx, .txt</p>
          </Upload.Dragger>
        </div>

        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 24 }}>
          <h4>Или добавить вручную</h4>
          <Input.TextArea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Введите содержимое расходника (ключ, код и т.д.)"
            rows={3}
            style={{ marginBottom: 16 }}
          />
          <Button
            type="primary"
            onClick={handleManualAdd}
            disabled={!manualInput.trim()}
          >
            Добавить расходник
          </Button>
        </div>
      </Modal>
    </div>
  )
}