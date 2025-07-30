export interface StateMachineTransition<State extends StateMachineState, Effect = undefined> {
    effect?: Effect;
    newState: State;
}
export interface StateMachineState {
    value: number | string;
    done?: boolean;
}
export interface StateMachineInput {
    value: number | string;
}
export type StateMachineTransitionMap<State extends StateMachineState, Input extends StateMachineInput, Effect = undefined> = (state: State) => (input: Input) => StateMachineTransition<State, Effect | undefined> | undefined;
export type InferStateMachineTransitions<T extends StateMachine<any, any, any>> = T extends StateMachine<infer S, infer I, infer E> ? StateMachineTransitionMap<S, I, E | undefined> : never;
export declare class StateMachine<State extends StateMachineState, Input extends StateMachineInput, Effect = undefined> {
    constructor(initialState: State, transitions: StateMachineTransitionMap<State, Input, Effect | undefined>);
    protected transitions: StateMachineTransitionMap<State, Input, Effect | undefined>;
    /** Restarts the machine from the initial state */
    restart(): void;
    /** Determines the next transition to take */
    next(input: Input): StateMachineTransition<State, Effect | undefined> | undefined;
    /** Transitions the machine to the next state. This does not execute effects */
    transition(next?: State): void;
    private _initial;
    private _state;
    /** Returns the current state of the state machine */
    get state(): State;
    /** Returns whether this state machine is done */
    get done(): boolean;
}
//# sourceMappingURL=FSM.d.ts.map