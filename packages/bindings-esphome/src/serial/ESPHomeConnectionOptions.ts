export interface ESPHomeConnectionOptions {
	/** The hostname or IP address of the ESPHome device */
	host: string;
	/** The port number (default: 6053) */
	port?: number;
	/** Connection timeout in milliseconds (default: 5000) */
	timeout?: number;
	/** Whether to use encrypted communication (Noise Protocol) */
	encrypted?: boolean;
	/** Device password for encrypted connections */
	password?: string;
}
