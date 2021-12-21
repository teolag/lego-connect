import { Hub } from './Hub'
import { Port, MessageType, OutputCategory, DeviceType, OutputFeedback, ICommandOptions } from './types'
import { EventEmitter } from 'events'
import { dumpPort, dumpBuffer } from './utils'

export abstract class Device extends EventEmitter {
  protected hub: Hub
  public port: Port
  public type: DeviceType
  private mode = 0

  constructor(hub: Hub, port: Port, type: DeviceType) {
    super()
    this.type = type
    this.hub = hub
    this.port = port

    this.on('sensorReading', (buffer: Buffer) => {
      const data = this.parseSensorReading(buffer, this.mode)
      this.emit('change', { ...data, mode: this.mode, buffer })
    })

    this.on('OutputFeedback', (feedback: OutputFeedback) => {
      console.log('OutputFeedback', feedback)
    })

    this.on('subscribed', ({ mode, buffer }) => {
      this.mode = mode
      console.log(`Subscribed to ${DeviceType[this.type]} data from port ${dumpPort(this.port)} - [${dumpBuffer(buffer)}]`)
    })
  }

  public abstract parseSensorReading(buffer: Buffer, mode: number): object

  public setMode(mode: number) {
    this.mode = mode
  }

  public getMode() {
    return this.mode
  }

  public async getPortInformation() {
    const [portInformation, combinations] = await Promise.all([
      new Promise<object>(resolve => {
        this.once('portInfo', resolve)
        this.send(MessageType.PORT_INFORMATION_REQUEST, Buffer.from([0x01]))
      }),
      new Promise<object>(resolve => {
        this.once('portModeCombinations', resolve)
        this.send(MessageType.PORT_INFORMATION_REQUEST, Buffer.from([0x02]))
      })
    ])

    const uniqueModes = Array.from<number>(new Set(portInformation['inputModes'].concat(portInformation['outputModes']))).sort()
    const modes = await Promise.all(uniqueModes.map(mode => this.getModeInformation(mode)))

    return { portInformation, combinations, uniqueModes, modes }
  }

  public async getModeInformation(mode: number) {
    const [name, raw, percent, si, symbol, format] = await Promise.all(
      [0x00, 0x01, 0x02, 0x03, 0x04, 0x80].map(type => {
        return new Promise<object>(resolve => {
          const key = 'mode' + mode + 'info' + type
          this.once(key, resolve)
          this.send(MessageType.PORT_MODE_INFORMATION_REQUEST, Buffer.from([mode, type]))
        })
      })
    )
    return { mode, name, raw, percent, si, symbol, format }
  }

  public subscribe(mode: number, deltaInterval = 1) {
    // https://lego.github.io/lego-ble-wireless-protocol-docs/#format-of-port-input-format-setup-single
    return new Promise<{ mode: number; buffer: Buffer }>(resolve => {
      this.once('subscribed', resolve)
      const notifications = 0x01 // 1 = Enabled, 0 = Disabled
      const buffer = Buffer.from([mode, 0x00, 0x00, 0x00, 0x00, notifications])
      buffer.writeUInt32LE(deltaInterval, 1)
      this.send(MessageType.SUBSCRIPTION, buffer)
    })
  }

  protected sendCommand(data: Buffer, options: ICommandOptions = { useBuffer: false, sendFeedback: true }, category?: OutputCategory) {
    const startupAndCompletion = 0 + (options.useBuffer ? 0 : 1) + (options.sendFeedback ? 16 : 0)
    const data2 = Buffer.concat([Buffer.from([startupAndCompletion]), data])
    this.send(MessageType.PORT_OUTPUT, data2, category)
  }

  protected send(messageType: MessageType, data: Buffer, category?: OutputCategory) {
    const buffer = Buffer.concat([Buffer.from([messageType, this.port]), data])
    this.hub.send(buffer, category, this.port)
  }
}
