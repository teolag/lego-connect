import { Port, DeviceType, OutputCategory, SubCommands, MotorEndState, ICommandOptions } from '../types'
import { validateSpeed } from '../utils'
import { Device } from '../Device'
import { Hub } from '../Hub'

export interface IMotorOptions extends ICommandOptions {
  motorEndState?: MotorEndState
  useAcceleration?: boolean
  useDecceleration?: boolean
}

export enum MotorModes {
  POWER = 0x00, // In percent
  SPEED = 0x01, // In percent
  POSITION = 0x02 // Absolute degrees sice startup
}

export class TachoMotor extends Device {
  constructor(hub: Hub, port: Port, type: DeviceType, name: string) {
    super(hub, port, type, name)
  }

  public parseSensorReading(buffer: Buffer, mode: MotorModes) {
    switch (mode) {
      case MotorModes.POWER:
        return { power: buffer.readInt8(4) }
      case MotorModes.SPEED:
        return { speed: buffer.readInt8(4) }
      case MotorModes.POSITION:
        return { angle: buffer.readInt32LE(4) }
    }
  }

  public startMotor(speed: number, power = 100, duration?: number, options?: IMotorOptions) {
    validateSpeed(speed)
    const motorEndState = options?.motorEndState ?? MotorEndState.BRAKE
    const accAndDecc = 0 + (options?.useAcceleration ? 1 : 0) + (options?.useDecceleration ? 2 : 0)
    if (duration) {
      const data = Buffer.from([SubCommands.MOTOR_START_SPEED_FOR_TIME, 0x00, 0x00, speed, power, motorEndState, accAndDecc])
      data.writeUInt16LE(duration * 1000, 1)
      return this.sendCommand(data, options, OutputCategory.RUN_MOTOR)
    } else {
      const data = Buffer.from([SubCommands.MOTOR_START_SPEED, speed, power, motorEndState, accAndDecc])
      return this.sendCommand(data, options, OutputCategory.RUN_MOTOR)
    }
  }

  public turnMotor(degrees: number, speed: number, power = 100, options?: IMotorOptions) {
    validateSpeed(speed)
    const motorEndState = options?.motorEndState ?? MotorEndState.BRAKE
    const accAndDecc = 0 + (options?.useAcceleration ? 1 : 0) + (options?.useDecceleration ? 2 : 0)
    const data = Buffer.from([SubCommands.MOTOR_START_SPEED_FOR_DEGREES, 0x00, 0x00, 0x00, 0x00, speed, power, motorEndState, accAndDecc])
    data.writeInt32LE(degrees, 1)
    return this.sendCommand(data, options, OutputCategory.RUN_MOTOR)
  }

  public turnTo(angle: number, speed: number, power = 100, options?: IMotorOptions) {
    validateSpeed(speed)
    const motorEndState = options?.motorEndState ?? MotorEndState.BRAKE
    const accAndDecc = 0 + (options?.useAcceleration ? 1 : 0) + (options?.useDecceleration ? 2 : 0)
    const data = Buffer.from([SubCommands.MOTOR_GOTO_ABSOLUTE_POSITION, 0x00, 0x00, 0x00, 0x00, speed, power, motorEndState, accAndDecc])
    data.writeInt32LE(angle, 1)
    return this.sendCommand(data, options, OutputCategory.RUN_MOTOR)
  }

  public setAccelerationTime(time: number, profile = 0x00) {
    const message = Buffer.from([SubCommands.SET_ACCELERATION_TIME, 0x00, 0x00, profile])
    message.writeUInt16LE(time, 1)
    return this.sendCommand(message)
  }

  public setDecelerationTime(time: number, profile = 0x00) {
    const message = Buffer.from([SubCommands.SET_DECELERATION_TIME, 0x00, 0x00, profile])
    message.writeUInt16LE(time, 1)
    return this.sendCommand(message)
  }

  public setPower(power: number) {
    const message = Buffer.from([SubCommands.MOTOR_START_POWER, 0x00])
    message.writeInt8(power, 1)
    return this.sendCommand(message)
  }

  public stop() {
    this.setPower(0)
  }

  public break() {
    this.setPower(127)
  }
}
