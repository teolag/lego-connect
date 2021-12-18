import { MessageType, Port, DeviceType, AttachEventType } from "./types"
import { Hub } from "./Hub"
import { LEDLights } from "./devices/LEDLights"
import { TachoMotor } from "./devices/TachoMotor"
import { HubRGB } from "./devices/HubRGB"
import { TiltSensor } from "./devices/InternalTiltSensor"
import { DistanceColorSensor } from "./devices/DistanceColorSensor"
import { VoltageSensor } from "./devices/VoltageSensor"
import { CurrentSensor } from "./devices/CurrentSensor"

export const toHexStr = (dec: number) => "0x" + dec.toString(16).padStart(2, "0")
export const dumpBuffer = (buffer: Buffer) => Array.from(buffer).map(toHexStr)
export const dumpPort = (port: Port) => `Port ${Port[port]} (${toHexStr(port)})`

export function getMessageType(data: Buffer) {
  const type = data.readUInt8(2) as MessageType
  if(MessageType[type] === undefined) {
    throw Error(`Unknown message type: ${type} (${toHexStr(type)})`)
  }
  return type
}

export function getPort(data: Buffer): Port {
  const type = data.readUInt8(3) as Port
  if(Port[type] === undefined) {
    throw Error(`Unknown port type: ${type} (${toHexStr(type)})`)
  }
  return type
}

export function getDeviceType(data: Buffer) {
  const type = data.readInt16LE(5) as DeviceType
  if(DeviceType[type] === undefined) {
    throw Error(`Unknown device type: ${type} (${toHexStr(type)})`)
  }
  return type
}


export function getAttachEventType(buffer: Buffer) {
  if(getMessageType(buffer)!==MessageType.HUB_ATTACHED_IO) throw Error('Invalid message type. Attach Event Type is only on HUB_ATTACHED_IO messages')
  const type = buffer.readUInt8(4) as AttachEventType
  if(AttachEventType[type] === undefined) {
    throw Error(`Unknown attach event type: ${type} (${toHexStr(type)})`)
  }
  return type
}


export function bitmask2Modes(value: number) {
  return value.toString(2)
    .split('')
    .map(v => parseInt(v, 10))
    .reverse()
    .map((v,i) => v? i : null)
    .filter(v => v!==null)
}


export function createDevice(hub: Hub, port: Port, deviceType: DeviceType) {
  switch(deviceType) {
    case DeviceType.HUB_RGB: return new HubRGB(hub, port)
    case DeviceType.EXTERNAL_TACHO_MOTOR: return new TachoMotor(hub, port, deviceType)
    case DeviceType.INTERNAL_TACHO_MOTOR: return new TachoMotor(hub, port, deviceType)
    case DeviceType.INTERNAL_TILT_SENSOR: return new TiltSensor(hub, port)
    case DeviceType.DISTANCE_COLOR_SENSOR: return new DistanceColorSensor(hub, port)
    case DeviceType.LED_LIGHTS: return new LEDLights(hub, port)
    case DeviceType.VOLTAGE_SENSOR: return new VoltageSensor(hub, port)
    case DeviceType.CURRENT_SENSOR: return new CurrentSensor(hub, port)
    default: {
      console.warn("No device created for", DeviceType[deviceType], toHexStr(deviceType))
      return null
    }
  }
}


export function isNumber(num: number) {
  return typeof num === 'number' && !Number.isNaN(num) && Number.isFinite(num)
}

export function validateSpeed(speed: number) {
  if(!isNumber(speed) || speed < -100 || speed > 100) {
    throw Error(`Invalid speed '${speed}'. Must be a number between -100 and 100`)
  }
}
