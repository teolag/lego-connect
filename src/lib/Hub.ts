import { EventEmitter } from 'events'
import {
  OUTGOING_MESSAGE,
  INCOMING_MESSAGE,
  Port,
  MessageType,
  ActionTypes,
  ErrorType,
  AttachEventType,
  DeviceType,
  InformationType,
  DISCONNECT,
  OutputCategory,
  HUB_ID,
  OutputFeedback,
  PropertyOperations
} from './types'
import { getMessageType, dumpBuffer, getPort, bitmask2Modes, getAttachEventType, getDeviceType, toHexStr, createDevice } from './utils'
import { Device } from './Device'

export class Hub extends EventEmitter {
  public io: EventEmitter
  private ports: Map<Port, Device> = new Map()

  constructor() {
    super()
    this.io = new EventEmitter()
    this.io.on(OUTGOING_MESSAGE, this.parseBuffer.bind(this))
    this.io.on(DISCONNECT, () => this.emit('disconnect'))
  }

  public disconnect() {
    return this.send(Buffer.from([MessageType.HUB_ACTIONS, ActionTypes.DISCONNECT]))
  }

  public shutDown() {
    return this.send(Buffer.from([MessageType.HUB_ACTIONS, ActionTypes.SWITCH_OFF_HUB]))
  }

  public getAdvertisingName() {
    return this.getHubInformation<string>(InformationType.ADVERTISING_NAME)
  }

  public getFirmwareVersion() {
    return this.getHubInformation<string>(InformationType.RADIO_FIRMWARE_VERSION)
  }

  public getSystemType() {
    return this.getHubInformation<{ systemType: string; deviceType: string }>(InformationType.SYSTEM_TYPE_ID)
  }

  public getBatteryPercent() {
    return this.getHubInformation<number>(InformationType.BATTERY_VOLTAGE_PERCENT)
  }

  public subscribeToBattery(callback) {
    this.subscribeToHubProperty(InformationType.BATTERY_VOLTAGE_PERCENT, callback)
  }

  public subscribeToButton(callback) {
    this.subscribeToHubProperty(InformationType.BUTTON_STATE, callback)
  }

  private subscribeToHubProperty(informationType: InformationType, callback) {
    const key = 'getInformation' + informationType
    this.on(key, callback)
    this.send(Buffer.from([MessageType.HUB_PROPERTIES, informationType, PropertyOperations.ENABLE_UPDATES]))
  }

  private getHubInformation<T>(informationType: InformationType): Promise<T> {
    const key = 'getInformation' + informationType
    return new Promise<T>(resolve => {
      this.once(key, resolve)
      this.send(Buffer.from([MessageType.HUB_PROPERTIES, informationType, PropertyOperations.REQUEST_UPDATE]))
    })
  }

  public send(data: Buffer, category?: OutputCategory, port?: Port) {
    const buffer = Buffer.concat([Buffer.from([data.length + 2, HUB_ID]), data])
    this.io.emit(INCOMING_MESSAGE, { buffer, category, port })
  }

  private parseBuffer(buffer: Buffer) {
    const messageType = getMessageType(buffer)

    switch (messageType) {
      case MessageType.HUB_PROPERTIES: {
        this.handleHubProperties(buffer)
        break
      }

      case MessageType.HUB_ACTIONS: {
        const action = buffer.readUInt8(3)
        if (action === ActionTypes.HUB_WILL_SWITCH_OFF) console.debug('Hub Will Switch Off')
        else if (action === ActionTypes.HUB_WILL_DISCONNECT) console.debug('Hub Will Disconnect')
        else console.debug('Hub action', dumpBuffer(buffer))
        break
      }

      case MessageType.HUB_ALERTS: {
        console.log('HUB_ALERTS', dumpBuffer(buffer))
        break
      }

      case MessageType.ERROR_NOTIFICATION: {
        const messageType: MessageType = buffer.readUInt8(3)
        const errorType: ErrorType = buffer.readUInt8(4)
        console.error('LEGO Connect Error', MessageType[messageType], ErrorType[errorType])
        break
      }

      case MessageType.PORT_OUTPUT_FEEDBACK: {
        // https://lego.github.io/lego-ble-wireless-protocol-docs/index.html#port-output-command-feedback-format
        const port1 = getPort(buffer)
        const device1 = this.requireDeviceByPort(port1)
        const feedback: OutputFeedback = buffer.readUInt8(4)
        const bufferEmpty = (feedback & 0b00011) > 0
        const commandInProgress = (feedback & 0b00001) > 0
        const commandCompleted = (feedback & 0b00010) > 0
        const commandDiscarded = (feedback & 0b00100) > 0
        const idle = (feedback & 0b01000) > 0
        const buzyFull = (feedback & 0b10000) > 0

        device1.emit('OutputFeedback', {
          feedback,
          bufferEmpty,
          commandInProgress,
          commandCompleted,
          commandDiscarded,
          idle,
          buzyFull
        })

        if (buffer.length !== 5) console.warn('Output Feedback longer than 5 bytes, response from multiple ports?', dumpBuffer(buffer))
        break
      }

      case MessageType.PORT_INFORMATION: {
        const port = getPort(buffer)
        const infoType = buffer.readUInt8(4)
        const device = this.requireDeviceByPort(port)

        if (infoType === 0x01) {
          const capabilitiesInt = buffer.readUInt8(5)
          const capabilities: string[] = []
          if (capabilitiesInt & 0b0001) capabilities.push('Logical Synchronizable')
          if (capabilitiesInt & 0b0010) capabilities.push('Logical Combinable')
          if (capabilitiesInt & 0b0100) capabilities.push('Input (seen from Hub)')
          if (capabilitiesInt & 0b1000) capabilities.push('Output (seen from Hub)')
          const modesCount = buffer.readUInt8(6)
          const inputModes = bitmask2Modes(buffer.readUInt16LE(7))
          const outputModes = bitmask2Modes(buffer.readUInt16LE(9))

          device.emit('portInfo', {
            capabilities,
            modesCount,
            inputModes,
            outputModes
          })
        } else if (infoType === 0x02) {
          if (buffer.length === 5) {
            device.emit('portModeCombinations', [])
          } else if (buffer.length === 7) {
            device.emit('portModeCombinations', bitmask2Modes(buffer.readUInt16LE(5)))
          } else {
            console.warn('Oj oj oj så mycket modes?', buffer.length, dumpBuffer(buffer))
          }
        }

        //  length  hubid   messtype, port,   infotype,
        // ["0x0b", "0x00", "0x43",   "0x02", "0x01",   "0x07", "0x04", "0x06", "0x00", "0x01", "0x00"]

        // 6 = 0b0000110   mode 1, mode 2
        // 1 = 0b0000001   mode 0

        break
      }

      case MessageType.PORT_MODE_INFORMATION: {
        const port = getPort(buffer)
        const device = this.requireDeviceByPort(port)
        const mode = buffer.readUInt8(4)
        const modeInformationType = buffer.readUInt8(5)
        const key = 'mode' + mode + 'info' + modeInformationType

        if (modeInformationType === 0) {
          const name = String.fromCharCode(...Array.from(buffer.slice(6)).filter(code => code > 0))
          device.emit(key, name)
        } else if (modeInformationType === 0x01) {
          const raw = {
            min: buffer.readFloatLE(6),
            max: buffer.readFloatLE(10)
          }
          device.emit(key, raw)
        } else if (modeInformationType === 0x02) {
          const percent = {
            min: buffer.readFloatLE(6),
            max: buffer.readFloatLE(10)
          }
          device.emit(key, percent)
        } else if (modeInformationType === 0x03) {
          const si = {
            min: buffer.readFloatLE(6),
            max: buffer.readFloatLE(10)
          }
          device.emit(key, si)
        } else if (modeInformationType === 0x04) {
          const symbol = String.fromCharCode(...Array.from(buffer.slice(6)).filter(code => code > 0))
          device.emit(key, symbol)
        } else if (modeInformationType === 0x80) {
          const numValues = buffer.readUInt8(6)
          const dataType = ['8bit', '16bit', '32bit', 'float'][buffer.readUInt8(7)]
          const totalFigures = buffer.readUInt8(8)
          const decimals = buffer.readUInt8(9)
          device.emit(key, { numValues, dataType, totalFigures, decimals })
        } else {
          console.log('PORT_MODE_INFORMATION', {
            port,
            mode,
            modeInformationType,
            data: dumpBuffer(buffer.slice(6))
          })
        }
        break
      }

      case MessageType.HUB_ATTACHED_IO: {
        this.addOrRemoveDevice(buffer)
        break
      }

      case MessageType.SENSOR_READING: {
        const port = getPort(buffer)
        const device = this.requireDeviceByPort(port)
        device.emit('sensorReading', buffer)
        break
      }

      case MessageType.SUBSCRIPTION_ACKNOWLEDGEMENTS: {
        const port = getPort(buffer)
        const device = this.requireDeviceByPort(port)
        const mode = buffer.readUInt8(4)
        device.emit('subscribed', { mode, buffer })
        break
      }

      default: {
        console.error('Unknown message type', messageType, toHexStr(messageType), buffer)
        throw Error('Unknown data')
      }
    }
  }

  private handleHubProperties(buffer: Buffer) {
    const informationType: InformationType = buffer.readUInt8(3)
    const key = 'getInformation' + informationType
    switch (informationType) {
      case InformationType.ADVERTISING_NAME: {
        const name = String.fromCharCode(...Array.from(buffer.slice(5)))
        this.emit(key, name)
        break
      }
      case InformationType.BATTERY_VOLTAGE_PERCENT: {
        const percent = buffer.readUInt8(5)
        this.emit(key, percent)
        break
      }
      case InformationType.RADIO_FIRMWARE_VERSION: {
        const version = String.fromCharCode(...Array.from(buffer.slice(5)))
        this.emit(key, version)
        break
      }
      case InformationType.SYSTEM_TYPE_ID: {
        const byte = buffer.readUInt8(5)
        const firstThreeBytes = byte >> 5
        const lastFiveBytes = byte & 0b00011111

        let systemType = `Unknown system type [${firstThreeBytes.toString(2)}]`
        if (firstThreeBytes === 0b000) systemType = 'LEGO Wedo 2.0'
        else if (firstThreeBytes === 0b001) systemType = 'LEGO Duplo'
        else if (firstThreeBytes === 0b010) systemType = 'LEGO System'
        else if (firstThreeBytes === 0b011) systemType = 'LEGO System'

        let deviceType = `Unknown device type [${lastFiveBytes.toString(2)}]`
        if (firstThreeBytes === 0b000 && lastFiveBytes === 0b00000) deviceType = 'WeDo Hub'
        else if (firstThreeBytes === 0b001 && lastFiveBytes === 0b00000) deviceType = 'Duplo Train'
        else if (firstThreeBytes === 0b010 && lastFiveBytes === 0b00000) deviceType = 'Boost Hub'
        else if (firstThreeBytes === 0b010 && lastFiveBytes === 0b00001) deviceType = '2 Port Hub'
        else if (firstThreeBytes === 0b010 && lastFiveBytes === 0b00010) deviceType = '2 Port Handset'
        this.emit(key, { systemType, deviceType })
        break
      }
      case InformationType.BUTTON_STATE: {
        const state = buffer.readUInt8(5)
        this.emit(key, state)
        break
      }
      default: {
        console.log('Unknown device information', dumpBuffer(buffer))
      }
    }
  }

  private requireDeviceByPort(port: Port) {
    const device = this.ports.get(port)
    if (!device) throw Error('No device found on port ' + port)
    return device
  }

  private addOrRemoveDevice(buffer: Buffer) {
    const port = getPort(buffer)
    const device = this.ports.get(port)
    const attachEvent = getAttachEventType(buffer)

    if (attachEvent === AttachEventType.DETACHED) {
      if (device) {
        console.debug(DeviceType[device.type] + ' disconnected from port ' + Port[device.port])
        device.emit('disconnect')
      }
    } else if (attachEvent === AttachEventType.ATTACHED || attachEvent === AttachEventType.ATTACHED_VIRTUAL) {
      const deviceType = getDeviceType(buffer)
      // const virtual = attachEvent === AttachEventType.ATTACHED_VIRTUAL
      const device = createDevice(this, port, deviceType)
      if (!device) return
      this.ports.set(port, device)
      this.emit('deviceConnected', device)
    } else {
      throw Error('Unknown port information: ' + dumpBuffer(buffer))
    }
  }
}
