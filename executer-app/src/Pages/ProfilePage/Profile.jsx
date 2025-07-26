import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Avatar,
  Form,
  Input,
  Rate,
  Descriptions,
  message,
  Spin,
  Tag,
  Divider
} from 'antd'
import {
  HomeOutlined,
  ShoppingOutlined,
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  IdcardOutlined,
  StarOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

const ProfilePage = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  useEffect(() => {
    fetchProfile()
    fetchStats()
  }, [user])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/executers/admin/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data.executer)
        form.setFieldsValue({
          name: data.executer.name,
          telegram_id: data.executer.telegram_id
        })
      } else {
        message.error('Ошибка загрузки профиля')
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error)
      message.error('Ошибка подключения к серверу')
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/executers/admin/stats/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (values) => {
    try {
      const response = await fetch(`http://localhost:3000/api/executers/admin/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values)
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.executer)
        setEditing(false)
        message.success('Профиль обновлен')

        // Обновляем данные в localStorage
        const updatedUser = { ...user, name: values.name }
        localStorage.setItem('executerUser', JSON.stringify(updatedUser))
      } else {
        message.error('Ошибка при обновлении профиля')
      }
    } catch (error) {
      console.error('Ошибка обновления профиля:', error)
      message.error('Ошибка подключения к серверу')
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Spin size="large" />
        <div style={{ marginTop: '1rem' }}>Загрузка профиля...</div>
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
              <UserOutlined style={{ marginRight: '0.5rem' }} />
              Мой профиль
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
                icon={<ShoppingOutlined />}
                onClick={() => navigate('/orders')}
              >
                Заказы
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Основная информация профиля */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <IdcardOutlined />
                <span>Информация о профиле</span>
              </Space>
            }
            extra={
              !editing ? (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setEditing(true)}
                >
                  Редактировать
                </Button>
              ) : null
            }
            style={{
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            {!editing ? (
              <>
                <Row align="middle" style={{ marginBottom: '2rem' }}>
                  <Col span={4}>
                    <Avatar
                      size={80}
                      icon={<UserOutlined />}
                      style={{ backgroundColor: '#1890ff' }}
                    />
                  </Col>
                  <Col span={20}>
                    <Title level={3} style={{ margin: 0 }}>
                      {profile?.name || 'Исполнитель'}
                    </Title>
                    <Space>
                      <Rate disabled value={profile?.rating || 0} />
                      <Text>({profile?.rating || 0})</Text>
                    </Space>
                    <div>
                      <Tag color={profile?.status === 'active' ? 'success' : 'default'}>
                        {profile?.status === 'active' ? 'Активен' : 'Неактивен'}
                      </Tag>
                    </div>
                  </Col>
                </Row>

                <Descriptions column={2} bordered>
                  <Descriptions.Item label="Имя" span={2}>
                    <Text strong>{profile?.name || 'Не указано'}</Text>
                  </Descriptions.Item>

                  <Descriptions.Item label="Telegram ID">
                    <Text code>{profile?.telegram_id}</Text>
                  </Descriptions.Item>

                  <Descriptions.Item label="Рейтинг">
                    <Space>
                      <StarOutlined style={{ color: '#fadb14' }} />
                      <Text strong>{profile?.rating || 0}</Text>
                    </Space>
                  </Descriptions.Item>

                  <Descriptions.Item label="Статус">
                    <Tag color={profile?.status === 'active' ? 'success' : 'default'}>
                      {profile?.status === 'active' ? 'Активен' : 'Неактивен'}
                    </Tag>
                  </Descriptions.Item>

                  <Descriptions.Item label="Дата регистрации">
                    <Space>
                      <CalendarOutlined />
                      <Text>
                        {profile?.create_date_executer
                          ? new Date(profile.create_date_executer).toLocaleDateString('ru-RU', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'Не указана'
                        }
                      </Text>
                    </Space>
                  </Descriptions.Item>

                  <Descriptions.Item label="ID в системе">
                    <Text type="secondary">#{profile?.id}</Text>
                  </Descriptions.Item>
                </Descriptions>
              </>
            ) : (
              <Form
                form={form}
                layout="vertical"
                onFinish={updateProfile}
              >
                <Form.Item
                  label="Имя"
                  name="name"
                  rules={[{ required: true, message: 'Введите ваше имя' }]}
                >
                  <Input placeholder="Введите ваше имя" />
                </Form.Item>

                <Form.Item
                  label="Telegram ID"
                  name="telegram_id"
                >
                  <Input disabled />
                </Form.Item>

                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                  >
                    Сохранить
                  </Button>
                  <Button onClick={() => setEditing(false)}>
                    Отменить
                  </Button>
                </Space>
              </Form>
            )}
          </Card>
        </Col>

        {/* Статистика */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card
              title={
                <Space>
                  <TrophyOutlined />
                  <span>Статистика работы</span>
                </Space>
              }
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Всего заказов"
                    value={stats?.totalOrders || 0}
                    prefix={<ShoppingOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Завершено"
                    value={stats?.completedOrders || 0}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="В работе"
                    value={stats?.activeOrders || 0}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Отменено"
                    value={stats?.cancelledOrders || 0}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
              </Row>

              <Divider />

              <Statistic
                title="Общий заработок"
                value={stats?.totalEarnings || 0}
                suffix="₽"
                valueStyle={{ color: '#52c41a', fontSize: '24px' }}
              />
            </Card>

            <Card
              title="Быстрые действия"
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  block
                  icon={<ShoppingOutlined />}
                  onClick={() => navigate('/orders')}
                >
                  Просмотреть все заказы
                </Button>

                <Button
                  danger
                  block
                  onClick={() => {
                    if (confirm('Вы уверены, что хотите выйти?')) {
                      onLogout()
                    }
                  }}
                >
                  Выйти из аккаунта
                </Button>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  )
}

export default ProfilePage
