# Fastlane runs the iOS release pipeline (see fastlane/Fastfile).
#
# The `~>` constraint allows patch/minor updates; the EXACT versions come from
# Gemfile.lock, which is committed. CI runs `bundle install --deployment`, so it
# installs precisely what the lockfile records — this is what keeps CI and local
# runs identical. Update deliberately with `bundle update fastlane`.
#
# Always invoke through `bundle exec fastlane`, never bare `fastlane`.
source 'https://rubygems.org'

gem 'fastlane', '~> 2.230'

# Required by the `cocoapods` action in the prebuild lane. Expo prebuild
# generates the Podfile; this installs the pods against it. Must be a gem
# (not a system `pod`) so CI resolves the same version as local runs.
gem 'cocoapods', '~> 1.16'
