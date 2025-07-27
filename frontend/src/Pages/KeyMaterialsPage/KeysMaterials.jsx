import { KeysMaterialsHeader } from './components/KeysMaterialsHeader';
import { KeysMaterialsTable } from './components/KeysMaterialsTable';
import { KeysMaterialsStats } from './components/KeysMaterialsStats';
import { KeysMaterialsSearch } from './components/KeysMaterialsSearch';
import ReplacementRequests from './components/ReplacementRequests';
import { useState, useCallback } from 'react';


export function KeysMaterials() {
  const [refresh, setRefresh] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');


  const handleRefresh = useCallback(() => setRefresh(r => !r), []);

  return (
    <>
      <KeysMaterialsHeader onAdd={handleRefresh} />
      <KeysMaterialsStats refresh={refresh} />
      <KeysMaterialsSearch
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
      />
      <KeysMaterialsTable
        refresh={refresh}
        onChange={handleRefresh}
        search={search}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
      />
      <ReplacementRequests />
    </>
  );
}