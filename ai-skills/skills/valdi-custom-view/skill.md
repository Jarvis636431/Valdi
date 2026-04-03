# Custom View Rules

**Applies to**: `**/*.tsx` files using `<custom-view>` elements.

## `<custom-view>` Element

`<custom-view>` renders a platform-native view inside a Valdi component. Each platform resolves the view by class name.

```typescript
<custom-view
  androidClass="com.snap.modules.my_module.MyNativeView"
  iosClass="SCMyNativeView"
  macosClass="SCMyNativeView"
  webClass="MyWebViewClassName"
  width="100%"
  height={120}
/>
```

## Class Attributes

| Attribute | Platform | Resolution |
|-----------|----------|------------|
| `androidClass` | Android | Reflection via `ReflectionViewFactory`; needs `@RegisterAttributesBinder` |
| `iosClass` | iOS | ObjC class name; must be linked via `ios_deps` |
| `macosClass` | macOS | `NSClassFromString()`; must be linked via `macos_deps` |
| `webClass` | Web | Looked up in `WebViewClassRegistry`; registered via `webPolyglotViews` export |

## Platform Resolution

- **Android**: The view class needs a single-arg `(Context)` constructor. An `@RegisterAttributesBinder`-annotated binder is discovered from assets at runtime.
- **iOS**: The ObjC class must be a `UIView` subclass linked into the binary via `ios_deps`.
- **macOS**: Falls through to `iosClass` when `macosClass` is not specified — both in TypeScript (`JSXBootstrap.ts`) and C++ (`ViewNode.cpp`). Only specify `macosClass` when the macOS view is different from iOS.
- **Web**: The `webClass` name is matched against the `WebViewClassRegistry`. Register by exporting `webPolyglotViews` from a typed TypeScript web polyglot entry file compiled via `ts_project` (see `valdi-polyglot-module` skill). Factories return an `AttributeHandler` with `changeAttribute(name, value)` to receive attribute updates.

## viewFactory Pattern

Instead of resolving by class name, you can pass a `ViewFactory` object directly. This is useful when the factory is provided by a parent component or constructed dynamically:

```typescript
import { ViewFactory } from 'valdi_tsx/src/ViewFactory';

interface MyViewModel {
  viewFactory?: ViewFactory;
}

class MyComponent extends Component<MyViewModel> {
  onRender(): void {
    if (this.viewModel.viewFactory) {
      <custom-view style={styles.container} viewFactory={this.viewModel.viewFactory} />;
    }
  }
}
```

`viewFactory` and `*Class` attributes are mutually exclusive — use one or the other. `viewFactory` takes precedence when both are provided.

## Common Mistakes

- Using `<custom-view>` without checking the platform — wrap in `Device.isAndroid()` / `Device.isIOS()` etc. if not all platforms are supported
- Forgetting to link native implementations — the class name string alone isn't enough; the native code must be compiled and linked via platform `_deps` in BUILD.bazel
- Wrong package name in `androidClass` — must match the Kotlin/Java package exactly
- Specifying `macosClass` when it's the same as `iosClass` — omit it and let the fallthrough handle it
- Using a `filegroup` for `web_deps` — always use `ts_project` with `transpiler = "tsc"`
