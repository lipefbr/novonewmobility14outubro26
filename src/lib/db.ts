// Lightweight Neon PostgreSQL client using native fetch only
// No third-party runtime dependencies - works in sandboxed environments where TCP is blocked
// Uses Neon's HTTP SQL API (same protocol as @neondatabase/serverless but without the heavy package)

function getConnectionString(): string {
  const connStr = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
  if (!connStr) throw new Error('DATABASE_URL is not set')
  return connStr
}

// Parse the Neon connection string to extract the API endpoint
function getNeonApiUrl(): string {
  const connStr = getConnectionString()
  const url = new URL(connStr)
  // Neon HTTP API endpoint: extract region from hostname
  // e.g., ep-twilight-night-aqn8fqln-pooler.c-8.us-east-1.aws.neon.tech
  // -> https://api.c-8.us-east-1.aws.neon.tech/sql
  const hostParts = url.hostname.split('.')
  const regionIndex = hostParts.findIndex(p => p.startsWith('c-'))
  if (regionIndex >= 0) {
    const regionParts = hostParts.slice(regionIndex).join('.')
    return `https://api.${regionParts}/sql`
  }
  return `https://${url.hostname}/sql`
}

// Convert DB row values to proper JavaScript types based on column metadata
function convertRow(row: any, fields: any[]): any {
  if (!fields || !row) return row
  const result: Record<string, any> = {}
  for (const field of fields) {
    const name = field.name
    const value = row[name]
    if (value === null || value === undefined) {
      result[name] = value
      continue
    }
    // Convert based on PostgreSQL data type OID
    // 16 = bool, 20 = int8, 21 = int2, 23 = int4, 700 = float4, 701 = float8
    const oid = field.dataTypeID
    if (oid === 16) {
      result[name] = value === true || value === 't' || value === 'true'
    } else if ([20, 21, 23].includes(oid)) {
      result[name] = typeof value === 'number' ? value : parseInt(value, 10)
    } else if ([700, 701].includes(oid)) {
      result[name] = typeof value === 'number' ? value : parseFloat(value)
    } else {
      result[name] = value
    }
  }
  return result
}

// Execute SQL queries via Neon's HTTP API with type conversion
async function executeQuery(query: string, params: any[] = []): Promise<any[]> {
  const apiUrl = getNeonApiUrl()
  const connStr = getConnectionString()
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': connStr,
    },
    body: JSON.stringify({
      query,
      params: params.map(p => {
        if (p === null || p === undefined) return null
        if (typeof p === 'boolean') return p
        if (typeof p === 'number') return p
        return String(p)
      }),
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('Neon SQL API error:', response.status, text.substring(0, 200))
    throw new Error(`Database query failed: ${response.status}`)
  }

  const data = await response.json()
  const rows = data.rows || []
  const fields = data.fields || []
  
  // Convert types for each row
  return rows.map((row: any) => convertRow(row, fields))
}

// Database helper
export const db = {
  async execute(query: string, params: any[] = []): Promise<any[]> {
    return executeQuery(query, params)
  },

  async findOne(table: string, conditions: string, params: any[] = []): Promise<any | null> {
    const where = conditions ? `WHERE ${conditions}` : ''
    const rows = await executeQuery(`SELECT * FROM "${table}" ${where} LIMIT 1`, params)
    return rows[0] || null
  },

  async find(table: string, conditions: string = '', params: any[] = [], extra: string = ''): Promise<any[]> {
    const where = conditions ? `WHERE ${conditions}` : ''
    return executeQuery(`SELECT * FROM "${table}" ${where} ${extra}`, params)
  },

  async insert(table: string, data: Record<string, any>): Promise<any> {
    const keys = Object.keys(data).map(k => `"${k}"`)
    const placeholders = Object.keys(data).map((_, i) => `$${i + 1}`)
    const values = Object.values(data)
    const rows = await executeQuery(
      `INSERT INTO "${table}" (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values
    )
    return rows[0]
  },

  async update(table: string, conditions: string, data: Record<string, any>, conditionParams: any[] = []): Promise<any> {
    const setClauses = Object.keys(data).map((key, i) => `"${key}" = $${i + 1}`)
    const values = [...Object.values(data), ...conditionParams]
    const rows = await executeQuery(
      `UPDATE "${table}" SET ${setClauses.join(', ')} WHERE ${conditions} RETURNING *`,
      values
    )
    return rows[0]
  },

  async deleteFrom(table: string, conditions: string, params: any[] = []): Promise<any> {
    const rows = await executeQuery(`DELETE FROM "${table}" WHERE ${conditions} RETURNING *`, params)
    return rows[0]
  },

  async count(table: string, conditions: string = '', params: any[] = []): Promise<number> {
    const where = conditions ? `WHERE ${conditions}` : ''
    const rows = await executeQuery(`SELECT COUNT(*)::int as count FROM "${table}" ${where}`, params)
    return rows[0]?.count ?? 0
  },
}
