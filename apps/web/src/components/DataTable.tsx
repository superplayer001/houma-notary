import { Table, TableProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface Props<T> extends Pick<TableProps<T>, 'columns' | 'dataSource'> {
  loading?: boolean
  rowKey?: string
}

export default function DataTable<T>({ loading, rowKey = 'id', columns, dataSource, ...rest }: Props<T>) {
  return (
    <Table
      rowKey={rowKey}
      loading={loading}
      columns={columns as ColumnsType<T>}
      dataSource={dataSource}
      pagination={false}
      {...rest}
    />
  )
}
