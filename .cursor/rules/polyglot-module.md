# Polyglot Module Rules

**Applies to**: `**/BUILD.bazel` and source files in modules with platform-specific implementations (`android/`, `ios/`, `macos/`, `web/` directories).

## Module Structure

A polyglot module contains platform-native implementations alongside Valdi TSX source:

```
my_module/
  src/           # Valdi TSX components (compiled by Valdi compiler)
  android/       # Kotlin/Java native implementation
  ios/           # Objective-C native implementation
  macos/         # Objective-C native implementation (macOS desktop)
  web/           # TypeScript web implementation (compiled by ts_project, NOT Valdi compiler)
  strings/       # Localization
  module.yaml
  tsconfig.json
  BUILD.bazel
```

## BUILD.bazel Pattern

```python
ts_project(
    name = "my_module_web",
    srcs = glob(["web/**/*.ts", "web/**/*.d.ts"]),
    tsconfig = "web/tsconfig.json",
    visibility = ["//visibility:public"],
)

valdi_module(
    name = "my_module",
    srcs = glob(["src/**/*.ts", "src/**/*.tsx"]) + ["tsconfig.json"],
    android_deps = [":android_impl"],
    ios_deps = [":ios_impl"],
    macos_deps = [":macos_impl"],
    web_deps = [":my_module_web"],
    deps = [...],
)
```

- `web_deps`: makes `web/` outputs available to the web bundle. Any file in `web_deps` that exports `webPolyglotViews` is automatically registered with the `WebViewClassRegistry` at bundle time — no extra configuration needed.
- After changing `module.yaml` deps, run: `./scripts/regenerate_valdi_modules_build_bazel_files.sh`

## Canonical Example

See `valdi_polyglot` module for a complete working example with all four platforms:
- `src/composer_modules/src/composer/valdi_polyglot/` (in the Snap monorepo)
- Or the equivalent path in your project

## Common Mistakes

- Putting `web/` files in `srcs` — they must go through `ts_project` + `web_deps`, not the Valdi compiler
- Missing platform `_deps` — each platform impl must be wired via `android_deps`, `ios_deps`, `macos_deps`
