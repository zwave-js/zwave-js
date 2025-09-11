export class StateMachine {
    constructor(initialState, transitions) {
        this._initial = this._state = initialState;
        this.transitions = transitions;
    }
    transitions;
    /** Restarts the machine from the initial state */
    restart() {
        this._state = this._initial;
    }
    /** Determines the next transition to take */
    next(input) {
        if (this._state.done)
            return;
        return this.transitions(this._state)(input);
    }
    /** Transitions the machine to the next state. This does not execute effects */
    transition(next) {
        // Allow some convenience by passing the transition's next state directly
        if (next == undefined)
            return;
        this._state = next;
    }
    _initial;
    _state;
    /** Returns the current state of the state machine */
    get state() {
        return this._state;
    }
    /** Returns whether this state machine is done */
    get done() {
        return !!this._state.done;
    }
}
//# sourceMappingURL=FSM.js.map