## Changelog

<!--
	PLACEHOLDER for next version:
	## __WORK IN PROGRESS__
-->
## 2.5.3 (2022-01-29)
* Fix: Ensure the tests use the `file` DB type

## 2.5.2 (2021-09-18)
* Fix: `adminUI.config` is now respected for the config UI check and JSON config is allowed too
* Updated dependencies
* Modernized build process

## 2.5.1 (2021-09-05)
* We now use the nightly js-controller dev builds instead of GitHub installation

## 2.4.4 (2021-03-14)
* Fix error: `iopackContent.common.titleLang` is not iterable

## 2.4.3 (2021-03-12)
* Fix: The adapter main file now correctly gets located when it is only defined in `package.json`, not `io-package.json`

## 2.4.2 (2021-01-06)
* Fixed compatibility with the reworked database classes
* Improved shutdown behavior of the adapter

## 2.4.1 (2021-01-01)
* Fixed a bug where the wrong `js-controller` dependency would be installed

## 2.4.0 (2020-12-07)
* Unit tests for adapter startup were removed and only log a warning that you can remove them
* Upgrade many packages

## 2.3.0 (2020-08-20)
* Added missing async functions to adapter mock
* Fixed: `TypeError "Cannot redefine property readyHandler"` when using `createMocks` more than once
* Upgrade to `@types/iobroker` v3.0.12

## 2.2.0 (2020-04-15)
* Upgrade to `@types/iobroker` v3.0.2
* Added mocks for `supportsFeature`, `getPluginInstance`, `getPluginConfig`

## 2.1.0 (2020-03-01)
* **Integration tests:** For Node.js >= 10, the `engine-strict` flag is now set to `true` to be in line with newer ioBroker installations

## v2.0.2
* **Unit tests:** added mocks for `getAbsoluteDefaultDataDir` and `getAbsoluteInstanceDataDir`

Sorry, there isn't more yet.
