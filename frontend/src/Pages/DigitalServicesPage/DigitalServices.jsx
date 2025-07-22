import { ServicesHeader } from './components/ServicesHeader'
import { ServicesTable } from './components/ServicesTable'
import { ServicesStats } from './components/ServicesStats'
import { ServicesSearch } from './components/ServicesSearch'
import { useState, useCallback } from 'react'

export function DigitalServices() {
  const [refresh, setRefresh] = useState(false);
  const handleRefresh = useCallback(() => {
    setRefresh(r => !r);
  }, []);
  return (
    <>
        <ServicesHeader onAdd={handleRefresh} />
        <ServicesStats/>
        <ServicesSearch/>
        <ServicesTable refresh={refresh} />

    </>
  )
}