import { ServicesHeader } from './components/ServicesHeader';
import { ServicesTable } from './components/ServicesTable.jsx';
import { ServicesStats } from './components/ServicesStats';
import { ServicesSearch } from './components/ServicesSearch';
import { useState, useCallback } from 'react';

export function DigitalServices() {
  const [refresh, setRefresh] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const handleRefresh = useCallback(() => setRefresh(r => !r), []);

  return (
    <>
      <ServicesHeader onAdd={handleRefresh} />
      <ServicesStats refresh={refresh} />
      <ServicesSearch
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
      />
      <ServicesTable
        refresh={refresh}
        onChange={handleRefresh}
        search={search}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
      />
    </>
  );
}