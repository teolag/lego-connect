export const HUB_ID = 0x00; // Not in use, Always set to 0x00 (zero)
export const LEGO_HUB_SERVICE_UUID = '00001623-1212-efde-1623-785feabcd123';
export const LEGO_CHARACTERISTIC_UUID = '00001624-1212-efde-1623-785feabcd123';
export const MOVE_HUB_ID = 64;

export type SendFunction = (
  messageType: MessageType,
  data: Buffer,
  category?: OutputCategory,
  port?: Port
) => Promise<void>;

export interface IConnectionInterface {
  onData: (callback: (buffer: Buffer) => void) => void;
  write: (buffer: Buffer, category?: string, port?: Port) => Promise<void>;
  onDisconnect: (callback) => void;
}

export const INCOMING_MESSAGE = 'INCOMING_MESSAGE';
export const OUTGOING_MESSAGE = 'OUTGOING_MESSAGE';
export const DISCONNECT = 'DISCONNECT';

export enum OutputCategory {
  CHANGE_COLOR = 'CHANGE_COLOR',
  RUN_MOTOR = 'RUN_MOTOR',
  CHANGE_BRIGHTNESS = 'CHANGE_BRIGHTNESS'
}

export type SubscriptionData = {
  mode: number;
  buffer: Uint8Array;
};

export enum MessageType {
  HUB_PROPERTIES = 0x01,
  HUB_ACTIONS = 0x02,
  HUB_ALERTS = 0x03,
  HUB_ATTACHED_IO = 0x04,
  ERROR_NOTIFICATION = 0x05,
  PORT_INFORMATION_REQUEST = 0x21,
  PORT_MODE_INFORMATION_REQUEST = 0x22,
  SUBSCRIPTION = 0x41,
  PORT_INFORMATION = 0x43,
  PORT_MODE_INFORMATION = 0x44,
  SENSOR_READING = 0x45,
  SUBSCRIPTION_ACKNOWLEDGEMENTS = 0x47,
  PORT_OUTPUT = 0x81,
  PORT_OUTPUT_FEEDBACK = 0x82
}

export enum ErrorType {
  ACK = 0x01,
  MACK = 0x02,
  BUFFER_OVERFLOW = 0x03,
  TIMEOUT = 0x04,
  COMMAND_NOT_RECOGNIZED = 0x05,
  INVALID_USE = 0x06,
  OVERCURRENT = 0x07,
  INTERNAL_ERROR = 0x08
}

export enum InformationType {
  ADVERTISING_NAME = 0x01,
  BUTTON_STATE = 0x02,
  BATTERY_VOLTAGE_PERCENT = 0x06,
  RADIO_FIRMWARE_VERSION = 0x09
}

export enum PropertyOperations {
  SET = 0x01,
  ENABLE_UPDATES = 0x02,
  DISABLE_UPDATES = 0x03,
  RESET = 0x04,
  REQUEST_UPDATE = 0x05,
  UPDATE = 0x06
}

export enum Port {
  A = 0x00,
  B = 0x01,
  C = 0x02,
  D = 0x03,
  AB = 0x10,
  RGB_LIGHT = 0x32,
  TILT_SENSOR = 0x3a,
  INTERNAL_1 = 0x3b, // Ampere port
  INTERNAL_2 = 0x3c, // Voltage port
  INTERNAL_3 = 0x46 // gives no readings? joo [5, 0, 69, 70, 0]
}

export enum DeviceType {
  HUB_BUTTON = 0x0005,
  LED_LIGHTS = 0x0008,
  VOLTAGE_SENSOR = 0x0014, // power voltage ?
  CURRENT_SENSOR = 0x0015, // circuit power (amperage) ?
  HUB_RGB = 0x0017, // RGB LED on Boost Hub
  DISTANCE_COLOR_SENSOR = 0x0025, // Distance and color sensor
  EXTERNAL_TACHO_MOTOR = 0x0026, // Interactive motor
  INTERNAL_TACHO_MOTOR = 0x0027, // Motor
  INTERNAL_TILT_SENSOR = 0x0028, // TILT SENSOR
  UNKNOWN_DEVICE = 0x0042 // Unknown
}

export enum AttachEventType {
  DETACHED = 0x00,
  ATTACHED = 0x01,
  ATTACHED_VIRTUAL = 0x02
}

export enum ActionTypes {
  SWITCH_OFF_HUB = 0x01,
  DISCONNECT = 0x02,
  HUB_WILL_SWITCH_OFF = 0x30,
  HUB_WILL_DISCONNECT = 0x31
}

export enum SubCommands {
  MOTOR_START_POWER = 0x01,
  MOTOR_START_POWER_MULTI = 0x02,
  SET_ACCELERATION_TIME = 0x05,
  SET_DECELERATION_TIME = 0x06,
  MOTOR_START_SPEED = 0x07,
  MOTOR_START_SPEED_FOR_TIME = 0x09,
  MOTOR_START_SPEED_FOR_DEGREES = 0x0b,
  MOTOR_GOTO_ABSOLUTE_POSITION = 0x0d,
  WRITE_DIRECT_MODE_DATA = 0x51
}

export interface ICommandOptions {
  useBuffer?: boolean;
  sendFeedback?: boolean;
}

export enum MotorEndState {
  FLOAT = 0x00,
  HOLD = 0x7e,
  BRAKE = 0x7f
}

export enum OutputFeedback {
  COMMAND_IN_PROGRESS = 0x01, // Buffer Empty + Command In Progress
  COMMAND_COMPLETED = 0x02, // Buffer Empty + Command Completed
  CURRENT_DISCARDED = 0x04, // Current Command(s) Discarded
  IDLE = 0x08, // Idle
  BUSY_FULL = 0x10, // Busy/Full
  // Combined:
  ONE_DONE = 0x03,
  CONFLICT = 0x05,
  DONE = 0x0a, // 0x0A = 10 = 2 + 8 = Buffer Empty + Command Completed + Idle
  DISCARDED = 0x0e // 0x0E = 14 = 2 + 4 + 8 = Buffer Empty + Command Completed + Current command discarded + Idle
}
