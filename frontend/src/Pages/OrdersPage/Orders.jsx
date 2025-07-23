import { OrdersHeader } from './components/OrdersHeader';
import { OrdersTable } from './components/OrdersTable';
import { OrdersStats } from './components/OrdersStats';
import { useState, useCallback } from 'react';

export function Orders() {
  const [refresh, setRefresh] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  const handleRefresh = useCallback(() => setRefresh(r => !r), []);

  return (
    <>
      <OrdersHeader
        onAdd={handleRefresh}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        serviceFilter={serviceFilter}
        setServiceFilter={setServiceFilter}
      />
      <OrdersStats refresh={refresh} />
      <OrdersTable
        refresh={refresh}
        onChange={handleRefresh}
        search={search}
        statusFilter={statusFilter}
        serviceFilter={serviceFilter}
      />
    </>
  );
}