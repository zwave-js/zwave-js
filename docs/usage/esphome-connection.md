# Connecting via ESPHome Z-Wave Proxy

Z-Wave JS can connect to a Z-Wave controller through an [ESPHome](https://esphome.io/) device running the [Z-Wave Proxy](https://esphome.io/components/zwave_proxy/) component. This approach is **recommended over raw serial-over-TCP connections** (like `ser2net`) because ESPHome locally acknowledges Z-Wave frames, significantly reducing latency and improving reliability.

## Configuration in Z-Wave JS

To connect via ESPHome Z-Wave Proxy, use any of the following supported connection strings as the "Serial Port" in the Z-Wave JS configuration:

```
esphome://<hostname-or-ip>
esphome://<hostname-or-ip>:<port>
```

If you do not specify a port, Z-Wave JS will use the default ESPHome Native API port (6053).

### With encryption

If your ESPHome device has an encryption key configured, append `?key=<base64-key>` to the connection string:

```
esphome://<hostname-or-ip>?key=<base64-key>
esphome://<hostname-or-ip>:<port>?key=<base64-key>
```

The encryption key is a Base64-encoded 32-byte key that matches the `encryption.key` configured in your ESPHome device's Native API.
