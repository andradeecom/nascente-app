fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios prebuild

```sh
[bundle exec] fastlane ios prebuild
```

Regenerate the native iOS project from app.json (CNG)

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Build a signed release IPA and upload it to TestFlight

### ios release

```sh
[bundle exec] fastlane ios release
```

Upload the latest TestFlight build to App Store review

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
