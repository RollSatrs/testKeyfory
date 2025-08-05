import { FaEdit, FaTrash } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { Table, Tag, Button, Modal, Input, Select, Space, Popconfirm, message, Tooltip } from 'antd'
import { CSVLink } from 'react-csv'
import { DownloadOutlined } from '@ant-design/icons'

let successCount = 0



async function getMateriallsServices(nameService) {
  try{
    await fetch('http://localhost:3000/api/admin/materials/service', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    })
  }catch{
    console.log('Ошибка', err)
  }
}

async function addMaterialls(row) {
  try{
    await fetch('http://localhost:3000/api/admin/materials/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      },
      body: JSON.stringify(row)
    })
    successCount++
  }catch(err){
    console.log('Ошибка' ,err)
  }
}

export function KeysMaterialsTable({ refresh, onChange, search = '', statusFilter = '' }) {
  const [materials, setMaterials] = useState([])
  const [services, setServices] = useState([])
  const [editForm, setEditForm] = useState(false)
  const [form, setForm] = useState({
    id: null,
    service_id: '',
    contents: '',
    status: ''
  })

  useEffect(() => {
    fetchMaterials()
    fetchServices()
  }, [refresh])

  async function fetchMaterials() {
    try {
      const res = await fetch('http://localhost:3000/api/admin/materials/get', {
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

  async function fetchServices() {
    try {
      const res = await fetch('http://localhost:3000/api/admin/services/get', {
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

  async function handleDelete(id) {
    try {
      await fetch(`http://localhost:3000/api/admin/materials/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      fetchMaterials()
      if (onChange) onChange()
      message.success('Материал удален')
    } catch (error) {
      message.error('Ошибка при удалении материала')
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      await fetch(`http://localhost:3000/api/admin/materials/update-status/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      fetchMaterials()
      if (onChange) onChange()
      message.success('Статус материала обновлен')
    } catch (error) {
      message.error('Ошибка при обновлении статуса')
    }
  }

  function openEditModal(material) {
    setForm({
      id: material.id,
      service_id: material.service_id,
      contents: material.contents,
      status: material.status
    })
    setEditForm(true)
  }

  function handleChange(name, value) {
    setForm({ ...form, [name]: value })
  }

  async function handleEditSubmit() {
    try {
      await fetch(`http://localhost:3000/api/admin/materials/update/${form.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          service_id: form.service_id,
          contents: form.contents,
          status: form.status
        })
      })
      setEditForm(false)
      fetchMaterials()
      if (onChange) onChange()
      message.success('Материал обновлен')
    } catch (error) {
      message.error('Ошибка при обновлении материала')
    }
  }

  // Фильтрация перед отображением
  const filteredMaterials = materials.filter(m =>
    m.contents?.toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter ? m.status === statusFilter : true)
  );
  console.log(filteredMaterials)

  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Неизвестная услуга';
  }

  // Функция для перевода источника на русский
  const getSourceLabel = (source) => {
    const sourceLabels = {
      'manual': 'Ручной ввод',
      'manual_input': 'Ручной ввод',
      'api': 'API',
      'file': 'Со склада',
      'file_upload': 'Со склада',
      'upload': 'Со склада',
      'warehouse': 'Со склада'
    }
    return sourceLabels[source] || source || 'Со склада'
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

  const headers = [
    { label: 'Название услуги', key: 'service_name' },
    { label: 'Содержимое', key: 'contents' },
    { label: 'Статус', key: 'status' },
    { label: 'Источник', key: 'source' }
  ]

  // Преобразуем данные для экспорта
  const exportData = filteredMaterials.map(m => ({
    ...m,
    service_name: getServiceName(m.service_id)
  }))

  const columns = [
    {
      title: 'Услуга',
      dataIndex: 'service_id',
      key: 'service_id',
      render: (serviceId) => getServiceName(serviceId)
    },
    {
      title: 'Содержимое',
      dataIndex: 'contents',
      key: 'contents',
      render: (contents) => (
        <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {contents}
        </div>
      )
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Select
          value={status}
          style={{ width: 140 }}
          size="small"
          onChange={(newStatus) => handleStatusChange(record.id, newStatus)}
        >
          <Select.Option value="available">
            <Tag color="green">Доступен</Tag>
          </Select.Option>
          <Select.Option value="used">
            <Tag color="red">Использован</Tag>
          </Select.Option>
          <Select.Option value="pending_replace">
            <Tag color="volcano">На замене</Tag>
          </Select.Option>
        </Select>
      )
    },
    {
      title: 'Номер заказа',
      dataIndex: 'order_number',
      key: 'order_number',
      width: 150,
      render: (order_number, record) => {
        if (!order_number) {
          return <Tag color="default">Доступен</Tag>
        }

        const executerName = record.executer_name || 'Неизвестный исполнитель'

        return (
          <Tooltip
            title={`Исполнитель: ${executerName}\nНомер заказа: ${order_number}`}
            placement="top"
          >
            <Tag
              color="orange"
              style={{
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              #{order_number}
            </Tag>
          </Tooltip>
        )
      }
    },
    {
      title: 'Источник',
      dataIndex: 'source',
      key: 'source',
      render: (source) => getSourceLabel(source)
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
            title="Удалить материал?"
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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18
      }}>
        <div>
          <h2 style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: 2,
            letterSpacing: '0.5px'
          }}>
            📦 Список материалов
          </h2>
          <div style={{
            color: '#64748b',
            fontSize: '1rem',
            fontWeight: 400,
            marginTop: 2
          }}>
            Здесь отображаются все материалы, доступные для услуг.<br />
            Вы можете <span style={{ color: '#06b6d4', fontWeight: 500 }}>экспортировать</span> данные, а также редактировать и удалять записи.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <CSVLink
            headers={headers}
            data={exportData}
            filename="materials_export.csv"
            separator=";"
            style={{ textDecoration: 'none' }}
          >
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              style={{
                background: "linear-gradient(to right, #3b82f6, #06b6d4)",
                border: "none",
                color: "#fff",
                fontWeight: 500,
                boxShadow: "0 2px 8px 0 rgba(59,130,246,0.15)"
              }}
            >
              Экспорт данных
            </Button>
          </CSVLink>
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={filteredMaterials}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        bordered
        style={{ marginTop: 8 }}
      />
      <Modal
        open={editForm}
        title="Редактировать материал"
        onCancel={() => setEditForm(false)}
        onOk={handleEditSubmit}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Select
          name="service_id"
          value={form.service_id || undefined}
          onChange={value => handleChange('service_id', value)}
          placeholder="Привязать к услуге"
          className="w-full"
          style={{ marginBottom: 16 }}
        >
          {services.map(service => (
            <Select.Option key={service.id} value={service.id}>{service.name}</Select.Option>
          ))}
        </Select>

        <Input
          name="contents"
          value={form.contents}
          onChange={e => handleChange('contents', e.target.value)}
          placeholder="Содержимое (ключ, код и т.п.)"
          style={{ marginBottom: 16 }}
        />

        <Select
          name="status"
          value={form.status || undefined}
          onChange={value => handleChange('status', value)}
          placeholder="Статус материала"
          className="w-full"
          style={{ marginBottom: 8 }}
        >
          <Select.Option value="available">Доступен</Select.Option>
          <Select.Option value="used">Использован</Select.Option>
          <Select.Option value="pending_replace">На замене</Select.Option>
        </Select>
      </Modal>
    </div>
  )
}