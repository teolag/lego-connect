import { Port, DeviceType } from '../types'
import { Device } from '../Device'
import { Hub } from '../Hub'

export class UnknownDevice extends Device {
  constructor(hub: Hub, port: Port) {
    super(hub, port, DeviceType.UNKNOWN_DEVICE, 'Unknown device')
  }

  public parseSensorReading(buffer: Buffer /*, mode: number*/) {
    console.log('Unknown reading', buffer)
    return buffer
  }
}
