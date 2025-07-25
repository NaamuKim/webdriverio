/**
 * Throttle the network capabilities of the browser. This can help to
 * emulate certain scenarios where a user loses their internet connection
 * and your app needs to address that.
 *
 * There are many presets available with default configurations for ease of use.
 * They are `offline`, `GPRS`, `Regular2G`, `Good2G`, `Regular3G`, `Good3G`,
 * `Regular4G`, `DSL`, `WiFi`, `online`.
 *
 * You can see the values for these presets [in the source code](https://github.com/webdriverio/webdriverio/blob/6824e4eb118a8d20685f12f4bc42f13fd56f8a25/packages/webdriverio/src/commands/browser/throttleNetwork.js#L29).
 *
 * :::info
 *
 * Note that using the `throttleNetwork` command requires support for Chrome DevTools protocol and e.g.
 * can not be used when running automated tests in the cloud. Chrome DevTools protocol is not installed by default,
 * use `npm install puppeteer-core` to install it.
 * Find out more in the [Automation Protocols](/docs/automationProtocols) section.
 *
 * :::
 *
 * <example>
    :throttleNetwork.js
    it('should throttle the network', async () => {
        // via static string preset
        await browser.throttleNetwork('Regular3G')

        // via custom values
        await browser.throttleNetwork({
            offline: false,
            downloadThroughput: 200 * 1024 / 8,
            uploadThroughput: 200 * 1024 / 8,
            latency: 20
        })
    });
 * </example>
 *
 * @alias browser.throttleNetwork
 * @param {ThrottleOptions} params  parameters for throttling
 * @param {boolean}        params.offline              True to emulate internet disconnection.
 * @param {number}         params.latency              Minimum latency from request sent to response headers received (ms).
 * @param {number}         params.downloadThroughput   Maximal aggregated download throughput (bytes/sec). -1 disables download throttling.
 * @param {number}         params.uploadThroughput     Maximal aggregated upload throughput (bytes/sec). -1 disables upload throttling.
 * @type utility
 *
 */
import { getBrowserObject } from '@wdio/utils'
import type { ThrottleOptions } from '../../types.js'

const NETWORK_PRESETS = {
    'offline': {
        offline: true,
        downloadThroughput: 0,
        uploadThroughput: 0,
        latency: 1
    },
    'GPRS': {
        offline: false,
        downloadThroughput: 50 * 1024 / 8,
        uploadThroughput: 20 * 1024 / 8,
        latency: 500
    },
    'Regular2G': {
        offline: false,
        downloadThroughput: 250 * 1024 / 8,
        uploadThroughput: 50 * 1024 / 8,
        latency: 300
    },
    'Good2G': {
        offline: false,
        downloadThroughput: 450 * 1024 / 8,
        uploadThroughput: 150 * 1024 / 8,
        latency: 150
    },
    'Regular3G': {
        offline: false,
        downloadThroughput: 750 * 1024 / 8,
        uploadThroughput: 250 * 1024 / 8,
        latency: 100
    },
    'Good3G': {
        offline: false,
        downloadThroughput: 1.5 * 1024 * 1024 / 8,
        uploadThroughput: 750 * 1024 / 8,
        latency: 40
    },
    'Regular4G': {
        offline: false,
        downloadThroughput: 4 * 1024 * 1024 / 8,
        uploadThroughput: 3 * 1024 * 1024 / 8,
        latency: 20
    },
    'DSL': {
        offline: false,
        downloadThroughput: 2 * 1024 * 1024 / 8,
        uploadThroughput: 1 * 1024 * 1024 / 8,
        latency: 5
    },
    'WiFi': {
        offline: false,
        downloadThroughput: 30 * 1024 * 1024 / 8,
        uploadThroughput: 15 * 1024 * 1024 / 8,
        latency: 2
    },
    'online': {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1
    }
} as const

const NETWORK_PRESET_TYPES = Object.keys(NETWORK_PRESETS)

export async function throttleNetwork (
    this: WebdriverIO.Browser,
    params: ThrottleOptions
): Promise<void> {
    if (
        /**
         * check string parameter
         */
        (typeof params !== 'string' || !NETWORK_PRESET_TYPES.includes(params)) &&
        /**
         * check object parameter
         */
        (typeof params !== 'object')
    ) {
        throw new Error(`Invalid parameter for "throttleNetwork". Expected it to be typeof object or one of the following values: ${NETWORK_PRESET_TYPES.join(', ')} but found "${params}"`)
    }

    /**
     * use WebDriver extension if connected with cloud service
     */
    if (this.isSauce) {
        const browser = getBrowserObject(this)
        await browser.sauceThrottleNetwork(params)
        return
    }

    const failedConnectionMessage = 'No Puppeteer connection could be established which is required to use this command'

    // Connect to Chrome DevTools
    await this.getPuppeteer()
    if (!this.puppeteer) {
        throw new Error(failedConnectionMessage)
    }

    const pages = await this.puppeteer.pages()

    if (!pages.length) {
        throw new Error(failedConnectionMessage)
    }

    const client = await pages[0].target().createCDPSession()

    // Set throttling property
    await client.send(
        'Network.emulateNetworkConditions',
        typeof params === 'string'
            ? NETWORK_PRESETS[params]
            : params
    )

    return
}
