
## Inspraition
 - Python lib https://github.com/undera/pylgbst
 - Reverse engineering the LEGO BOOST Hub https://github.com/JorgePe/BOOSTreveng
 - Node https://github.com/clebert/powered-up
 - Library for controlling Lego Boost with Web Bluetooth API - https://github.com/ttu/lego-boost-browser
 - LEGO BLE protocol: https://lego.github.io/lego-ble-wireless-protocol-docs/
 - LEGO PoweredUp Documentation http://www.treczoks.net/PoweredUp!%20Documentation.pdf
 - Node Powered Up: https://github.com/nathankellenicki/node-poweredup


```
Length    HubId     MessageType

                    HubProperties
0x0?      0x00      0x01

                    HubActions
                    0x02

                    Hub Alerts
                    0x03

                    Hub Attached I/O    Port      AttachEventType
                    0x04                [PORT]    0x00 (Detached)
                                                                            Device Type 16bit LE
                                                  0x01 (Attached)           [DEVICE_TYPE]   [DEVICE_TYPE]   [Hardware Revision]   [Software Revision]
                                                  0x02 (Attached Virtual)   [DEVICE_TYPE]   [DEVICE_TYPE]   Port 1                Port 2

                    Error Notification
                    0x05

                    Port Information Request
                    0x21

                    Port Mode Information Request
                    0x22

                    Subscription
                    0x41

                    Port Information
                    0x43

                    Port Mode Information
                    0x44

                    Sensor Reading
                    0x45

                    Subscription Acknowledgements
                    0x47

                    Port Output
                    0x81

                    Port Output Feedback
                    0x82
```