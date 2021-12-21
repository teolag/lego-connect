import { expect } from 'chai'
import { DeviceType, Port } from '../src/lib/types'
import { FakeHub } from '../src/lib/hubs/FakeHub'
import { TachoMotor } from '../src/lib/devices/TachoMotor'
import { LEDLights } from '../src/lib/devices/LEDLights'

let hub: FakeHub
beforeEach('connect to fake hub', async () => {
  hub = new FakeHub()
})

describe('Add device', () => {
  it('Internal motor in port A', async () => {
    const addFakeMotor = new Promise<TachoMotor>(resolve => {
      hub.once('deviceConnected', device => resolve(device as TachoMotor))
      hub.addFakeDevice(DeviceType.INTERNAL_TACHO_MOTOR, Port.A)
    })

    const device = await addFakeMotor
    expect(device).to.have.property('port', Port.A)
    expect(device).to.have.property('type', DeviceType.INTERNAL_TACHO_MOTOR)
    expect(device).to.have.property('startMotor')
  })

  it('LED lights in port C', async () => {
    const addFakeLight = new Promise<LEDLights>(resolve => {
      hub.once('deviceConnected', device => resolve(device as LEDLights))
      hub.addFakeDevice(DeviceType.LED_LIGHTS, Port.C)
    })

    const device = await addFakeLight
    expect(device).to.have.property('port', Port.C)
    expect(device).to.have.property('type', DeviceType.LED_LIGHTS)
    expect(device).to.have.property('setBrightness')
  })
})

describe('Handle tacho-motor', () => {
  it('Start motor', async () => {
    const addFakeMotor = new Promise<TachoMotor>(resolve => {
      hub.once('deviceConnected', device => resolve(device as TachoMotor))
      hub.addFakeDevice(DeviceType.INTERNAL_TACHO_MOTOR, Port.A)
    })

    const device = await addFakeMotor

    const { buffer } = await hub.doAndListen(() => {
      device.startMotor(30, 70)
    })

    expect(buffer).to.eql(Buffer.from([0x0a, 0x00, 0x81, 0x00, 0x11, 0x07, 0x1e, 0x46, 0x7f, 0x00]))
  })
})
