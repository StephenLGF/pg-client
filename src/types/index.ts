export interface QueryColumn {
  name: string
  dataTypeID: number
}

export interface QueryResult {
  columns: QueryColumn[]
  rows: Record<string, unknown>[]
  rowCount: number
  command: string
  duration: number
}

export interface QueryError {
  error: string
  code?: string
  detail?: string
  hint?: string
  position?: string
}

export interface TableInfo {
  table_schema: string
  table_name: string
  table_type: string
}

export interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

export interface DbConnection {
  id: string
  name: string
  host: string
  port: number
  database: string | null
  username: string
  password?: string
  created_at: string
  updated_at: string
}
