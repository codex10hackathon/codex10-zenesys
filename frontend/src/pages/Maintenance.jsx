import React from 'react'
import Layout from '../components/Layout'
import Card from '../components/Card'

export default function Maintenance() {
  return (
    <Layout title="Maintenance">
      <Card title="Maintenance Records">
        <p className="text-[13px] text-[var(--text-muted)]">No maintenance records available.</p>
      </Card>
    </Layout>
  )
}
