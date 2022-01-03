import { DeviceType, TiltModes, TiltSensor } from '../src'
import * as lego from '../src/node'

lego.scanForHubs()

lego.onHubConnected(async hub => {
  lego.stopScanning()

  hub.subscribeToDevices(async device => {
    console.log('Device found', device.name)

    if (device.type === DeviceType.INTERNAL_TILT_SENSOR) {
      const portInfo = await device.getPortInformation()
      console.log('Port information', device.port, portInfo)
      portInfo.modes?.forEach(mode => console.log(mode))

      const tilt = device as TiltSensor
      tilt.on('change', data => {
        console.log('Tilt data', data)
      })
      tilt.subscribe(TiltModes.IMPACT)
    }
  })

  hub.subscribeToBattery(battery => {
    console.log('Battery updated', battery)
  })

  const name = await hub.getAdvertisingName()
  console.log('Name', name)

  const battery = await hub.getBatteryPercent()
  console.log('Battery', battery)
})
