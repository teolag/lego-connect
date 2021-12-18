import { Hub } from "../Hub"
import { SubCommands, Port, OutputCategory, DeviceType, ICommandOptions } from "../types"
import { Device } from "../Device"

export class LEDLights extends Device {
  
  constructor(hub: Hub, port: Port) {
    super(hub, port, DeviceType.LED_LIGHTS)
  }
  
  public setBrightness(brightness: number, options?: ICommandOptions) {
    const mode = 0x00
    const data = Buffer.from([SubCommands.WRITE_DIRECT_MODE_DATA, mode, brightness]);
    this.sendCommand(data, options, OutputCategory.CHANGE_BRIGHTNESS)
  }
  
  public parseSensorReading(buffer: Buffer, mode: number): object {
    return {}
  }
}