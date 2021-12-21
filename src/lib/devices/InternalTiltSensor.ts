import { Port, DeviceType } from '../types'
import { Device } from '../Device'
import { Hub } from '../Hub'
import { dumpBuffer } from '../utils'

// https://github.com/JorgePe/BOOSTreveng/blob/master/tiltsensor.md
// Subscribe modes
// 0: roll, pitch
// 1: strange
// 2: nothing??
// 3: count HARD bumps
// 4: xyz?

// https://github.com/JorgePe/BOOSTreveng/blob/master/tiltsensor.md
// Subscribe modes
// 0: roll, pitch
// 1: strange
// 2: nothing??
// 3: count HARD bumps
// 4: xyz?
export enum TiltModes {
  ROLL_PITCH = 0x00,
  MODE1 = 0x01
}

export class TiltSensor extends Device {
  constructor(hub: Hub, port: Port) {
    super(hub, port, DeviceType.INTERNAL_TILT_SENSOR)
  }

  public parseSensorReading(buffer: Buffer, mode: TiltModes) {
    switch (mode) {
      case TiltModes.ROLL_PITCH: {
        const roll = buffer.readInt8(4)
        const pitch = buffer.readInt8(5)
        return { roll, pitch }
      }
      default: {
        console.warn('Unhandled mode', mode, 'Buffer', dumpBuffer(buffer))
        return {}
      }
    }
  }
}
