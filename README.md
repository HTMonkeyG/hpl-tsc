# hpl-tsc

**本项目的提交记录若无特别标注，均使用AI进行，在部分提交记录中会标注AI模型。**

`hpl-tsc` 将以 HPL 能力为中心的 TypeScript 子集转译为 HPL。TypeScript 提供语法、模块与静态类型前端；编译器负责类型驱动的 HPL ABI 选择、函数/事件注册、优化、命名和文本生成。它不提供 JavaScript 运行时。

## 语言模型

- 基础类型：`hpl.int`、`hpl.float`、`boolean`、`string`。
- `Array<T>` 映射为 HPL slice，`length` 映射为 `slices.length` 且不可写。
- interface/结构对象映射为 HPL map；`Map`、`Set` 和嵌套容器使用静态类型选择 raw 或 ptr API。
- 用户代码不接触数字指针；引用通过 `hpl.slice`、`hpl.map`、`hpl.tuple`、`hpl.set` 和 `hpl.HplObject` 表达。
- 仅支持明确映射到 HPL 的 API。`any`、不安全联合类型或运行时不支持的 raw/ptr 组合会产生编译错误。

## 函数与事件

普通函数和普通 class 不受支持。函数必须是 `hpl.HplFunc` 子类中的 decorated static method：

```ts
class Functions extends hpl.HplFunc {
  @hpl.hplFunc("hello")
  static hello(value: hpl.int): hpl.int {
    hpl.command("say hello");
    return value + 1;
  }

  @hpl.hplEvent("ServerChatEvent", "chat_listener")
  static onChat(event: ServerChatEventArgs): void {
    if (!event.cancel) hpl.command("say chat received");
  }
}

const next = Functions.hello(1);
```

`@hplFunc` 编译为 `customfunction` 注册，并可通过 `类名.方法名(...)` 调用。`@hplEvent` 编译为 `systemevent` 监听器，只允许一个事件参数且不能由用户代码调用。void 方法在可落到末尾时自动补 HPL 所需的返回值。

除 import、type/interface 和函数容器外，入口文件仍可包含受支持的顶层过程语句。

## 优化与符号

- `O0`：无语义优化，格式化输出。
- `O1`：无语义优化，以 `|` 压缩输出。
- `O2`：进行保守的纯表达式常量折叠，再压缩输出。
- `-s` / `--strip`：将非公开符号稳定重命名为短名称；显式函数名、事件名与监听器名保持不变。

## CLI

需要 Node.js 20 或更高版本：

```text
hpl-tsc [选项] <input.ts>

-p, --project <文件>   使用指定 tsconfig.json
-o, --outFile <文件>   指定输出文件
-O, --optimize <级别>  0、1 或 2（默认 0）
-s, --strip            去除非公开符号名称
    --noEmit           只检查，不写文件
    --pretty           输出带代码帧的诊断
    --help             显示帮助
    --version          显示版本
```

示例：

```sh
hpl-tsc src/main.ts
hpl-tsc src/main.ts -p tsconfig.json -o build/main.hpl -O 2 --strip
hpl-tsc src/main.ts --noEmit --pretty
```

退出码：成功为 0，编译/运行错误为 1，命令行参数错误为 2。任何错误诊断都会阻止 HPL 输出。

## Library API

```ts
import { compile, transpileSource } from "hpl-tsc";

const result = compile({
  entryFile: "src/main.ts",
  optimizationLevel: 2,
  strip: true,
});
```

`compile` 与 `transpileSource` 返回 `success`、`diagnostics`、`sourceFiles` 和可选的 `outputText`。默认同时加载 `libhpl.d.ts` 与仅服务端的 `libminecraftne.d.ts`。

## 模块与限制

- 支持静态相对 import，type-only import 不产生运行时代码；包 import、动态 import、require 和运行时循环会被拒绝。
- 支持基础表达式、变量、`if`、规范计数 `for (let i = 0; i < count; i++)`、break/continue、受支持的容器与 API 调用。
- 不支持闭包、async/generator、异常、任意 class、任意 `new`、解构、稀疏数组或无法静态确定 HPL 表示的语法。
- TypeScript 与 HPL 语义不一致时以 HPL 为准；映射表中未明确支持的形式不会被猜测性转译。

## 声明与运行时一致性

`scripts/generate-catalog.mjs` 从项目内 `nemc-form-script` 动态 API 注册表生成 catalog：

```sh
npm run catalog
npm run catalog:check
```

自动测试可验证生成 HPL 的语法和离线声明一致性；实际 Minecraft 动态 API 仍应在目标服务器版本中进行发布烟测。
