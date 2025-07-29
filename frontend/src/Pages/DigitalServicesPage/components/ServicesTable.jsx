import { FaEdit, FaTrash, FaUpload, FaBoxOpen } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { Table, Tag, Button, Modal, Input, Select, Space, Popconfirm, message, Upload, Card, Row, Col, Statistic, Divider } from 'antd'

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
  const [apiModal, setApiModal] = useState(false)
  const [manualModal, setManualModal] = useState(false)
  const [materialsModal, setMaterialsModal] = useState(false)
  const [selectedService, setSelectedService] = useState(null)
  const [serviceMaterials, setServiceMaterials] = useState([])
  const [materialStats, setMaterialStats] = useState(null)
  const [fileList, setFileList] = useState([])
  const [manualInput, setManualInput] = useState('')
  const [apiConfig, setApiConfig] = useState({ url: '', headers: '', method: 'GET' })
  const [form, setForm] = useState({
    id: null,
    name: '',
    category: '',
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

    // Определяем какое окно открыть в зависимости от способа загрузки услуги
    const loadingMethod = service.loadingMethod || 'file' // по умолчанию файл

    switch(loadingMethod) {
      case 'file':
        setUploadModal(true)
        setFileList([])
        break
      case 'api':
        setApiModal(true)
        setApiConfig({ url: '', headers: '', method: 'GET' })
        break
      case 'manual':
      default:
        setManualModal(true)
        setManualInput('')
        break
    }
  }

  // Функция для открытия модального окна с материалами
  async function openMaterialsModal(service) {
    setSelectedService(service)
    setMaterialsModal(true)

    try {
      // Загружаем материалы
      const materialsResponse = await fetch(`http://localhost:3000/api/materials/admin/service/${service.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })

      // Загружаем статистику
      const statsResponse = await fetch(`http://localhost:3000/api/materials/admin/service/${service.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })

      if (materialsResponse.ok && statsResponse.ok) {
        const materials = await materialsResponse.json()
        const stats = await statsResponse.json()
        setServiceMaterials(materials)
        setMaterialStats(stats)
      } else {
        message.error('Ошибка при загрузке материалов')
        setServiceMaterials([])
        setMaterialStats(null)
      }
    } catch (error) {
      message.error('Ошибка при загрузке материалов')
      setServiceMaterials([])
      setMaterialStats(null)
    }
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

  // Функция для перевода источника на русский
  const getSourceLabel = (source) => {
    const sourceLabels = {
      'manual': 'Ручной ввод',
      'manual_input': 'Ручной ввод',
      'api': 'API',
      'file': 'Файл',
      'file_upload': 'Загрузка файла',
      'upload': 'Загрузка'
    }
    return sourceLabels[source] || source || 'Ручной ввод'
  }

  // Функция для перевода типа ключа на русский
  const getTypeLabel = (type) => {
    const typeLabels = {
      'key': 'Ключ',
      'license': 'Лицензия',
      'code': 'Код',
      'password': 'Пароль',
      'account': 'Аккаунт',
      'token': 'Токен',
      'imported': 'Импортирован',
      'manual': 'Ручной'
    }
    return typeLabels[type] || type || 'Ключ'
  }

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
      title: 'Расходники',
      key: 'materials',
      render: (_, record) => (
        <Button
          size="small"
          onClick={() => openMaterialsModal(record)}
          icon={<FaBoxOpen />}
        >
          Посмотреть ключи
        </Button>
      )
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

      {/* Модальное окно просмотра материалов */}
      <Modal
        open={materialsModal}
        title={`Расходники для "${selectedService?.name}"`}
        onCancel={() => {
          setMaterialsModal(false)
          setMaterialStats(null)
        }}
        footer={null}
        width={1400}
      >
        {/* Статистика материалов */}
        {materialStats && (
          <div style={{ marginBottom: 24 }}>
            <Card>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="Всего материалов"
                    value={materialStats.stats.total}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Доступно"
                    value={materialStats.stats.available}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Использовано"
                    value={materialStats.stats.used}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="На замене"
                    value={materialStats.stats.pending_replace}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
              </Row>
            </Card>
          </div>
        )}

        {/* Таблица материалов */}
        {serviceMaterials.length > 0 ? (
          <Table
            dataSource={serviceMaterials}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
            columns={[
              {
                title: 'ID',
                dataIndex: 'id',
                key: 'id',
                width: 60
              },
              {
                title: 'Содержимое (Ключ/Код)',
                dataIndex: 'contents',
                key: 'contents',
                ellipsis: true
              },
              {
                title: 'Статус',
                dataIndex: 'status',
                key: 'status',
                width: 120,
                render: (status) => {
                  const statusColors = {
                    'available': 'green',
                    'used': 'red',
                    'pending_replace': 'orange',
                    'replaced': 'gray'
                  }
                  const statusTexts = {
                    'available': 'Доступен',
                    'used': 'Использован',
                    'pending_replace': 'На замене',
                    'replaced': 'Использован'
                  }
                  return (
                    <Tag color={statusColors[status] || 'default'}>
                      {statusTexts[status] || status}
                    </Tag>
                  )
                }
              },
              {
                title: 'Источник',
                dataIndex: 'source',
                key: 'source',
                width: 120,
                render: (source) => getSourceLabel(source)
              },
              {
                title: 'Дата добавления',
                dataIndex: 'added_date',
                key: 'added_date',
                width: 120,
                render: (date) => date ? new Date(date).toLocaleDateString('ru-RU') : '-'
              },
              {
                title: 'Дата использования',
                dataIndex: 'used_date',
                key: 'used_date',
                width: 140,
                render: (date, record) => {
                  if (record.status === 'used' || record.status === 'replaced' || record.status === 'pending_replace') {
                    return date ? new Date(date).toLocaleString('ru-RU', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'
                  }
                  return '-'
                }
              },
              {
                title: 'Дата запроса замены',
                dataIndex: 'replacement_requested_date',
                key: 'replacement_requested_date',
                width: 150,
                render: (date, record) => {
                  if (record.status === 'pending_replace') {
                    return date ? new Date(date).toLocaleString('ru-RU', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'
                  }
                  return '-'
                }
              }
            ]}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Нет расходников для этой услуги</p>
            <Button type="primary" onClick={() => {
              setMaterialsModal(false)
              openUploadModal(selectedService)
            }}>
              Добавить расходники
            </Button>
          </div>
        )}
      </Modal>

      {/* Модальное окно для API загрузки */}
      <Modal
        open={apiModal}
        title={`Настройка API для "${selectedService?.name}"`}
        onCancel={() => setApiModal(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 24 }}>
          <h4>Настройки API</h4>
          <p style={{ color: '#666', marginBottom: 16 }}>
            Настройте API для автоматической загрузки расходников
          </p>

          <div style={{ marginBottom: 16 }}>
            <label>URL API:</label>
            <Input
              value={apiConfig.url}
              onChange={(e) => setApiConfig({...apiConfig, url: e.target.value})}
              placeholder="https://api.example.com/materials"
              style={{ marginTop: 8 }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Метод:</label>
            <Select
              value={apiConfig.method}
              onChange={(value) => setApiConfig({...apiConfig, method: value})}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Select.Option value="GET">GET</Select.Option>
              <Select.Option value="POST">POST</Select.Option>
            </Select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Заголовки (JSON):</label>
            <Input.TextArea
              value={apiConfig.headers}
              onChange={(e) => setApiConfig({...apiConfig, headers: e.target.value})}
              placeholder='{"Authorization": "Bearer your-token", "Content-Type": "application/json"}'
              rows={3}
              style={{ marginTop: 8 }}
            />
          </div>

          <Button type="primary" onClick={() => {
            message.info('API настройка сохранена (функция в разработке)')
            setApiModal(false)
          }}>
            Сохранить настройки API
          </Button>
        </div>
      </Modal>

      {/* Модальное окно для ручного ввода */}
      <Modal
        open={manualModal}
        title={`Добавить расходники для "${selectedService?.name}"`}
        onCancel={() => setManualModal(false)}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: 24 }}>
          <h4>Ручное добавление</h4>
          <p style={{ color: '#666', marginBottom: 16 }}>
            Введите содержимое расходника (ключ, код и т.д.)
          </p>
          <Input.TextArea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Введите содержимое расходника (ключ, код и т.д.)"
            rows={4}
            style={{ marginBottom: 16 }}
          />
          <Button
            type="primary"
            onClick={handleManualAdd}
            disabled={!manualInput.trim()}
            block
          >
            Добавить расходник
          </Button>
        </div>
      </Modal>
    </div>
  )
}