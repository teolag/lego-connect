import { MessageType, Port, DeviceType, AttachEventType, HUB_ID, INCOMING_MESSAGE, OUTGOING_MESSAGE } from '../types'
import { Hub } from '../Hub'
import { dumpBuffer } from '../utils'

export class FakeHub extends Hub {
  constructor() {
    super()
    this.io.on(INCOMING_MESSAGE, (buffer: Buffer) => console.log('Incoming message: ' + dumpBuffer(buffer)))
  }

  public addFakeDevice(type: DeviceType, port: Port): void {
    const buffer = Buffer.from([7, HUB_ID, MessageType.HUB_ATTACHED_IO, port, AttachEventType.ATTACHED, 0, 0])
    buffer.writeUInt16LE(type, 5)
    this.io.emit(OUTGOING_MESSAGE, buffer)
  }

  public doAndListen(action: () => void): Promise<Buffer> {
    return new Promise<Buffer>(async resolve => {
      this.io.once(INCOMING_MESSAGE, resolve)
      await action()
    })
  }
}
