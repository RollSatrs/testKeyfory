import { FaEdit, FaTrash, FaBan } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { Table, Tag, Button, Modal, Input, Select, Space, Popconfirm, Rate, message } from 'antd'

const token = localStorage.getItem("admin_token");

export function ExecutorsTable({ onChanged, setExecutors, executors, refresh }) {
  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState(false);
  const [form, setForm] = useState({
    id: null,
    name: '',
    telegram_id: '',
    orders: 0,
    rating: 1,
    status: ''
  });

  // Получение данных из API
  async function fetchExecutors() {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/executers/get', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setExecutors(
        Array.isArray(data)
          ? data.map(e => ({
              ...e,
              orders: e.orders ?? 0
            }))
          : []
      );
    } catch (e) {
      message.error('Ошибка при загрузке исполнителей');
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
      orders: executor.orders,
      rating: executor.rating,
      status: executor.status
    });
    setEditForm(true);
  }

  function handleChange(name, value) {
    setForm({ ...form, [name]: value });
  }

  async function handleEditSubmit() {
    try {
      const res = await fetch(`http://localhost:3000/api/executers/update/${form.id}`, {
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
      notifyChanged();
    } catch {
      message.error('Ошибка при обновлении исполнителя');
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`http://localhost:3000/api/executers/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error();
      message.success('Исполнитель удален');
      notifyChanged();
    } catch {
      message.error('Ошибка при удалении исполнителя');
    }
  }

  async function handleBlock(id) {
    try {
      const res = await fetch(`http://localhost:3000/api/executers/update/${id}`, {
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
      title: 'Заказов',
      dataIndex: 'orders',
      key: 'orders',
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
            title="Удалить исполнителя?"
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
        onCancel={() => setEditForm(false)}
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
        <Select
          name="status"
          value={form.status || undefined}
          onChange={value => handleChange('status', value)}
          placeholder="Выберите статус"
          className="w-full"
          style={{ marginBottom: 8 }}
        >
          <Select.Option value="active">АКТИВЕН</Select.Option>
          <Select.Option value="inactive">НЕАКТИВЕН</Select.Option>
          <Select.Option value="blocked">ЗАБЛОКИРОВАН</Select.Option>
        </Select>
      </Modal>
    </div>
  );
}