import { Port, DeviceType } from '../types'
import { Device } from '../Device'
import { Hub } from '../Hub'
import { dumpBuffer } from '../utils'

// https://github.com/JorgePe/BOOSTreveng/blob/master/tiltsensor.md
// https://lego.github.io/lego-ble-wireless-protocol-docs/#output-sub-command-tiltimpactpreset-presetvalue-n-a

// Subscribe modes
// 0: roll, pitch
// 1: roll, pitch simple
// 2: side
// 3: bump counter
// 4: acceleration

export enum TiltModes {
  ANGLE = 0x00,
  TILT = 0x01,
  ORIENTATION = 0x02,
  IMPACT = 0x03,
  ACCELERATION = 0x04
}

export class TiltSensor extends Device {
  constructor(hub: Hub, port: Port) {
    super(hub, port, DeviceType.INTERNAL_TILT_SENSOR, 'Internal tilt sensor')
  }

  public parseSensorReading(buffer: Buffer, mode: TiltModes) {
    switch (mode) {
      case TiltModes.ANGLE: {
        const roll = buffer.readInt8(4)
        const pitch = buffer.readInt8(5)
        return { roll, pitch }
      }

      case TiltModes.ACCELERATION: {
        const x = buffer.readInt8(4)
        const y = buffer.readInt8(5)
        const z = buffer.readInt8(6)
        return { x, y, z }
      }

      case TiltModes.TILT: {
        const val = buffer.readInt8(4)
        if (val === 0) return { state: 'Flat' }
        if (val === 3) return { state: 'Acending' }
        if (val === 9) return { state: 'Descending' }
        if (val === 5) return { state: 'Turn left' }
        if (val === 7) return { state: 'Turn right' }
        return {}
      }

      case TiltModes.ORIENTATION: {
        const val = buffer.readInt8(4)
        if (val === 0) return { state: 'Flat' }
        if (val === 1) return { state: 'Top side' }
        if (val === 2) return { state: 'Bottom' }
        if (val === 3) return { state: 'Left side' }
        if (val === 4) return { state: 'Right side' }
        if (val === 5) return { state: 'Upside down' }
        return {}
      }

      case TiltModes.IMPACT: {
        const counter = buffer.readInt32LE(4)
        return { counter }
      }

      default: {
        console.warn('Unhandled mode', mode, 'Buffer', dumpBuffer(buffer))
        return {}
      }
    }
  }
}
