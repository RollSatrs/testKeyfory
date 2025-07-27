import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Input, message, Tag, Space, Card, Descriptions } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const ReplacementRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [processing, setProcessing] = useState(false);

  // Загрузка запросов на замену
  const fetchReplacementRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/materials/replacement-requests');
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      message.error('Ошибка при загрузке запросов на замену');
      console.error('Error fetching replacement requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplacementRequests();
  }, []);

  // Обработка запроса на замену
  const processRequest = async (requestId, decision) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/materials/replacement-requests/${requestId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision,
          adminResponse: adminResponse || null
        })
      });

      if (response.ok) {
        message.success(`Запрос ${decision === 'approved' ? 'одобрен' : 'отклонён'}`);
        setModalVisible(false);
        setAdminResponse('');
        fetchReplacementRequests(); // Перезагрузка списка
      } else {
        message.error('Ошибка при обработке запроса');
      }
    } catch (error) {
      message.error('Ошибка при обработке запроса');
      console.error('Error processing request:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Показать детали запроса
  const showRequestDetails = (request) => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  // Статус тэги
  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: 'Ожидает' },
      approved: { color: 'green', text: 'Одобрен' },
      rejected: { color: 'red', text: 'Отклонён' }
    };

    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70
    },
    {
      title: 'Заказ',
      dataIndex: ['Order', 'id'],
      key: 'orderId',
      render: (orderId) => `#${orderId}`
    },
    {
      title: 'Услуга',
      dataIndex: ['Order', 'Service', 'name'],
      key: 'serviceName'
    },
    {
      title: 'Исполнитель',
      dataIndex: ['Executer', 'name'],
      key: 'executerName'
    },
    {
      title: 'Причина',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Дата создания',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('ru-RU')
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => showRequestDetails(record)}
          >
            Подробнее
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Card title="Запросы на замену материалов" style={{ marginTop: 16 }}>
      <Table
        columns={columns}
        dataSource={requests}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} из ${total} записей`
        }}
      />

      <Modal
        title="Детали запроса на замену"
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setAdminResponse('');
        }}
        footer={selectedRequest?.status === 'pending' ? [
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Отмена
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseOutlined />}
            loading={processing}
            onClick={() => processRequest(selectedRequest.id, 'rejected')}
          >
            Отклонить
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckOutlined />}
            loading={processing}
            onClick={() => processRequest(selectedRequest.id, 'approved')}
          >
            Одобрить
          </Button>
        ] : [
          <Button key="close" type="primary" onClick={() => setModalVisible(false)}>
            Закрыть
          </Button>
        ]}
        width={700}
      >
        {selectedRequest && (
          <div>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="ID запроса">{selectedRequest.id}</Descriptions.Item>
              <Descriptions.Item label="Заказ">#{selectedRequest.Order?.id}</Descriptions.Item>
              <Descriptions.Item label="Услуга">{selectedRequest.Order?.Service?.name}</Descriptions.Item>
              <Descriptions.Item label="Исполнитель">{selectedRequest.Executer?.name}</Descriptions.Item>
              <Descriptions.Item label="Telegram ID">{selectedRequest.Executer?.telegram_id}</Descriptions.Item>
              <Descriptions.Item label="Статус">{getStatusTag(selectedRequest.status)}</Descriptions.Item>
              <Descriptions.Item label="Дата создания">
                {new Date(selectedRequest.created_at).toLocaleString('ru-RU')}
              </Descriptions.Item>
              <Descriptions.Item label="Причина замены">
                <div style={{ whiteSpace: 'pre-wrap' }}>{selectedRequest.reason}</div>
              </Descriptions.Item>
              {selectedRequest.admin_response && (
                <Descriptions.Item label="Ответ администратора">
                  <div style={{ whiteSpace: 'pre-wrap' }}>{selectedRequest.admin_response}</div>
                </Descriptions.Item>
              )}
              {selectedRequest.processed_at && (
                <Descriptions.Item label="Дата обработки">
                  {new Date(selectedRequest.processed_at).toLocaleString('ru-RU')}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedRequest.status === 'pending' && (
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                  Ответ администратора (необязательно):
                </label>
                <TextArea
                  rows={4}
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Введите комментарий к решению..."
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default ReplacementRequests;
