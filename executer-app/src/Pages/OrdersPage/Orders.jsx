import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Segmented,
  Spin,
  Empty,
  Modal,
  Descriptions,
  message,
  Divider
} from 'antd'
import {
  HomeOutlined,
  UserOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined,
  ShoppingOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

const OrdersPage = ({ user, onLogout }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrders()
  }, [user])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:3000/api/executers/orders/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      } else {
        message.error('Ошибка загрузки заказов')
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error)
      message.error('Ошибка подключения к серверу')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3000/api/executers/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setOrders(orders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        ))
        message.success('Статус заказа обновлен')
      } else {
        message.error('Ошибка при обновлении статуса заказа')
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error)
      message.error('Ошибка подключения к серверу')
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      'pending': { color: 'orange', text: 'Ожидает' },
      'active': { color: 'blue', text: 'Активный' },
      'in_progress': { color: 'green', text: 'В работе' },
      'completed': { color: 'success', text: 'Завершен' },
      'cancelled': { color: 'error', text: 'Отменен' }
    }
    return configs[status] || { color: 'default', text: status }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    if (filter === 'active') return order.status === 'active' || order.status === 'in_progress'
    return order.status === filter
  })

  const filterOptions = [
    { label: 'Все', value: 'all' },
    { label: 'Активные', value: 'active' },
    { label: 'Завершенные', value: 'completed' },
    { label: 'Отмененные', value: 'cancelled' }
  ]

  const confirmAction = (action, orderId) => {
    Modal.confirm({
      title: 'Подтверждение действия',
      content: `Вы уверены, что хотите ${action === 'cancel' ? 'отменить' : 'выполнить это действие с'} заказ?`,
      onOk: () => {
        if (action === 'start') updateOrderStatus(orderId, 'in_progress')
        if (action === 'complete') updateOrderStatus(orderId, 'completed')
        if (action === 'cancel') updateOrderStatus(orderId, 'cancelled')
      }
    })
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Spin size="large" />
        <div style={{ marginTop: '1rem' }}>Загрузка заказов...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Card style={{ marginBottom: '1rem' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <ShoppingOutlined style={{ marginRight: '0.5rem' }} />
              Мои заказы
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<HomeOutlined />}
                onClick={() => navigate('/')}
              >
                Главная
              </Button>
              <Button
                icon={<UserOutlined />}
                onClick={() => navigate('/profile')}
              >
                Профиль
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Фильтры */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <Segmented
          options={filterOptions}
          value={filter}
          onChange={setFilter}
          style={{ width: '100%' }}
          size="large"
        />
      </Card>

      {/* Список заказов */}
      {filteredOrders.length === 0 ? (
        <Card>
          <Empty
            description={filter === 'all' ? 'У вас пока нет заказов' : 'Нет заказов с выбранным фильтром'}
            style={{ padding: '2rem' }}
          />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredOrders.map(order => {
            const statusConfig = getStatusConfig(order.status)
            return (
              <Col xs={24} sm={24} md={12} lg={8} key={order.id}>
                <Card
                  hoverable
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    height: '100%'
                  }}
                  title={
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Space>
                          <Text strong style={{ fontSize: '16px' }}>Заказ #{order.id}</Text>
                        </Space>
                      </Col>
                      <Col>
                        <Tag color={statusConfig.color} style={{ borderRadius: '20px', padding: '4px 12px' }}>
                          {statusConfig.text}
                        </Tag>
                      </Col>
                    </Row>
                  }
                  actions={[
                    ...(order.status === 'active' ? [
                      <Button
                        key="start"
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={() => confirmAction('start', order.id)}
                        size="small"
                      >
                        Начать
                      </Button>,
                      <Button
                        key="cancel"
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={() => confirmAction('cancel', order.id)}
                        size="small"
                      >
                        Отменить
                      </Button>
                    ] : []),
                    ...(order.status === 'in_progress' ? [
                      <Button
                        key="complete"
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => confirmAction('complete', order.id)}
                        size="small"
                      >
                        Завершить
                      </Button>,
                      <Button
                        key="cancel"
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={() => confirmAction('cancel', order.id)}
                        size="small"
                      >
                        Отменить
                      </Button>
                    ] : [])
                  ]}
                >
                  <Descriptions column={1} size="small" style={{ marginBottom: '1rem' }}>
                    <Descriptions.Item
                      label={<Space><FileTextOutlined />Услуга</Space>}
                    >
                      <Text strong>{order.Service?.name || 'Не указана'}</Text>
                    </Descriptions.Item>

                    <Descriptions.Item
                      label={<Space><DollarOutlined />Стоимость</Space>}
                    >
                      <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                        {order.total_sum || 0}₽
                      </Text>
                    </Descriptions.Item>

                    <Descriptions.Item
                      label={<Space><CalendarOutlined />Создан</Space>}
                    >
                      <Text type="secondary">
                        {new Date(order.created_at).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </Descriptions.Item>

                    {order.Service?.description && (
                      <Descriptions.Item label="Описание услуги">
                        <Text ellipsis={{ tooltip: order.Service.description }} style={{ fontSize: '12px' }}>
                          {order.Service.description}
                        </Text>
                      </Descriptions.Item>
                    )}

                    {order.Service?.category && (
                      <Descriptions.Item label="Категория">
                        <Tag color="blue">{order.Service.category}</Tag>
                      </Descriptions.Item>
                    )}

                    {order.Service?.required_keys && (
                      <Descriptions.Item label="Требуется ключей">
                        <Text type="secondary">{order.Service.required_keys}</Text>
                      </Descriptions.Item>
                    )}

                    {order.details && (
                      <Descriptions.Item label="Детали заказа">
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {typeof order.details === 'object'
                            ? JSON.stringify(order.details)
                            : order.details
                          }
                        </Text>
                      </Descriptions.Item>
                    )}

                    {order.payment_status && (
                      <Descriptions.Item label="Статус оплаты">
                        <Tag color={order.payment_status === 'paid' ? 'success' : 'warning'}>
                          {order.payment_status === 'paid' ? 'Оплачен' : 'Ожидает оплаты'}
                        </Tag>
                      </Descriptions.Item>
                    )}
                  </Descriptions>

                  <Divider style={{ margin: '12px 0' }} />

                  <Row justify="space-between" align="middle">
                    <Col>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        ID заказа: {order.id}
                      </Text>
                    </Col>
                    <Col>
                      {order.Service?.admin_id && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Админ ID: {order.Service.admin_id}
                        </Text>
                      )}
                    </Col>
                  </Row>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}
    </div>
  )
}

export default OrdersPage
