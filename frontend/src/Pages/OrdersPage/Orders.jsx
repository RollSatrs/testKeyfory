import { OrdersHeader } from './components/OrdersHeader';
import { OrdersTable } from './components/OrdersTable';
import { OrdersStats } from './components/OrdersStats';
import { OrdersSearch } from './components/OrdersSearch'; // импорт добавлен
import { useState, useCallback } from 'react';

export function Orders() {
  const [refresh, setRefresh] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  const handleRefresh = useCallback(() => setRefresh(r => !r), []);

  return (
    <>
      <OrdersHeader onAdd={handleRefresh} />
      <OrdersStats refresh={refresh} />
      <OrdersSearch
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        serviceFilter={serviceFilter}
        setServiceFilter={setServiceFilter}
      />
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