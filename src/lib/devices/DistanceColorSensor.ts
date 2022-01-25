import { Port, DeviceType, SubCommands, ICommandOptions } from '../types'
import { Device } from '../Device'
import { Hub } from '../Hub'

// IR Blaster
// To initialize the Color Sensor in the proper mode/frequency/color/whatever: 0a004100070100000001
// To send 'x' speed to red port on channel 'y': 090081001151074x0y
// To send 'x' speed to blue port on channel 'y': 090081001151075x0y
// where 'x' in range [0..F] (0 increments to 7 in one direction, 9 decrements to F in the other direction) and 'y' in range [0..3]
// (this assuming a Color Sensor at port A of a Powered Up hub no.4)

export enum DistanceColorModes {
  COLOR = 0x00, // RGB light    Colordata
  PROXIMITY = 0x01, // Green light,  distance data
  COUNTING = 0x02, // Green light, number of changes?
  REFLECT = 0x03, // Red Light, reflectivity in percent
  AMBIENT = 0x04, // Blue light.  Ambient light in percent
  LED_COLOR = 0x05, // starts black. Can set color by setColor()
  RGB = 0x06, // RGB....  Returns R G and B
  IR_TRANSMITTER = 0x07, // // black.
  COLOR_DISTANCE = 0x08, // RGB, both color and distance data. and close distance?
  DEBUG = 0x09,
  CALIBRATION = 0x0a
}

export type DistanceColorRGBData = {
  r: number
  g: number
  b: number
}

export enum LedColor {
  OFF = 0x00,
  BLUE = 0x03,
  GREEN = 0x05,
  RED = 0x09,
  WHITE = 0x0a
}

export class DistanceColorSensor extends Device {
  constructor(hub: Hub, port: Port) {
    super(hub, port, DeviceType.DISTANCE_COLOR_SENSOR, 'Distance color sensor')
  }

  public setColor(color: LedColor, options?: ICommandOptions) {
    const data = Buffer.from([SubCommands.WRITE_DIRECT_MODE_DATA, DistanceColorModes.LED_COLOR, color])
    this.sendCommand(data, options)
  }

  public parseSensorReading(buffer: Buffer, mode: DistanceColorModes) {
    switch (mode) {
      case DistanceColorModes.LED_COLOR:
        return { color: buffer.readUInt8(4) as LedColor }
      case DistanceColorModes.COLOR:
        return { color: buffer.readUInt8(4) }
      case DistanceColorModes.PROXIMITY:
        return { distance: buffer.readUInt8(4) }
      case DistanceColorModes.COLOR_DISTANCE: {
        const color = buffer.readUInt8(4)
        const distance = buffer.readUInt8(5)
        const partial = buffer.readUInt8(7)

        let length = distance
        if (partial > 0) {
          length = distance + 1.0 / partial
        }

        const millimeters = Math.floor(length * 25.4) - 20

        return { color, millimeters }
      }
      case DistanceColorModes.RGB: {
        const rgb: DistanceColorRGBData = {
          r: buffer.readUInt8(4),
          g: buffer.readUInt8(6),
          b: buffer.readUInt8(8)
        }
        return rgb
      }
      case DistanceColorModes.COUNTING:
        return { counter: buffer.readInt32LE(4) }
      default:
        return {}
    }
  }
}
