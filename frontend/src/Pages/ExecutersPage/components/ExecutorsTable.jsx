import { FaEdit, FaTrash, FaBan } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { Table, Tag, Button, Modal, Input, Select, Space, Popconfirm, Rate, message, Tooltip } from 'antd'

const token = localStorage.getItem("admin_token");

export function ExecutorsTable({ onChanged, setExecutors, executors, refresh }) {
  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState(false);
  const [form, setForm] = useState({
    id: null,
    name: '',
    telegram_id: '',
    rating: 1
  });

  // Получение данных из API
  async function fetchExecutors() {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/executers/admin/get', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      // Получаем только информацию об активных заказах для логики удаления
      const executorsWithOrderInfo = await Promise.all(
        (Array.isArray(data) ? data : []).map(async (executor) => {
          try {
            // Получаем только количество активных заказов для проверки возможности удаления
            const ordersRes = await fetch(`http://localhost:3000/api/executers/admin/orders/${executor.id}`, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });

            if (ordersRes.ok) {
              const ordersData = await ordersRes.json();
              const activeOrders = ordersData.filter(order =>
                order.status === 'pending' || order.status === 'in_progress'
              ).length;

              return {
                ...executor,
                activeOrders: activeOrders || 0
              };
            }
          } catch (error) {
            console.warn(`Не удалось получить заказы для исполнителя ${executor.id}:`, error);
          }

          return {
            ...executor,
            activeOrders: 0
          };
        })
      );

      setExecutors(executorsWithOrderInfo);
    } catch (e) {
      message.error('Ошибка при загрузке исполнителей');
      console.error('Fetch error:', e);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchExecutors();
    // eslint-disable-next-line
  }, [refresh]); // <--- добавьте refresh сюда

  // Вызывать обновление статистики после любого действия
  function notifyChanged() {
    fetchExecutors();
    if (onChanged) onChanged();
  }

  function openEditModal(executor) {
    setForm({
      id: executor.id,
      name: executor.name,
      telegram_id: executor.telegram_id,
      rating: executor.rating
    });
    setEditForm(true);
  }

  function handleChange(name, value) {
    setForm({ ...form, [name]: value });
  }

  async function handleEditSubmit() {
    try {
      const res = await fetch(`http://localhost:3000/api/executers/admin/update/${form.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error();
      message.success('Исполнитель обновлен');
      setEditForm(false);
      setForm({
        id: null,
        name: '',
        telegram_id: '',
        rating: 1
      });
      notifyChanged();
    } catch {
      message.error('Ошибка при обновлении исполнителя');
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`http://localhost:3000/api/executers/admin/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.error && errorData.error.includes('active orders')) {
          message.error('Нельзя удалить исполнителя с активными заказами. Сначала завершите или переназначьте заказы.');
        } else {
          message.error('Ошибка при удалении исполнителя');
        }
        return;
      }

      message.success('Исполнитель удален');
      notifyChanged();
    } catch (error) {
      message.error('Ошибка при удалении исполнителя');
      console.error('Delete error:', error);
    }
  }

  async function handleBlock(id) {
    try {
      const res = await fetch(`http://localhost:3000/api/executers/admin/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'blocked' })
      });
      if (!res.ok) throw new Error();
      message.success('Исполнитель заблокирован');
      notifyChanged();
    } catch {
      message.error('Ошибка при блокировке исполнителя');
    }
  }

  const columns = [
    {
      title: 'Имя',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Телеграмм ID',
      dataIndex: 'telegram_id',
      key: 'telegram_id',
      render: tg => <span className="text-blue-600 font-mono">{tg}</span>
    },
    {
      title: 'Рейтинг',
      dataIndex: 'rating',
      key: 'rating',
      render: rating => <Rate disabled allowHalf value={rating} />
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <Tag color={
          status === 'active'
            ? 'green'
            : status === 'blocked'
            ? 'red'
            : 'orange'
        }>
          {status === 'active'
            ? 'АКТИВЕН'
            : status === 'blocked'
            ? 'ЗАБЛОКИРОВАН'
            : 'НЕАКТИВЕН'}
        </Tag>
      )
    },
    {
      title: 'Назначенные услуги',
      key: 'services',
      width: 200,
      render: (_, record) => {
        const assignedServices = record.assigned_services || [];

        if (assignedServices.length === 0) {
          return <Tag color="default">Не назначены</Tag>;
        }

        if (assignedServices.length === 1) {
          const service = assignedServices[0];
          return (
            <Tag color={service.service_status === 'active' ? 'green' : 'orange'}>
              {service.service_name}
            </Tag>
          );
        }

        return (
          <Tooltip
            title={
              <div>
                {assignedServices.map((service, index) => (
                  <div key={index}>
                    • {service.service_name} ({service.service_category})
                  </div>
                ))}
              </div>
            }
          >
            <Tag color="blue">
              {assignedServices.length} услуг{assignedServices.length === 1 ? 'а' : assignedServices.length < 5 ? 'и' : ''}
            </Tag>
          </Tooltip>
        );
      }
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
            title={
              record.status === 'active' && record.activeOrders > 0
                ? `У активного исполнителя ${record.activeOrders} активных заказов. Деактивируйте исполнителя для удаления!`
                : record.status !== 'active'
                ? "Удалить неактивного исполнителя?"
                : "Удалить исполнителя?"
            }
            onConfirm={record.status === 'active' && record.activeOrders > 0 ? undefined : () => handleDelete(record.id)}
            okText={record.status === 'active' && record.activeOrders > 0 ? undefined : "Да"}
            cancelText={record.status === 'active' && record.activeOrders > 0 ? "Понятно" : "Нет"}
            okButtonProps={{
              disabled: record.status === 'active' && record.activeOrders > 0,
              style: record.status === 'active' && record.activeOrders > 0 ? { display: 'none' } : {}
            }}
          >
            <Button
              icon={<FaTrash />}
              danger
              size="small"
              disabled={record.status === 'active' && record.activeOrders > 0}
              title={
                record.status === 'active' && record.activeOrders > 0
                  ? "Нельзя удалить активного исполнителя с активными заказами"
                  : "Удалить исполнителя"
              }
            />
          </Popconfirm>
          {record.status !== 'blocked' && (
            <Popconfirm
              title="Заблокировать исполнителя?"
              onConfirm={() => handleBlock(record.id)}
              okText="Да"
              cancelText="Нет"
            >
              <Button
                icon={<FaBan />}
                size="small"
                style={{ color: '#e53e3e' }}
              />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <Table
        columns={columns}
        dataSource={executors}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        bordered
        loading={loading}
      />
      <Modal
        open={editForm}
        title="Редактировать исполнителя"
        onCancel={() => {
          setEditForm(false);
          setForm({
            id: null,
            name: '',
            telegram_id: '',
            rating: 1
          });
        }}
        onOk={handleEditSubmit}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Input
          name="name"
          value={form.name}
          onChange={e => handleChange('name', e.target.value)}
          placeholder="Имя исполнителя"
          style={{ marginBottom: 16 }}
        />
        <Input
          name="telegram_id"
          value={form.telegram_id}
          onChange={e => handleChange('telegram_id', e.target.value)}
          placeholder="Telegram ID"
          style={{ marginBottom: 16 }}
        />
        <Input
          name="orders"
          type="number"
          min={0}
          value={form.orders}
          onChange={e => handleChange('orders', e.target.value)}
          placeholder="Количество заказов"
          style={{ marginBottom: 16 }}
        />
        <div style={{ marginBottom: 16 }}>
          <span className="block mb-1 text-gray-600">Рейтинг:</span>
          <Rate
            value={form.rating}
            onChange={value => handleChange('rating', value)}
            count={5}
            allowHalf
          />
        </div>
      </Modal>
    </div>
  );
}