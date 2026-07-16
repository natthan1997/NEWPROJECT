import { NextRequest, NextResponse } from 'next/server'
import net from 'net'

export const runtime = 'nodejs'

const PRIVATE_HOST_PATTERNS = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^localhost$/i,
]

const isAllowedPrinterHost = (host: string) => {
  const value = host.trim()
  if (!value) return false
  if (value === '::1') return true
  return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(value))
}

const sendTcp = (host: string, port: number, payload: Buffer) =>
  new Promise<void>((resolve, reject) => {
    const socket = new net.Socket()
    let settled = false

    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      socket.destroy()
      if (error) reject(error)
      else resolve()
    }

    socket.setTimeout(5000)
    socket.once('timeout', () => finish(new Error('Printer connection timed out')))
    socket.once('error', finish)
    socket.connect(port, host, () => {
      socket.write(payload, (error) => {
        if (error) finish(error)
        else finish()
      })
    })
  })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ip = String(body?.ip || body?.ipAddress || '').trim()
    const port = Number(body?.port || 9100)
    const data = String(body?.data || '').trim()

    if (!isAllowedPrinterHost(ip)) {
      return NextResponse.json({ error: 'Printer IP must be a local network address' }, { status: 400 })
    }

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return NextResponse.json({ error: 'Invalid printer port' }, { status: 400 })
    }

    if (!data || data.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(data)) {
      return NextResponse.json({ error: 'Invalid printer data' }, { status: 400 })
    }

    await sendTcp(ip, port, Buffer.from(data, 'hex'))
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Unable to send data to printer' },
      { status: 500 }
    )
  }
}
