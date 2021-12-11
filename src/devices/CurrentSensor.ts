import { Port, DeviceType } from "../types";
import { Device } from "../Device";
import { Hub } from "../Hub";

// Current when fully loaded:            168-170 mA
// Current when battery says 30%:        168-170 mA
// Current when starting all 3 motors:  peek 684 mA
// Current after motor have stopped      256-258 mA

export class CurrentSensor extends Device {
  constructor(hub: Hub, port: Port) {
    super(hub, port, DeviceType.CURRENT_SENSOR)
  }
  
  public parseSensorReading(buffer: Buffer, mode: number) {
    const current = buffer.readUInt16LE(4)
    return {current, symbol: 'mA'}
  }

}
