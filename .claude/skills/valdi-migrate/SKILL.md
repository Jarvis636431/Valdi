---
name: valdi-migrate
description: Use when migrating Flutter, React, or Jetpack Compose code to Valdi,
  converting Flutter widgets, React components, or Compose @Composable functions to
  Valdi components, or when a developer asks how to translate Flutter/React/Compose
  patterns (hooks, widgets, Navigator, setState, remember, LaunchedEffect, Modifier,
  Provider, styled-components, FlatList, LazyColumn, etc.) to Valdi equivalents.
version: 1.1.0
---

# Valdi Migration Assistant

You are helping a developer migrate code to Valdi. Valdi is a cross-platform UI framework that compiles TypeScript to native iOS/Android/macOS views. It uses TSX/JSX syntax but **is not React**.

## Critical Rules — NEVER Suggest These

```typescript
// ❌ React hooks — DO NOT EXIST in Valdi
useState / useEffect / useContext / useMemo / useCallback / useRef

// ❌ Compose APIs — DO NOT EXIST in Valdi
@Composable annotation
remember { mutableStateOf() } / remember { }
derivedStateOf / collectAsState / LaunchedEffect / DisposableEffect
Modifier chain (Modifier.padding().background().clickable())
CompositionLocalProvider / LocalXxx.current

// ❌ Functional components — DO NOT EXIST
const MyComp = () => <view />;
function MyComp(props) { return <view />; }

// ❌ Wrong naming
this.props          // → this.viewModel
onMount/onUnmount   // → onCreate/onDestroy
markNeedsRender()   // → this.setState({})
scheduleRender()    // → deprecated, use setState

// ❌ Returning JSX — onRender() returns void
onRender() { return <view />; }   // WRONG — no return statement

// ❌ Inline lambdas in JSX props — causes re-renders
<view onTap={() => this.doThing()} />   // WRONG — use class arrow fn

// ❌ map() in render — does not work (JSX is side-effect, not return value)
{items.map(i => <Item key={i.id} />)}   // WRONG — use forEach

// ❌ JSX as a prop value
<MyComp label={<label value="hi" />} />  // WRONG — use render prop () => void

// ❌ new Style() inside onRender() — style interning requires module-level init
onRender() { const s = new Style<View>({...}); ... }  // WRONG
```

## Correct Valdi Patterns

```typescript
import { Component, StatefulComponent } from 'valdi_core/src/Component';

// Stateless component
class MyComp extends Component<MyViewModel> {
  onRender() {
    <view>
      <label value={this.viewModel.title} />;
    </view>;
  }
}

// Stateful component
class Counter extends StatefulComponent<MyViewModel, { count: number }> {
  state = { count: 0 };

  // Class arrow function — never inline lambda in JSX
  private handleTap = () => {
    this.setState({ count: this.state.count + 1 });
  };

  onRender() {
    <view onTap={this.handleTap}>
      <label value={`Count: ${this.state.count}`} />;
    </view>;
  }
}

// Lists — forEach, not map()
onRender() {
  <scroll>
    {this.viewModel.items.forEach(item => {
      <Row key={item.id} data={item} />;
    })}
  </scroll>;
}

// Style — created at module level, not inside onRender()
const cardStyle = new Style<View>({ backgroundColor: '#fff', borderRadius: 8 });
```

## Lifecycle Mapping

| Flutter | Jetpack Compose | React | Valdi |
|---------|-----------------|-------|-------|
| `initState()` | `LaunchedEffect(Unit) { }` | `componentDidMount` / `useEffect(fn, [])` | `onCreate()` |
| `dispose()` | `DisposableEffect { onDispose { } }` | `componentWillUnmount` / `useEffect(() => fn, [])` | `onDestroy()` |
| `didUpdateWidget(old)` | `LaunchedEffect(key) { }` | `componentDidUpdate(prev)` / `useEffect(fn, [dep])` | `onViewModelUpdate(previous?)` |
| `build(context)` | `@Composable fun` recomposition | `render(): JSX.Element` | `onRender(): void` |
| `setState(() {...})` | `mutableStateOf` + state write | `this.setState({...})` | `this.setState({...})` |

## Component & Element Mapping

| Flutter | Jetpack Compose | React | Valdi |
|---------|-----------------|-------|-------|
| `StatelessWidget` | `@Composable fun` (stateless) | Function component | `class X extends Component<VM>` |
| `StatefulWidget` + `State` | `@Composable fun` + `remember { mutableStateOf() }` | Class component + state | `class X extends StatefulComponent<VM, State>` |
| `Container` / `SizedBox` (visual) | `Box` / `Surface` | `<div>` with styles | `<view>` |
| `SizedBox` / invisible box | `Spacer` | Layout-only `<div>` | `<layout>` (no native view, faster) |
| `Text` | `Text(text)` | `<span>` / `<p>` | `<label value="...">` |
| `TextField` | `TextField` / `OutlinedTextField` | `<input>` | `<textfield>` (single-line) |
| `TextFormField` | `BasicTextField` (multi) | `<textarea>` | `<textview>` (multi-line) |
| `Image.network` | `AsyncImage` (Coil) | `<img>` | `<image src={url}>` |
| `ListView` / `FlatList` | `LazyColumn` / `LazyRow` | `<FlatList>` | `<scroll>` + `forEach` |
| `SingleChildScrollView` | `Column` inside `verticalScroll` | `<ScrollView>` | `<scroll>` |
| `PageView` | `HorizontalPager` | `<ViewPager>` | `<scroll pagingEnabled={true}>` |
| `CircularProgressIndicator` | `CircularProgressIndicator` | `<ActivityIndicator>` | `<spinner>` |
| `GestureDetector` | `Modifier.clickable { }` | `onClick` / `onPress` | `onTap` on `<view>` |
| `Column` | `Column` | `<div style={{flexDirection:'column'}}>` | `<view flexDirection="column">` (default) |
| `Row` | `Row` | `<div style={{flexDirection:'row'}}>` | `<view flexDirection="row">` |
| `Stack` | `Box` with `align` | CSS `position:absolute` | `<view>` + children with `position="absolute"` |
| `Modifier.padding(16.dp)` | `Modifier.padding(16.dp)` | `style={{padding:16}}` | `padding={16}` on any element |
| `Navigator.push` | `navController.navigate("route")` | `navigate()` / `router.push` | `navigationController.push(Page, vm, ctx)` |
| `Navigator.pop` | `navController.popBackStack()` | `goBack()` / `router.back` | `navigationController.pop()` |
| `showModalBottomSheet` | `ModalBottomSheet` / `Dialog` | `<Modal>` | `navigationController.present(Page, vm, ctx)` |
| `InheritedWidget` / `Provider` | `CompositionLocalProvider` | `React.Context` + `useContext` | `createProviderComponentWithKeyName<T>()` + `withProviders()` |
| `SharedPreferences` | `SharedPreferences` / `DataStore` | `AsyncStorage` / `localStorage` | `PersistentStore` (valdi persistence) |
| `http.get()` / `dio` | `viewModelScope.launch { api.get() }` | `fetch()` / `axios` | `HTTPClient.get()` (valdi_http) |
| `Lottie` | `LottieAnimation` | `<Lottie>` | `<animatedimage>` |
| `BackdropFilter` | `BlurMaskFilter` | CSS `backdrop-filter` | `<blur>` (iOS only) |

## Key Import Paths

```typescript
import { Component, StatefulComponent } from 'valdi_core/src/Component';
import { Style } from 'valdi_core/src/Style';
import { createProviderComponentWithKeyName } from 'valdi_core/src/provider/createProvider';
import { withProviders } from 'valdi_core/src/provider/withProviders';
import { $slot } from 'valdi_core/src/CompilerIntrinsics';
import { createReusableCallback } from 'valdi_core/src/utils/Callback';
import { HTTPClient } from 'valdi_http/src/HTTPClient';
import { PersistentStore } from 'persistence/src/PersistentStore';
import { Layout, View } from 'valdi_tsx/src/NativeTemplateElements';
```

## Provider Pattern (replaces React Context / Flutter InheritedWidget)

```typescript
import { createProviderComponentWithKeyName } from 'valdi_core/src/provider/createProvider';
import { ProvidersValuesViewModel, withProviders } from 'valdi_core/src/provider/withProviders';

const ThemeProvider = createProviderComponentWithKeyName<ThemeService>('ThemeProvider');

// Root provides value
class AppRoot extends Component {
  private theme = new ThemeService();
  onRender() {
    <ThemeProvider value={this.theme}><App /></ThemeProvider>;
  }
}

// Consumer wraps with HOC
interface MyViewModel extends ProvidersValuesViewModel<[ThemeService]> {}
class MyComp extends Component<MyViewModel> {
  onRender() {
    const [theme] = this.viewModel.providersValues;
    <view backgroundColor={theme.primary} />;
  }
}
const MyCompWithProvider = withProviders(ThemeProvider)(MyComp);
```

## Full Guides

- **Migrating from React:** [docs/docs/start-from-react.md](../../docs/docs/start-from-react.md)
- **Migrating from Flutter:** [docs/docs/migrate-from-flutter.md](../../docs/docs/migrate-from-flutter.md)
- **Migrating from Jetpack Compose:** [docs/docs/migrate-from-compose.md](../../docs/docs/migrate-from-compose.md)
- **AI tooling tips:** [docs/docs/ai-tooling.md](../../docs/docs/ai-tooling.md)
