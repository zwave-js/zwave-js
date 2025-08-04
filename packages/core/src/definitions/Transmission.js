export var TransmitOptions;
(function (TransmitOptions) {
    TransmitOptions[TransmitOptions["NotSet"] = 0] = "NotSet";
    TransmitOptions[TransmitOptions["ACK"] = 1] = "ACK";
    TransmitOptions[TransmitOptions["LowPower"] = 2] = "LowPower";
    TransmitOptions[TransmitOptions["AutoRoute"] = 4] = "AutoRoute";
    TransmitOptions[TransmitOptions["NoRoute"] = 16] = "NoRoute";
    TransmitOptions[TransmitOptions["Explore"] = 32] = "Explore";
    TransmitOptions[TransmitOptions["DEFAULT"] = 37] = "DEFAULT";
    TransmitOptions[TransmitOptions["DEFAULT_NOACK"] = 0] = "DEFAULT_NOACK";
})(TransmitOptions || (TransmitOptions = {}));
export var TransmitStatus;
(function (TransmitStatus) {
    TransmitStatus[TransmitStatus["OK"] = 0] = "OK";
    TransmitStatus[TransmitStatus["NoAck"] = 1] = "NoAck";
    TransmitStatus[TransmitStatus["Fail"] = 2] = "Fail";
    TransmitStatus[TransmitStatus["NotIdle"] = 3] = "NotIdle";
    TransmitStatus[TransmitStatus["NoRoute"] = 4] = "NoRoute";
})(TransmitStatus || (TransmitStatus = {}));
//# sourceMappingURL=Transmission.js.map