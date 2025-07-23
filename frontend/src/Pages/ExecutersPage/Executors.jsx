import { ExecutorsHeader } from './components/ExecutorsHeader'
import { ExecutorsStats } from './components/ExecutorsStats'
import { ExecutorsTable } from './components/ExecutorsTable'
import { ExecutorsSearch } from './components/ExecutorsSearch'
import { useState, useMemo } from 'react'

export function Executors() {
  const [refresh, setRefresh] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  // null — все рейтинги, 0.5-5 — конкретный рейтинг
  const [ratingFilter, setRatingFilter] = useState(null);
  const [executors, setExecutors] = useState([]);

  const filteredExecutors = useMemo(() => {
    return executors.filter(e => {
      const matchesSearch =
        !search ||
        (e.name && e.name.toLowerCase().includes(search.toLowerCase())) ||
        (e.telegram_id && e.telegram_id.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = !statusFilter || e.status === statusFilter;
      // Если рейтинг не выбран (null), показываем всех
      const matchesRating = ratingFilter == null || Math.floor(e.rating) === Math.floor(ratingFilter);
      return matchesSearch && matchesStatus && matchesRating;
    });
  }, [executors, search, statusFilter, ratingFilter]);

  // Для выбора "Все рейтинги" можно добавить кнопку или иконку сброса фильтра
  // Например, в ExecutorsSearch добавить кнопку "Все рейтинги" или allowClear для Rate

  return (
    <>
      <ExecutorsHeader onAdd={() => setRefresh(r => !r)} />
      <ExecutorsStats refresh={refresh} />
      <ExecutorsSearch
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        ratingFilter={ratingFilter}
        setRatingFilter={setRatingFilter}
      />
      <ExecutorsTable
        onChanged={() => setRefresh(r => !r)}
        setExecutors={setExecutors}
        executors={filteredExecutors}
        refresh={refresh}
      />
    </>
  )
}