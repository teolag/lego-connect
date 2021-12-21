import * as noble from '@abandonware/noble'
import { Hub, LEGO_HUB_SERVICE_UUID, MOVE_HUB_ID, INCOMING_MESSAGE, OUTGOING_MESSAGE, DISCONNECT } from '../lib/index'
import { EventEmitter } from 'events'
EventEmitter.defaultMaxListeners = 20

let onConnectedCallback
const hubs: Hub[] = []

async function hubFound(peripheral: noble.Peripheral) {
  if (isMoveHub(peripheral)) {
    const hub = new Hub()
    hubs.push(hub)

    await peripheral.connectAsync()
    const discoveries = await peripheral.discoverAllServicesAndCharacteristicsAsync()
    const characteristic = discoveries.characteristics[0]
    // const service = discoveries.services[0]
    await characteristic.subscribeAsync()
    characteristic.on('data', (data: Buffer) => hub.io.emit(OUTGOING_MESSAGE, data))

    peripheral.once('disconnect', () => {
      hub.io.emit(DISCONNECT)
      const index = hubs.indexOf(hub)
      hubs.splice(index, 1)
    })
    hub.io.on(INCOMING_MESSAGE, payload => {
      characteristic.writeAsync(payload.buffer, true)
    })

    if (onConnectedCallback) onConnectedCallback(hub)
  } else {
    // console.log("Found unknown device", peripheral.advertisement, peripheral.uuid)
  }
}

function scanForHubs() {
  noble.on('discover', hubFound)
  noble.on('scanStart', () => console.log('Scanning for LEGO Bluetooth Hubs...'))
  noble.on('scanStop', () => console.log('Stop scanning'))
  noble.on('stateChange', state => {
    // possible state values: "unknown", "resetting", "unsupported", "unauthorized", "poweredOff", "poweredOn"
    if (state === 'poweredOn') noble.startScanningAsync()
    else console.log('noble not ready', state)
  })
}

function stopScanning() {
  noble.stopScanning()
}

function isMoveHub(peripheral: noble.Peripheral) {
  return (
    peripheral.advertisement &&
    peripheral.advertisement.serviceUuids &&
    peripheral.advertisement.serviceUuids.includes(LEGO_HUB_SERVICE_UUID.toString().replace(/-/g, '')) &&
    peripheral.advertisement.manufacturerData &&
    peripheral.advertisement.manufacturerData.length > 3 &&
    peripheral.advertisement.manufacturerData[3] === MOVE_HUB_ID
  )
}

function onHubConnected(callback: (hub: Hub) => void) {
  onConnectedCallback = callback
}

export { hubs, scanForHubs, stopScanning, onHubConnected }
