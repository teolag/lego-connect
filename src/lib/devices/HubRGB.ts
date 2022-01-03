import { Port, DeviceType, OutputCategory, SubCommands, ICommandOptions } from '../types'
import { Device } from '../Device'
import { Hub } from '../Hub'

export enum HubRGBColor {
  OFF = 0x00,
  PINK = 0x01,
  PURPLE = 0x02,
  BLUE = 0x03,
  LIGHTBLUE = 0x04,
  CYAN = 0x05, // LightGreen?
  GREEN = 0x06,
  YELLOW = 0x07, // Ochre?
  ORANGE = 0x08,
  RED = 0x09,
  WHITE = 0x0a
}

export enum HubRGBMode {
  COLOR = 0x00,
  RGB = 0x01
}

export class HubRGB extends Device {
  constructor(hub: Hub, port: Port) {
    super(hub, port, DeviceType.HUB_RGB, 'Hub RGB LED')
  }

  public setColor(color: HubRGBColor, options?: ICommandOptions) {
    const data = Buffer.from([SubCommands.WRITE_DIRECT_MODE_DATA, HubRGBMode.COLOR, color])
    return this.sendCommand(data, options, OutputCategory.CHANGE_COLOR)
  }

  public setRGB(red: number, green: number, blue: number, options?: ICommandOptions) {
    if (this.getMode() !== HubRGBMode.RGB) throw Error('Must be in RGB mode')
    const data = Buffer.from([SubCommands.WRITE_DIRECT_MODE_DATA, HubRGBMode.RGB, red, green, blue])
    return this.sendCommand(data, options, OutputCategory.CHANGE_COLOR)
  }

  public parseSensorReading(buffer: Buffer, mode: HubRGBMode) {
    switch (mode) {
      case HubRGBMode.COLOR:
        return {
          color: buffer.readUInt8(4) as HubRGBColor
        }
      case HubRGBMode.RGB:
        return {
          r: buffer.readUInt8(4),
          g: buffer.readUInt8(5),
          b: buffer.readUInt8(6),
          hex: '#' + buffer.slice(4, 7).toString('hex')
        }
      default:
        return {}
    }
  }
}
