import { useState, useEffect } from 'react'
import { Table, Card, Button, Modal, Select, Input, message, DatePicker, Statistic, Row, Col, Popconfirm, Tabs } from 'antd'
import { FaEdit, FaChartLine, FaWallet, FaTrash, FaUser, FaClock, FaCoins } from 'react-icons/fa'

const { RangePicker } = DatePicker

export function ExecuterPricing() {
  const [executers, setExecuters] = useState([])
  const [services, setServices] = useState([])
  const [pricingData, setPricingData] = useState([])
  const [earningsData, setEarningsData] = useState([])
  const [executerStats, setExecuterStats] = useState([])
  const [selectedExecuter, setSelectedExecuter] = useState(null)
  const [dateRange, setDateRange] = useState([])
  const [activeTab, setActiveTab] = useState('pricing')

  useEffect(() => {
    fetchExecuters()
    fetchServices()
    fetchPricingData()
    fetchEarningsData()
    fetchExecuterStats()
  }, [])

  useEffect(() => {
    if (dateRange.length === 2) {
      fetchEarningsData()
      fetchExecuterStats()
    }
  }, [dateRange])

  const fetchExecuters = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/executers/get', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Полученные исполнители:', data)
      setExecuters(data)
    } catch (error) {
      console.error('Ошибка загрузки исполнителей:', error)
      message.error('Ошибка загрузки исполнителей')
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/services/get', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      })
      const data = await response.json()
      setServices(data)
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error)
    }
  }

  const fetchPricingData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/pricing/all', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Полученные данные ценообразования:', data)
      setPricingData(data || [])
    } catch (error) {
      console.error('Ошибка загрузки ценообразования:', error)
      message.error('Ошибка загрузки данных ценообразования')
      setPricingData([])
    }
  }

  const fetchEarningsData = async () => {
    try {
      const url = dateRange.length === 2
        ? `http://localhost:3000/api/admin/earnings/all?from=${dateRange[0].format('YYYY-MM-DD')}&to=${dateRange[1].format('YYYY-MM-DD')}`
        : 'http://localhost:3000/api/admin/earnings/all'

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setEarningsData(data || [])
    } catch (error) {
      console.error('Ошибка загрузки заработка:', error)
      message.error('Ошибка загрузки данных заработка')
      setEarningsData([])
    }
  }

  const fetchExecuterStats = async () => {
    try {
      const url = dateRange.length === 2
        ? `http://localhost:3000/api/admin/earnings/summary?from=${dateRange[0].format('YYYY-MM-DD')}&to=${dateRange[1].format('YYYY-MM-DD')}`
        : 'http://localhost:3000/api/admin/earnings/summary'

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setExecuterStats(data.executer_earnings || [])
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error)
      message.error('Ошибка загрузки статистики исполнителей')
      setExecuterStats([])
    }
  }

  const handleAddPricing = async () => {
    try {
      if (!form.executer_id || !form.service_id || !form.custom_price) {
        message.error('Заполните все поля')
        return
      }

      const response = await fetch('http://localhost:3000/api/admin/pricing/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(form)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      message.success('Индивидуальная цена добавлена')
      setShowPricingModal(false)
      setForm({ executer_id: '', service_id: '', custom_price: '' })
      fetchPricingData()
    } catch (error) {
      console.error('Ошибка при добавлении цены:', error)
      message.error('Ошибка при добавлении цены')
    }
  }

  const getExecuterName = (id) => {
    const executer = executers.find(e => e.id === id)
    return executer ? executer.name || `Исполнитель ${executer.id}` : 'Неизвестно'
  }

  const getServiceName = (id) => {
    const service = services.find(s => s.id === id)
    return service ? service.name : 'Неизвестно'
  }

  const calculateTotalEarnings = () => {
    return earningsData.reduce((sum, item) => sum + (item.amount || 0), 0)
  }

  const handleDeletePricing = async (id) => {
    try {
      const response = await fetch(`http://localhost:3000/api/admin/pricing/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      message.success('Индивидуальная цена удалена')
      fetchPricingData()
    } catch (error) {
      console.error('Ошибка при удалении цены:', error)
      message.error('Ошибка при удалении цены')
    }
  }

  const pricingColumns = [
    {
      title: 'Исполнитель',
      dataIndex: 'executer_name',
      key: 'executer_name',
      render: (name, record) => name || getExecuterName(record.executer_id)
    },
    {
      title: 'Услуга',
      dataIndex: 'service_name',
      key: 'service_name',
      render: (name, record) => name || getServiceName(record.service_id)
    },
    {
      title: 'Базовая цена',
      dataIndex: 'base_price',
      key: 'base_price',
      render: (price) => `${price || 0} ₽`
    },
    {
      title: 'Индивидуальная цена',
      dataIndex: 'custom_price',
      key: 'custom_price',
      render: (price) => `${price || 0} ₽`
    },
    {
      title: 'Дата создания',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? new Date(date).toLocaleDateString('ru-RU') : '-'
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            icon={<FaEdit />}
            size="small"
            onClick={() => {
              setForm({
                executer_id: record.executer_id,
                service_id: record.service_id,
                custom_price: record.custom_price
              })
              setShowPricingModal(true)
            }}
          />
          <Popconfirm
            title="Удалить индивидуальную цену?"
            description="Это действие нельзя отменить"
            onConfirm={() => handleDeletePricing(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button
              icon={<FaTrash />}
              size="small"
              danger
            />
          </Popconfirm>
        </div>
      )
    }
  ]

  const earningsColumns = [
    {
      title: 'Исполнитель',
      dataIndex: 'executer_id',
      key: 'executer_id',
      render: (id) => getExecuterName(id)
    },
    {
      title: 'Услуга',
      dataIndex: 'service_id',
      key: 'service_id',
      render: (id) => getServiceName(id)
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `${amount || 0} ₽`
    },
    {
      title: 'Дата',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('ru-RU')
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = { pending: 'orange', paid: 'green', cancelled: 'red' }
        const texts = { pending: 'Ожидает', paid: 'Выплачено', cancelled: 'Отменено' }
        return <span style={{ color: colors[status] }}>{texts[status]}</span>
      }
    }
  ]

  return (
    <div className="p-6">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Общий заработок"
              value={calculateTotalEarnings()}
              suffix="₽"
              prefix={<FaWallet />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Количество исполнителей"
              value={executers.length}
              prefix={<FaUser />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Всего заказов"
              value={earningsData.length}
              prefix={<FaClock />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Активных цен"
              value={pricingData.length}
              prefix={<FaCoins />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'pricing',
              label: 'Индивидуальные цены',
              children: (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <p className="text-gray-600">
                      Индивидуальные цены создаются при добавлении услуги.
                      Перейдите в раздел "Цифровые услуги" для настройки ценообразования.
                    </p>
                  </div>
                  <Table
                    columns={pricingColumns}
                    dataSource={pricingData}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                </div>
              )
            },
            {
              key: 'earnings',
              label: 'Статистика заработка',
              children: (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <RangePicker
                      onChange={(dates) => {
                        setDateRange(dates || [])
                      }}
                      placeholder={['Дата начала', 'Дата окончания']}
                    />
                  </div>
                  <Table
                    columns={earningsColumns}
                    dataSource={earningsData}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                </div>
              )
            },
            {
              key: 'stats',
              label: 'Статистика по исполнителям',
              children: (
                <Table
                  columns={[
                    {
                      title: 'Исполнитель',
                      dataIndex: 'executer_name',
                      key: 'executer_name'
                    },
                    {
                      title: 'Общий заработок',
                      dataIndex: 'total_amount',
                      key: 'total_amount',
                      render: (amount) => `${amount || 0} ₽`,
                      sorter: (a, b) => (a.total_amount || 0) - (b.total_amount || 0)
                    },
                    {
                      title: 'К выплате',
                      dataIndex: 'pending_amount',
                      key: 'pending_amount',
                      render: (amount) => `${amount || 0} ₽`
                    },
                    {
                      title: 'Выплачено',
                      dataIndex: 'paid_amount',
                      key: 'paid_amount',
                      render: (amount) => `${amount || 0} ₽`
                    },
                    {
                      title: 'Количество заказов',
                      dataIndex: 'count',
                      key: 'count',
                      sorter: (a, b) => (a.count || 0) - (b.count || 0)
                    }
                  ]}
                  dataSource={executerStats}
                  rowKey="executer_id"
                  pagination={{ pageSize: 10 }}
                />
              )
            }
          ]}
        />
      </Card>
    </div>
  )
}
