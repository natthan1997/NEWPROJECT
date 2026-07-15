import { NextResponse } from 'next/server'
import net from 'net'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { ip, port, data } = await req.json()

    if (!ip || !data) {
      return NextResponse.json({ error: 'Missing ip or data' }, { status: 400 })
    }

    const portNum = Number(port) || 9100
    const buffer = Buffer.from(data, 'hex')

    await new Promise<void>((resolve, reject) => {
      const client = new net.Socket()
      
      client.setTimeout(5000) // 5 seconds timeout

      client.connect(portNum, ip, () => {
        client.write(buffer, () => {
          client.end()
          resolve()
        })
      })

      client.on('error', (err) => {
        console.error(`Printer TCP connection error to ${ip}:${portNum}:`, err)
        client.destroy()
        reject(err)
      })

      client.on('timeout', () => {
        console.error(`Printer TCP connection timeout to ${ip}:${portNum}`)
        client.destroy()
        reject(new Error('Connection timeout'))
      })
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('API Printer error:', error)
    return NextResponse.json({ error: error.message || 'Failed to print' }, { status: 500 })
  }
}
