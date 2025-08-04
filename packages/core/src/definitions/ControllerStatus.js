export var ControllerStatus;
(function (ControllerStatus) {
    /** The controller is ready to accept commands and transmit */
    ControllerStatus[ControllerStatus["Ready"] = 0] = "Ready";
    /** The controller is unresponsive */
    ControllerStatus[ControllerStatus["Unresponsive"] = 1] = "Unresponsive";
    /** The controller is unable to transmit */
    ControllerStatus[ControllerStatus["Jammed"] = 2] = "Jammed";
})(ControllerStatus || (ControllerStatus = {}));
//# sourceMappingURL=ControllerStatus.js.map