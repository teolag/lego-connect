import { Port, DeviceType } from '../types'
import { Device } from '../Device'
import { Hub } from '../Hub'

// Voltage when fully loaded:      3480
// Voltage when battery says 30%:  2416

export class VoltageSensor extends Device {
  constructor(hub: Hub, port: Port) {
    super(hub, port, DeviceType.VOLTAGE_SENSOR, 'Voltage sensor')
  }

  public parseSensorReading(buffer: Buffer /*, mode: number*/) {
    const voltage = buffer.readUInt16LE(4)
    return { voltage, symbol: 'mV' }
  }
}
