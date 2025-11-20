# Changelog
[Older changelog entries (v1...v12)](CHANGELOG_v12.md)

<!--
	Add placeholder for next release with `wip` snippet
-->
## 15.16.0 (2025-11-04)
### Features
* Config parameter values can now be marked as recommended and automatically be set during the interview (#8164, #8382)
* Config parameters can now be marked as destructive, allowing applications to confirm before setting them (#8170)
* Add API to enable more frequent background RSSI measurements (#8193)

### Bugfixes
* Battery CC reports with invalid levels are now discarded (#8404)

### Config file changes
* Add fingerprint to Kwikset HC-620 (#8371)
* Add Zooz ZSE11 800LR (#8373)
* Add version conditionals and correct parameters for Enbrighten 55258 (#8359)
* Replace wrong troubleshooting link in 700 series firmware warning template (#8365)
* Add Kwikset 918 (#8368)
* Correct user code slot bit field for BE468ZP/BE469/BE469ZP (#8366)
* Add parameters 3, 40 and 84 for Enbrighten 55258, firmware version 5.51 (#8357)

### Changes under the hood
* Updated several dependencies
* The parser for conditional logic in configuration files has been rewritten from scratch instead of being generated (#8380)
* Optimized some timed assertions in integration tests (#8349)

## 15.15.3 (2025-10-15)
### Changes under the hood
* Fixes an issue with loading the DB library when Z-Wave JS was bundled as CommonJS (#8356)

## 15.15.2 (2025-10-14)
### Bugfixes
* Fixes a rare issue with the cache serialization of certain values that could lead to out-of-memory crashes, often immediately or shortly after startup (#8353)

### Config file changes
* Add Namron 4512774 Remote Controller (#8335)

## 15.15.1 (2025-10-08)
### Bugfixes
* Fixed a warning in bundlers about an unexpected `node:net` import (#8343)
* Fixed an issue where the device class of newly joined devices would not be persisted, causing legacy secure devices not to be automatically included with encryption (#8344)

### Config file changes
* Update parameters for HomeSeer WS300 (#8338)
* Add Zooz ZEN78 High Power Relay (#8337)

### Changes under the hood
* Update several dependencies
* Z-Wave JS now uses npm's trusted publishing (#8332, #8334)
* The mock-server and integration tests can now simulate inclusion of devices, both insecure and with Security S0 (#8344)

## 15.15.0 (2025-09-30)
### Features
* Support creating mixed LR and non-LR "multicast" groups (#8143)
* Add driver option to skip log formatting of Z-Wave commands (#8204)
* Add driver option to skip rendering ASCII logo on startup (#8198)

### Bugfixes
* IP based connections no longer block the process for several minutes on connection failures/timeouts (#8203)
* Disable optimistic value updates for slow device classes, like shades and gates (#8004)
* Fixed an issue where replacing a node with S0 security was not possible (#8181)
* Fixed an edge case where support for EU Long Range is not inferred correctly (#8176)
* TX report fields are now hidden from logs when transmitting failed (#8155)
* Route rebuilding now longer aborts/fails when the route to an association target other than the controller cannot be assigned (#8192)
* During route rebuilds, invalid and non-existing association targets are now skipped instead of failing the whole process (#8191)
* Fixed a crash that could happen when requesting missing Transport Service segments over a bad connection (#8154)
* Ongoing transmissions are now aborted early when the expected response CC is received before the ACK for the SendData command (#8196)

### Config file changes
* Add fingerprint to Ultrapro 59350 / 59372 / 59373 / ZWA3016 (#8103)
* Correct parameter size for factory reset of Shelly Wave devices (#8187)
* Add Zooz ZSE50 Siren & Chime (#8182)
* Add fingerprint for Kwikset HomeConnect 620 firmware revision 69.35 (#8057)
* Add fingerprint `0x0811:0x23a9` to "Kwikset HC620" (#8199)

## 15.14.0 (2025-09-17)
### Features
* Support proxying Z-Wave traffic over the ESPHome protocol (#8093)

### Bugfixes
* Fixed an issue where converting NVMs with unknown objects would fail due to unknown NVM section (#8095)
* Zniffer: improve support for parsing ZLF files created by the official Zniffer application (#8165)

### Config file changes
* Add 800 series variant of Minoston MP22ZP (#8171)

### Changes under the hood
* Implement utility to convert Zniffer traces to CSV (#8166)

## 15.13.0 (2025-09-11)
### Features
* Support checking for all firmware updates at once, and support detecting devices unknown to the firmware update service (#8157)

### Bugfixes
* Fixed an issue with migrating NVMs that contain a full list of supported CCs (#8140)
* After failing to leave bootloader, Z-Wave JS no longer keeps checking if the Serial API has started (#8133)
* Fixed an issue where the underlying serial stream (e.g. in the browser) could not be reused when destroying and recreating the driver instance (#8132)
* Stale Battery CC `isLow` values are now cleaned up on startup (#8092)

### Config file changes
* Add Zooz ZEN75 (#7807)
* Bring Inovelli VZW32-SN up to date with latest firmware changes and restore parity with VZW31-SN (#8042)

### Changes under the hood
* Add MCP powered prompt to scrape config files from manufacturer websites (#8099)

## 15.12.0 (2025-08-19)
### Features
* Firmware updates that fail due to an XMODEM communication error are now retried automatically, reducing the risk to get stuck in bootloader until a new firmware is flashed (#8086)

### Bugfixes
* Fixes an issue where the controller would indefinitely be considered as recovering from a jammed state, preventing commands from being re-transmitted (#8052)
* Fixed an issue where the key up event would be force-emitted too early on legacy devices that incorrectly report not to support the "slow refresh" capability (#8087)
* Canceling a "replace failed node" operation no longer prevents other inclusion/exclusion operations from being started (#8084)

### Config file changes
* Add HomeSeer WS300 (#8074)

## 15.11.0 (2025-08-11)
### Features
* Add support for defining Scene labels in config files (#7989)
* Disable SmartStart provisioning entries after 5 failed inclusion attempts (#8017)

### Bugfixes
* Fixed an issue where Aeotec Z-Stick 5 would become unresponsive during NVM backup (#8047)
* Fixed firmware update progress jumping back and forth (#8019)
* Correctly restore cached information on a secondary controller (#7994)
* Fixed incorrect long-term averaging of RSSI values (#8024)
* Ensure failures during NVM migration are surfaced to the application (#8014)

### Config file changes
* Prepare Inovelli VZW31-SN for future firmware upgrade (#8005)
* Add productID `0x0111` to Fakro AMZ Solar awning (#7998)
* Add ECO-DIM.07 800 series version (#8011)
* Update Aeotec Trisensor 8 to firmware 2.8.4 (#8013)
* Remove non-existent parameter 107 for Shelly Wave Plus S (#8010)
* Typo in Shelly dimmer output label (#8006)

### Changes under the hood
* Update devcontainer image (#8015)

## 15.10.0 (2025-07-23)
### Features
* Convert Battery CC `isLow` value to notification event (#7984)
* Clean up Indicator CC values and fix their implementation (#7980)

### Bugfixes
* Use configured RF region as fallback for firmware update checks on controllers without support for querying the region (#7992)
* After a successful supervised `Multilevel Switch Set` with value 255, the actual value is now queried immediately (#7963)

### Config file changes
* Remove proprietary RGB functionality for ZWA-2 (#8000)
* Add fingerprint to FireAngel ZHT-630, add FireAngel ZST-630 (#7117)
* Remove unlock mapping for Schlage lock FE599 (#7870)
* Add Fantem FT117 range extender (#7962)
* Add Zooz ZEN35 (#7757)
* Update label and description for ZWA-2 (#7968)
* Add missing parameter 117 (Reboot) on Shelly Wave Plug S EU (QNPL-0A112) (#7969)

### Changes under the hood
* Setup environment for Copilot Agent (#7995)

## 15.9.0 (2025-07-10)
### Features
* Apply auto powerlevels on every actual region change (#7862)
* If auto-powerlevels are enabled, Z-Wave JS now detects when a controller is incorrectly set to the SDK default powerlevels of +20/+20 dBm applies the correct powerlevels for the current RF region if possible (#7965)
* Reworked how changes to config files are detected, and auto-apply config parameter labels and descriptions automatically on startup. This should avoid having to re-interview devices after label-only changes, at least for future changes. (#7959)

### Bugfixes
* Omit LR nodes from rebuild routes progress (#7936)
* Fixed an issue where joining another network with S2 would not display the DSK (#7935)

### Config file changes
* Rename Antenna to Adapter for ZWA-2 (#7957)
* Add First Alert Smart Smoke & CO Alarm (#7912)
* Fix unmatched quoting in config files (#7934)
* Add Inovelli VZW32-SN mmWave Switch (#7920)
* Update and correct Leviton device metadata (#7928)
* Add params for Enbrighten (Jasco) 59337 and 59338 (#7814)
* Add fingerprint `0x8101:0x4a36` to McoHome MH4936 (#7869)
* Improve accuracy of N4002/N4012 rate parameter labels (#7894)

### Changes under the hood
* The config import script now imports the brand name and correct param descriptions from the Z-Wave Alliance DB (#7951)
* Fine tune instructions for LED feedback in inclusion/exclusion/reset instructions (#7924)
* Teach Copilot to author and review device config files (#7921, #7922, #7923)

## 15.8.0 (2025-06-26)
In this release, we reworked the inclusion, exclusion, remove failed and replace failed node processes. Under the hood, they are now driven by the task scheduler that was introduced in v13.5.0. This gives us more control over their execution and prevents individual processes from interfering with each other, especially the removal of nodes that failed to include via SmartStart. Previously this could lead to some odd issues.

### Features
* The OTW firmware flasher CLI and web flasher now support ZIP files containing a single firmware image (#7892)
* Pinging a node no longer uses automatic route resolution or explorer frames by default. This massively reduces latency in the case of communication failures (a few hundred milliseconds vs. several seconds). The old behavior can be restored using a new option to the `ping` method (#7903)

### Bugfixes
* Migrate inclusion, exclusion, remove failed and replace failed node processes to tasks and ensure they do not interfere with each other (#7904, #7910, #7913, #7915, #7916, #7917, #7918)
* The routing statistics for LR nodes are now initialized on startup to indicate a direct connection (#7900)

### Config file changes
* Add Aeotec Z-Stick 10 Pro (#7906)
* Clean up inclusion/exclusion/reset instructions in many more config files (#7873, #7893)
* Fixed an issue with Yale YRD226 and similar locks where the number of user codes was not stored during the interview (#7890)
* Add Shelly Wave Dimmer, Motion and H&T (#7891)

### Changes under the hood
* The repository now contains instructions that should make it more productive to work with GitHub Copilot (#7898, #7899)

## 15.7.0 (2025-06-17)
### Features
* Zniffer: Support loading existing captures from file or a buffer (#7889)

### Bugfixes
* Encode timestamps in Zniffer traces correctly (#7887)

### Config file changes
* Clean up inclusion/exclusion/reset instructions of lots of config files (#7871)

### Changes under the hood
* The "wrong logfile" detection in issue reports now classifies the log file contents using AI instead of simply looking at the file name. This should significantly reduce noise from Z-Wave JS bot (#7883)
* Added documentation for the utility methods for retrieving Z-Wave registry information (#7881)
* Mention `lowSecurityReason` in S2 documentation (#7882)
* Add missing ConfigManager properties to documentation (#7880)
* Detect forbidden whitespace in config filenames (#7879)
* Add documentation explaining under which circumstances joining another network is not permitted (#7878)
* Add Copilot instructions for authoring device config files (#7872)

## 15.6.0 (2025-05-28)
### Features
* Add options to set powerlevel within legal limits on region change during startup (#7853)

### Bugfixes
* When the serialport closes unexpectedly, try to reopen it first before throwing an error (#7851)
* Work around missing protocol version file in NVM backed up from SDK `7.23.0` and `.1` (#7846)
* The default region is no longer considered to be Europe for firmware updates (#7842)

## 15.5.0 (2025-05-19)
### Features
* Allow the application to disable support for specific CCs (#7821)
* Support OTW updates for the controller via the firmware update service (#7840)

### Bugfixes
* Make the device ID check during OTA updates actually do something (#7839)

### Config file changes
* Add/update several Simon iO devices (#7838)

### Changes under the hood
* Extract TaskScheduler into own library (#7837)

## 15.4.2 (2025-05-15)
### Bugfixes
* Fixed a regression from v15 where Z-Wave JS would immediately soft-reset the controller instead of retrying after an ACK timeout (#7819)
* Fixed a type error after OTW firmware upgrade (#7820)

## 15.4.1 (2025-05-13)
### Bugfixes
* Prevent the interview of battery-powered devices to stop after the first stage when re-interviewing after a firmware update (#7816)

## 15.4.0 (2025-05-12)
### Features
* Update Notification definitions to 2024B-3 specs (#7796)
* Add static methods to query Door Lock CC capabilities (#7799)
* The hardware watchdog no longer gets enabled by default, since this is now handled by recent firmwares. The corresponding driver option and preset have been deprecated. (#7802)

### Bugfixes
* Omit empty fields from TX reports, ignore missing RSSI in routing statistics (#7808)
* Use local time for logging to file (#7800)

### Config file changes
* Add Enbrighten (Jasco) 58446 / ZWA4013 Fan Control (#7673)
* Add Aeotec ZWA046 Home Energy Meter 8 (#7510)
* Add PE653 endpoints for VSP speeds and P5043ME pool/spa mode (#7805)
* Add ZVIDAR WM25C (#7686)
* Add MCO Home MH-S314-7102 (#7733)
* Add McoHome thermostats MH4936, MH5-2D and MH5-4A (#7765)
* Update Inovelli VZW31-SN to FW 1.04 (#7731)
* Add param 29 (load sense) to HomePro ZDP100 (#7713)
* Add Yale YDM3109A Smart Lock (#7670)

## 15.3.2 (2025-05-08)
### Bugfixes
* Fixed a regression from v15 where command delivery verification wouldn't work on S2-capable devices without Supervision (#7795)

### Config file changes
* Disallow manual entry for param 3 on Zooz ZSE70 (#7794)

## 15.3.1 (2025-05-07)
### Bugfixes
* Fixed an issue where some CCs could be missing when Z-Wave JS was bundled (#7791)

## 15.3.0 (2025-05-05)
As of this release, Z-Wave JS no longer destroys the driver instance after NVM restore, OTW upgrades and leaving the bootloader. Previously applications had to catch the corresponding error and re-create the driver instance.

This is no longer necessary, but applications MUST ensure that they always attach the event handlers for the controller and nodes after receiving the `driver ready` event.

### Features
* Re-create controller instance instead of destroying driver after certain actions (#7787)

### Bugfixes
* Fixed an issue where incorrect device info for the controller was exposed until restarting after migration from different hardware (#7776)

### Config file changes
* Add fingerprint `0x0313:0x0109` to "FortrezZ LLC SSA1/SSA2" (#7773)

## 15.2.1 (2025-04-29)
### Bugfixes
* Revert: Work around a possible controller lockup when retransmitting a command to an unreachable device (#7769)

### Changes under the hood
* Don't traverse `node_modules` in import lint, add some known good modules (#7770)
* Bundling improvements (#7771, #7772)

## 15.2.0 (2025-04-28)
### Features
* Support Basic Window Covering CC (#7768)

### Config file changes
* Add Ness Smart Plug ZA-216001 (#7339)

## 15.1.3 (2025-04-26)
### Bugfixes
* Work around a possible controller lockup when retransmitting a command to an unreachable device (#7766)

## 15.1.2 (2025-04-26)
### Bugfixes
* Work around an issue in downstream projects that causes the error `import_serial.isAnySendDataResponse is not a function` (#7762)

### Changes under the hood
* Eliminate internal usage of `.../safe` entrypoints, merge/format imports consistently (#7758)

## 15.1.1 (2025-04-25)
### Bugfixes
* More resilient recovery from disconnected TCP serial ports (#7748)
* Do not delete battery temperature unit if value is unknown (#7749)
* Handle endpoint of inbound Multi Channel V1 commands correctly (#7726)
* Return payload from `sendAndReceiveData` method of Manufacturer Proprietary CC (#7721)
* Only apply CC-related compat options to the root endpoint before Multi Channel interview (#7728)
* Respect remove endpoints compat flag in Multi Channel V1 interview (#7729)
* Ensure that stale cached values are not attributed to newly included nodes (#7755)

### Config file changes
* Add fingerprint `0x0311:0x0109` to "FortrezZ LLC SSA1/SSA2" (#7754)

## 15.1.0 (2025-04-23)
### Features
* Add more proprietary controller features, fix `setValue` when using controller with proprietary features (#7744)
* Add options to omit optional data during NVM migration (#7746)

### Bugfixes
* Retry communication with nodes again when the controller indicates that queuing the command failed (#7743)

### Config file changes
* Add ZWA-2 (#7730)

## 15.0.6 (2025-04-14)
### Bugfixes
* Avoid radio TX queue overflows by waiting for complete transmission, even when no ACK is requested (#7732)

### Changes under the hood
* Implement framework for using proprietary Serial API commands (#7663)

## 15.0.5 (2025-04-07)
### Bugfixes
* Fixed an issue where updating the driver options before starting would cause custom host bindings to be discarded, causing config sync errors in `pkg` bundles (#7722)

## 15.0.4 (2025-04-02)
### Bugfixes
* Fixed a crash that could be caused by writing to the serialport in quick succession (#7716)

### Config file changes
* Declare fingerprint `0x0000:0x0003:0x0008` as 500 series controller (#7697)

## 15.0.3 (2025-03-25)
### Bugfixes
* Commands are now retried again when a serial collision happens (#7695)

## 15.0.2 (2025-03-21)
### Bugfixes
* Fixed an issue where `Indicator` was not defined when bundling with `esbuild` (#7687)

## 15.0.1 (2025-03-14)
### Features
* Add API to query supported `notification` events of a node (#7682)

### Config file changes
* Add alarmType 132 mapping for `Yale YRD4x0` locks (#7677)

### Changes under the hood
* Refactored the `ZWaveNode` class into smaller parts (#7679, #7681)
* Remove stray `debugger` statement from `ZWaveController` constructor (#7680)

## 15.0.0 (2025-03-12)
Z-Wave JS is now able to run in the browser! This allows for new use-cases like interactive usage examples in the documentation, and building web-based Z-Wave tools.

To celebrate this achievement, we've renamed the repository to `zwave-js`, dropping the `node-` prefix. The package names will remain the same.

### Breaking changes · [Migration guide](https://zwave-js.github.io/zwave-js/#/getting-started/migrating/v15)
* Require Node.js 20 or higher
* Remove non-portable sync-versions of methods, require Node 20 (#7580)
* Support communicating with SoC end device firmwares via their CLI (#7628)
* Move OTW firmware update functionality to the `Driver` class (#7662)

### Features
* Browser support (#7586, #7587, #7592, #7631)
* Support staying in the bootloader instead of recovering (#7444)
* Implement new Zniffer commands for LR channel configs (#7665)
* Expose manufacturer name as a node property, even when config file does not exist (#7669)

### Bugfixes
* Correctly handle being queried with Firmware Update CC correctly (#7620, #7627)
* Handle proxy inclusion when NIF and Initiate command are switched (#7621)
* Harden end device CLI detection (#7661)

### Config file changes
* Add fingerprint for ZVIDAR Z-TRV-V01 (#7660)

### Changes under the hood
* Replace `xstate` with a simple built-in state machine (#7460)
* Migrate from Node.js streams to Web Streams API (#7457, #7474)
* Migrate to `ky` as a lightweight, portable replacement of `got` (#7479)
* Untar config updates in memory, remove `execa` from prod deps (#7485)
* Add portable bindings for the filesystem (#7428)
* Allow switching out the DB bindings (#7486)
* Use `pathe` instead of `node:path` for path manipulation (#7551)
* Entry points designated for the browser are now checked by ESLint (#7577)
* Remove dependency on `isDeepStrictEqual` (#7584)
* Decouple logging from `winston` (#7585)
* Lots of dependency updates
* Split documentation generation into separate tasks, fix CCValues types generation (#7644)

## 14.3.13 (2025-03-12)
### Config file changes
* Add missing parameters to Qubino Smart Plug 16A (#7409)
* Add missing parameters for the MCO MH-C221 shutter (#7672)
* Correct Fibaro FGMS001 association groups (#7463)
* Add multi-click detection parameter to Zooz ZEN51/52 (#6730)

## 14.3.12 (2025-03-11)
### Config file changes
* Add Shelly Door/Window Sensor, Wave Plug S, Wave PRO Dimmer 1PM/2PM  (#7641)
* Add SmartWings WB04V (#7659)
* Add new parameters for Zooz ZEN72 firmware 3.40 and 3.50 (#7651)
* Add new Zooz ZEN32 parameter 27 (#7629)
* Update New One N4002 to correct parameters and other information (#7600)
* Update Zooz ZSE44 based on latest docs (#7588)
* Add SmartWings WM25L Smart Motor (#7565)
* Update Zooz ZEN04 to firmware 2.30 (#7538)
* Update Zooz ZEN30 to Firmware v4.20 (#7539)
* Update Zooz ZEN20 to firmware 4.20 (#7541)
* Update Zooz ZEN17 800LR to firmware 2.0 (#7542)
* Update to TKB Home TZ88 (#7523)
* Add missing and new parameters for Zooz ZEN15 (#7495)
* Add fingerprint to Yale YRL210 (#7455)
* Add Springs Window Fashions CRBZ motorized blinds (#7416)
* Add Jasco ZWN4015 In-Wall Smart Switch (#7668)
* Add config parameters to Schlage PIR Motion Sensor (#7413)
* Add Lockly Secure Plus (#7382)
* Update Zooz ZEN74 to firmware 2.10 (#7328)

## 14.3.11 (2025-03-10)
### Bugfixes
* Fixes an issue where no firmware updates would show as available when the region is set to EU_LR (#7667)

## 14.3.10 (2025-02-27)
### Bugfixes
* Discard S2 frames with both the MPAN and MGRP extension (#7619)
* Fixed an issue where subsequent stages of multi-stage firmware updates would fail to start due to the SPAN not being synchronized correctly (#7640)

### Config file changes
* Preserve endpoints for Namron 16A thermostats (#7637)

## 14.3.9 (2025-02-17)
### Bugfixes
* Always query list of supported thermostat setpoint types (#7617)
* Do not throw error responding to invalid `Indicator Description Get` (#7616)
* Expose firmware ID for OTA update to applications (#7599)

### Config file changes
* Allow setting arbitrary Motion Sensitivity for ZSE70 (#7603)

## 14.3.8 (2025-01-28)
### Bugfixes
* Fixed an issue with restoring the network cache from disk on some systems (#7560)

### Config file changes
* Preserve all endpoints for Fibaro FGFS101, FW 26.26 (#7561)
* Preserve all endpoints for Fibaro FGFS101, FW 25.25 (#7558)
* Updates to AEON Labs Minimote (#7544)
* Auto-assign Lifeline for Trane XL624 (#7547)
* Disable Supervision for Everspring SP817 Motion Sensor (#7475)
* Add wakeup instructions for ZSE43 (#7454)
* Add wakeup instructions for ZSE42 (#7489)
* Add wakeup instructions for ZSE41 (#7488)
* Add Zooz ZSE70 800LR (#7496)
* Add new device config for Philips DDL240X-15HZW lock (#7498)
* Add Z-Wave.me Z-Station (#7521)

## 14.3.7 (2024-12-02)
### Bugfixes
* Fixed: Firmware updates fail to start on some devices with error "invalid hardware version" (#7452)

### Changes under the hood
* Classes that emit events are now based on the DOM compatible `EventTarget` class instead of Node.js's proprietary `EventEmitter`. This means that some methods like `prependListener` no longer exist, but we haven't found any usage of this in the wild.

## 14.3.6 (2024-11-22)
### Bugfixes
* Fixed another issue where some CC API methods would incorrectly fail validation of their arguments, causing the node interview to fail (#7435)

## 14.3.5 (2024-11-22)
### Bugfixes
* Fixed an issue that prevented the `nvmedit` CI utility from starting (#7432)
* Fixed an issue where some CC API methods would incorrectly fail validation of their arguments (#7433)

## 14.3.4 (2024-11-20)
### Bugfixes
* Fixed an issue where CC classes would have a different name when `zwave-js` was loaded as CommonJS, changing how those CCs were handled (#7426)

### Changes under the hood
* Argument validation of CC APIs no longer uses `require` calls and explains the validation errors much better (#7407)

## 14.3.3 (2024-11-14)
### Bugfixes
* Fix parsing of some older 500 series NVM formats (#7399)
* Fixed an issue where `mock-server` would not start due to an incorrect module format (#7401)
* Fixed an issue where the auto-generated argument validation for CC API methods would not work correctly in some cases when `zwave-js` was bundled (#7403)

### Config file changes
* Add HomeSys HomeMech-2001/2 (#7400)

## 14.3.2 (2024-11-12)
### Bugfixes
* Fixed an issue where encoding a buffer as an ASCII string would throw an error on Node.js builds without full ICU (#7395)

## 14.3.1 (2024-11-12)
### Config file changes
* Ignore setpoint range for Ecolink TBZ500 (#7393)

### Changes under the hood
* Further reduce dependency on Node.js internals (#7394)

## 14.3.0 (2024-11-11)
This release adds support for using the WebCrypto API as the cryptography backend. Unlike the `node:crypto` module, this API is supported by all modern browsers and JS runtimes.

Technically this is a breaking change, as `SecurityManager2` now needs to be instantiated asynchronously using `await SecurityManager2.create()` instead of `new SecurityManager2()`. However, we don't expect anyone to use this class directly, so this will not be marked as a semver-major release.

### Changes under the hood
* Improve portability of the library by supporting the WebCrypto API as cryptography backend (#7386)

## 14.2.0 (2024-11-07)
### Changes under the hood
* Improved tree-shakability (#7376, #7379)
* CCs are now parsed and serialized asynchronously, Message instances are serialized asynchronously (#7377)

## 14.1.0 (2024-11-06)
### Features
* Allow specifying RF region for OTA firmware updates if the region is unknown or cannot be queried (#7369)
* Add `tryUnzipFirmwareFile` utility to support zipped OTA firmware files (#7372)

### Bugfixes
* Parse negative setback state consistently (#7366)
* Ignore LR nodes when computing neighbor discovery timeout (#7367)
* Automatically fall back to `Europe` when setting region to `Default (EU)` (#7368)

### Changes under the hood
* Improve bundler-friendlyness of `@zwave-js/core` and `@zwave-js/shared` with new browser-specific entry points and `sideEffects` hints (#7374)

## 14.0.0 (2024-11-05)
In this release, a lot of the internal API was refactored to decrease interdependencies. Technically this results in a huge list of breaking changes, but most of those should not affect any application, unless very low-level APIs are frequently used. For example, Z-Wave JS UI and Z-Wave JS Server had just two small breaks. In addition, Z-Wave JS is now released as hybrid ESM/CJS packages.

### Breaking changes · [Migration guide](https://zwave-js.github.io/zwave-js/#/getting-started/migrating/v14)
* `Driver.installConfigUpdates()` now requires the external config directory to be configured (#7365)
* Replace Node.js Buffer with `Uint8Array` portable replacement class `Bytes` (#7332)
* `zwave-js` no longer loops up the package version at runtime (#7344)
* Changed some paths to be relative to `process.cwd()` instead of source location (#7345)
* Decouple CCs and messages from host, split parsing and creation, split ZWaveNode class (#7305)

### Config file changes
* Add Aeotec TriSensor 8 (#7342)

### Changes under the hood
* Decorators have been migrated from the legacy specification to the accepted proposal (#7360)
* Transition modules to hybrid ESM/CJS, switch to vitest for testing (#7349)
* Removed dependency on `fs-extra` in favor of `node:fs/promises` (#7335)
* `@zwave-js/config` no longer loops up the package version at runtime (#7343)

## 13.10.3 (2024-10-29)
### Config file changes
* Disable Supervision for Everspring SE813 (#7333)

## 13.10.2 (2024-10-28)
### Bugfixes
* Bootloader mode is now detected in more difficult cases (#7327)

## 13.10.1 (2024-10-25)
### Bugfixes
* Correct unit of Meter CC values (#7322)
* Bootloader mode is now detected even when short chunks of data are received (#7318)
* Corrected the wording of idle/busy queue logging (#7309)

### Config file changes
* Add Heatit Z-TEMP3 (#7179)
* Add new parameters 17 and 18 for HeatIt TF016_TF021 FW 1.92 (#7287)
* Disable Supervision for Heatit TF021 (#7321)
* Add ZVIDAR WB04V Smartwings Day Night Shades (#7319)
* Add ZVIDAR WM25L Smartwings Smart Motor (#7312)
* Add ZVIDAR ZW881 Multi-Protocol Gateway (#7311)
* Add include, exclude, and wakeup instructions for VCZ1 (#7307)
* Add new Product ID to Namron 16A Switch (#7301)
* Add Minoston MP24Z 800LR Outdoor Smart Plug - 2 Outlet (#7302)

## 13.10.0 (2024-10-24)
### Features
* `mock-server` now supports putting the simulated controller into add and remove mode (#7314)

## 13.9.1 (2024-10-17)
### Bugfixes
* Fixed an issue where preferred scales were not being found when set as a string (#7286)

## 13.9.0 (2024-10-14)
### Features
* Zniffer: allow filtering frames when saving the capture (#7279)

### Bugfixes
* Fixed an issue where the `StartLevelChange` command for `Window Covering CC` was sent with an inverted direction flag (#7278)

### Config file changes
* Add manual and reset metadata for Danfoss LC-13 (#7274)

## 13.8.0 (2024-10-11)
### Features
* Support playing tones on mocked sirens, improve support for node dumps of switches/dimmers (#7272)

## 13.7.0 (2024-10-10)
### Features
* Thermostat Setback CC: Fix encoding of the setback state, add mocks, remove non-functional CC values (#7271)

## 13.6.0 (2024-10-10)
### Features
* Skip rebuilding routes for nodes with priority return routes (#7252)
* Add `node info received` event (#7253)
* OTA firmware updates now use the task scheduler. This allows running multiple OTA updates at once. (#7256)
* Implement Multilevel Switch mocks, add default state for Binary Switch mocks (#7270)

### Bugfixes
* Use configured network keys on secondary controller if learned keys are absent (#7226)
* Pending tasks are removed when hard-resetting or entering bootloader (#7255)

### Config file changes
* Add incompatibility warning to UZB1 (#7225)
* Override Central Scene CC version for Springs Window Fashions VCZ1 (#7263)

### Changes under the hood
* Dependency updates
* Fix bootstrap command in devcontainer (#7254)

## 13.5.0 (2024-10-07)
This release adds an internal task scheduler that will allow more control over longer running tasks like device interviews, route rebuilding, firmware updates, etc. These improvements include pausing/resuming tasks, better prioritization for user-initiated actions, queueing tasks without interrupting ongoing ones, and more. Migration of existing features to the new scheduler will be done incrementally, starting with route rebuilding.

### Features
* Reworked route rebuilding to use the task scheduler. This enables rebuilding routes for multiple individual nodes at once. (#7196, #7203)

### Bugfixes
* Fixed a regression from `13.4.0` that prevented restoring NVM backups on 700/800 series controllers (#7220)

### Config file changes
* Add fingerprint to Aeotec ZWA024 (#7191)
* Correct max. value of SKU parameters for Kwikset locks (#7178)
* Add fingerprint to Remotec ZXT-800 (#7195)

### Changes under the hood
* Implement task scheduler (#7193)
* Upgrade to ESLint v9, typescript-eslint v8 (#6987)
* Update FAQ on secondary controllers (#7190)

## 13.4.0 (2024-09-24)
### Features
* Added `Controller.nvm` property to enable incremental modification of NVM contents on the fly (#7153)
* When the `NODE_ENV` env variable is set to `development`, debugging information for S0 encryption is included in logs (#7181)
* Add driver preset `NO_WATCHDOG` to disable watchdog (#7188)

### Config file changes
* Update Z-Wave SDK warnings to mention recommended versions (#7187)
* Update Zooz devices (#7186)

## 13.3.1 (2024-09-17)
### Bugfixes
* Fixed the identification of the primary controller role on some older controllers (#7174)
* Fixed an issue where passing a custom log transport to `updateOptions` would cause a call stack overflow (#7173)
* Implement deserialization for more `WindowCoveringCC` commands to be used in mocks (#7159)

### Config file changes
* Add Philio Technology Smart Keypad (#7168, #7175)
* Add LED indication parameter for Inovelli NZW31 dimmer (#7172)

### Changes under the hood
* Fixed a build issue on Windows systems
* Make `mock-server.js` executable (#7160, #7161)

## 13.3.0 (2024-09-12)
### Features
* Add support for EU Long Range (#6751)
* Support learn mode to become a secondary controller (#7135)
* Add method to query supported RF regions and their info (#7118)
* Support `Firmware Update Meta Data CC` v8 (#7079)
* Implement 32-bit addressed NVM operations (#7114)
* Add methods to reset SPAN of one or all nodes (#7105)

### Bugfixes
* Fix missing values in endpoint dump (#7101)

### Config file changes
* Add new fingerprint for TZ45 thermostat (#7127)
* Add alarm mapping for Schlage lock CKPD FE599 (#7122)
* Add fingerprint for Climax Technology SDCO-1 (#7102)
* Add Shelly Wave Pro 3 and Wave Pro Shutter (#7103)
* Remove endpoint workaround for Zooz ZEN30, FW 3.20+ (#7115)

### Changes under the hood
* Document soft-reset issue in VMs (#7119)
* Update documentation for troubleshooting and Zniffer, clean up migration guides (#7107)
* Update `FunctionType` definitions (#7106)
* CI now checks that all device config files have a `.json` extension (#7099)

## 13.2.0 (2024-08-12)
### Features
* Add method to enumerate all device classes (#7094)

### Config file changes
* Add ZVIDAR ZW872 800 series Pi Module (#7026)
* Add ZVIDAR ZW871 800 series USB Controller (#7025)
* Rename Zvidar config file name Z-PI to Z-PI.json (#7024)

### Changes under the hood
* The VSCode extension for editing config files is now incuded locally in the workspace as a git submodule. Running `yarn bootstrap` automatically downloads and builds it. To use, install the recommended workspace extension (#6989)

## 13.1.0 (2024-08-02)
### Features
* Update list of manufacturers and existing CCs (#7060)
* Add `inclusion state changed` event (#7059)
* Add support for new notifications (#7072)
* Bump version of `Association CC` and `Multi Channel Association CC` (#7078)

### Bugfixes
* Preserve granted security classes of provisioning entries when switching protocols (#7058)
* Version of Humidity Control Mode CC is 1, not 2 (#7062)
* Abort S2 bootstrapping when `KEXSetEcho` has reserved bits set (#7070)
* Fixed an issue causing non-implemented CCs to be dropped before applications could handle them (#7080)

### Changes under the hood
* Include default value in `Color Switch CC` mocks (#7071)

## 13.0.3 (2024-07-30)
### Bugfixes
* Fixed an issue causing all ZWLR multicast groups to be considered identical (#7042)
* Fixed a startup crash on Zniffers older than FW 2.55 (#7051)

### Changes under the hood
* Fixed the devcontainer setup (#7041)
* Look at all test files to resolve dirty tests (#7045)
* Introduce `yarn bootstrap` command to set up environment (#7046)
* Add mocks for Binary and Color Switch CC (#7056)

## 13.0.2 (2024-07-22)
### Bugfixes
* Fixed latency calculation in link reliability check, distinguish between latency and RTT (#7038)

## 13.0.1 (2024-07-19)
### Bugfixes
* Fixed a regression that could cause incorrect units and missing sensor readings (#7031)
* Don't verify delivery of S2 frames in link reliability check (#7030)

## 13.0.0 (2024-07-17)
### Application compatibility
Home Assistant users who manage `zwave-js-server` themselves, **must** install the following upgrades before upgrading to this driver version:
* Home Assistant **TBD** or higher
* `zwave-js-server` **1.37.0**

### Breaking changes · [Migration guide](https://zwave-js.github.io/zwave-js/#/getting-started/migrating/v13)
* Align Meter CC Reset v6 with specifications, add mocks, add API for report commands (#6921)
* Convert all Z-Wave specific configs except devices and manufacturers into code, move from ConfigManager methods to utility functions (#6925, #6929, #7023)
* Remove `ZWaveApplicationHost` dependency from `CommandClass.toLogEntry()` (#6927)
* Removed some deprecated things (#6928)
* Replace `Controller.isAssociationAllowed` with `Controller.checkAssociation` (#6935)
* Fixed health checks for ZWLR nodes, throw when requesting neighbors (#6939)
* The repo now uses Yarn 4 and Corepack to manage its dependencies (#6949)
* "Master Code" was renamed to "Admin Code" (#6995)

### Features
* `mock-server` now supports communication with endpoints (#7005)

### Bugfixes
* Reset aborted flags when starting link reliability or route health check (#7022)

### Config file changes
* Update Zooz ZEN30 to latest revisions (#6630)
* Support MCO Home MH-S412 parameters properly (#6623)
* Add Ring Flood Freeze Sensor (#6970)
* Override user code count for Yale ZW2 locks to expose admin code (#6528)
* Add GDZW7-ECO Ecolink 700 Series Garage Door Controller (#6572)
* Correct label for Remote 3-Way Switch parameter on Zooz ZEN32 (#6871)
* Add UltraPro 700 Series Z-Wave In-Wall Smart Dimmer (#6904)
* Add Yale Assure 2 Biometric Deadbolt locks (#6972)
* Add iDevices In-Wall Smart Dimmer (#5521)
* Support Comet parameters properly (#6583)
* Update label of Nortek GD00Z-6, -7, -8 (#6991)
* Disable Supervision for Zooz ZSE11 (#6990)
* Clarify parameters and units for Everspring AN158 (#6364)
* Force-add support for Multilevel Switch CC to FGRM-222, remove Binary Switch CC (#6986)
* Add ZVIDAR Z-PI 800 Series PI Module (#7018)

### Changes under the hood
* Upgrade to TypeScript 5.5 (#6919)
* The root `tsconfig.json` is now set up in "solution-style", which should improve the goto references functionality. In addition, linting, testing and running locally no longer requires all modules to be compiled first. (#6748)
* Fixed some minor issues found by code scanning (#6992)
* Fixed an issue where `yarn codefind` was loading no source files (#6993)
* Fixed an issue where `import(...)` types with absolute paths could appear in in CC docs (#6996)
