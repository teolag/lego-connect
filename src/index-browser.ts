import { LEGO_HUB_SERVICE_UUID, LEGO_CHARACTERISTIC_UUID, HubRGBColor, Port, MessageType, INCOMING_MESSAGE, OUTGOING_MESSAGE, DISCONNECT, Hub } from "./index";
// EventEmitter.defaultMaxListeners = 20

let outbox: {data, collection, resolve, reject}[] = []

async function scanForHubs() {
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [LEGO_HUB_SERVICE_UUID] }],
  })
  if(!device) return
  if(!device.gatt) throw Error("No device found")

  const hub = new Hub()

  const server = await device.gatt.connect()
  const service = await server.getPrimaryService(LEGO_HUB_SERVICE_UUID)

  const characteristic = await service.getCharacteristic(LEGO_CHARACTERISTIC_UUID)
  characteristic.startNotifications();
  characteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
    const gatt = event.target as BluetoothRemoteGATTCharacteristic
    if(gatt?.value?.buffer === undefined) return
    const buffer = Buffer.from(gatt.value.buffer)
    hub.io.emit(OUTGOING_MESSAGE, buffer)
  })

  hub.io.on(INCOMING_MESSAGE, (payload) => sendToHub(characteristic, payload.buffer, payload.category, payload.port))
  device.addEventListener('gattserverdisconnected', () => hub.io.emit(DISCONNECT))

  return hub
}


function sendToHub(characteristic: BluetoothRemoteGATTCharacteristic, data: Buffer, category?: string, port?: Port) {
  const collection = category? category + (port ? '|' + port : '') : null
  if(collection) {
    outbox = outbox.filter(item => item.collection !== collection)
  }

  const promise = new Promise<void>((resolve, reject) => {
    outbox.push({data, collection, resolve, reject})
  })
  processOutbox(characteristic)
  return promise
}

let sending: boolean
function processOutbox(characteristic: BluetoothRemoteGATTCharacteristic) {
  if(sending || outbox.length===0) return

  sending = true
  const {data, resolve, reject} = (outbox.shift())!
  characteristic.writeValue(data)
    .then(() => {
      resolve()
      sending = false
      processOutbox(characteristic)
    })
    .catch(err => {
      console.error("Error sending", data, err)
      reject(err)
      sending = false
    })
}

export * from './index'
export {
  scanForHubs,
  HubRGBColor,
  Port,
  MessageType
}
