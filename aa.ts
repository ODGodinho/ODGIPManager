export interface IpConnectionInterface {

    /**
     * Establishes the connection for a VPN or Proxy, making it ready for use.
     * This method should handle any necessary setup, such as launching a process for a VPN
     * or selecting an initial proxy from a list.
     *
     * @returns {Promise<void>} A promise that resolves when the connection is successfully established.
     */
    connect(): Promise<void>;

    /**
     * Terminates the VPN or Proxy connection.
     * This should handle any cleanup tasks, like killing a VPN process
     * or clearing the current proxy session.
     *
     * @returns {Promise<void>} A promise that resolves when the disconnection is complete.
     */
    disconnect(): Promise<void>;

    /**
     * Requests the next available IP address from the connection pool or service.
     * For a rotating proxy service, this would fetch the next proxy in the rotation.
     * For a VPN service with multiple servers, this might involve disconnecting and reconnecting
     * to a new server to obtain a different IP.
     *
     * @returns {Promise<string>} A promise that resolves with the new IP address being used.
     */
    nextIp(): Promise<string>;

    /**
     * Forces the connection to use a specific IP, server hash, or identifier.
     * This is useful for targeting a specific proxy from a list or a particular VPN server.
     *
     * @param {string} ip The IP address, hash, or unique identifier for the connection to use.
     * @returns {Promise<void>} A promise that resolves once the specified IP has been set.
     */
    forceIp(ip: string): Promise<void>;

    /**
     * Marks the currently used IP as "good" or successful.
     * This can be used to prioritize IPs that have a high success rate,
     * for example, by moving it to the back of a rotation queue instead of discarding it.
     *
     * @returns {Promise<void>} A promise that resolves when the IP has been saved or marked.
     */
    saveIp(): Promise<void>;

    /**
     * Blocks the currently used IP due to a failure (e.g., login error, captcha, block).
     * This should prevent the IP from being used again in the current session or for a specified duration.
     *
     * @returns {Promise<void>} A promise that resolves when the IP has been successfully blocked.
     */
    blockIp(): Promise<void>;
}
