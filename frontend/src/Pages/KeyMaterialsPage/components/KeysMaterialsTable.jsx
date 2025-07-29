import { FaEdit, FaTrash } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { Table, Tag, Button, Modal, Input, Select, Space, Popconfirm, message } from 'antd'
import { CSVLink } from 'react-csv'
import { DownloadOutlined } from '@ant-design/icons'

let successCount = 0



async function getMateriallsServices(nameService) {
  try{
    await fetch('http://localhost:3000/api/materials/admin/:', {
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
    await fetch('http://localhost:3000/api/materials/admin/add', {
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

export function KeysMaterialsTable({ refresh, onChange, search = '', statusFilter = '', typeFilter = '' }) {
  const [materials, setMaterials] = useState([])
  const [services, setServices] = useState([])
  const [editForm, setEditForm] = useState(false)
  const [form, setForm] = useState({
    id: null,
    type_key: '',
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
      const res = await fetch('http://localhost:3000/api/materials/admin/get', {
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
      const res = await fetch('http://localhost:3000/api/services/admin/get', {
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
      await fetch(`http://localhost:3000/api/materials/admin/delete/${id}`, {
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

  function openEditModal(material) {
    setForm({
      id: material.id,
      type_key: material.type_key,
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
      await fetch(`http://localhost:3000/api/materials/admin/update/${form.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          type_key: form.type_key,
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
    (m.contents?.toLowerCase().includes(search.toLowerCase()) ||m.type_key?.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter ? m.status === statusFilter : true) &&
    (typeFilter ? m.type_key === typeFilter : true)
  );
  console.log(filteredMaterials)

  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Неизвестная услуга';
  }

  const headers = [
    { label: 'Тип матриала', key: 'type_key' },
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
      title: 'Тип',
      dataIndex: 'type_key',
      key: 'type_key',
    },
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
      render: (status) => (
        <Tag color={
          status === 'available' ? 'green' :
          status === 'used' ? 'red' :
          status === 'reserved' ? 'orange' :
          status === 'pending_replace' ? 'purple' : 'default'
        }>
          {status === 'available' ? 'ДОСТУПЕН' :
           status === 'used' ? 'ИСПОЛЬЗОВАН' :
           status === 'reserved' ? 'ЗАРЕЗЕРВИРОВАН' :
           status === 'pending_replace' ? 'НА ЗАМЕНУ' : status}
        </Tag>
      )
    },
    {
      title: 'Источник',
      dataIndex: 'source',
      key: 'source',
      render: (source) => source || 'manual'
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
          name="type_key"
          value={form.type_key || undefined}
          onChange={value => handleChange('type_key', value)}
          placeholder="Тип материала"
          className="w-full"
          style={{ marginBottom: 16 }}
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
          <Select.Option value="available">ДОСТУПЕН</Select.Option>
          <Select.Option value="used">ИСПОЛЬЗОВАН</Select.Option>
          <Select.Option value="reserved">ЗАРЕЗЕРВИРОВАН</Select.Option>
        </Select>
      </Modal>
    </div>
  )
}