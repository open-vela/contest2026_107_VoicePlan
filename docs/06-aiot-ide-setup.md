# AIoT-IDE 准备步骤

## 目标

先跑通手表模拟器版本，不先做重型固件编译。

## 操作

1. 下载并安装 AIoT-IDE。已完成。
   - 官方入口：https://iot.mi.com/vela/quickapp/zh/guide/start/use-ide.html
2. 打开 AIoT-IDE 的扩展面板。
3. 搜索并更新两个插件：
   - `aiot-core`：1.7.22 或以上
   - `aiot-emulator`：1.7.22 或以上
   - 当前电脑已安装 `aiot-core` 1.7.22 与 `aiot-emulator` 1.7.22。
4. 打开模拟器管理。
5. 新建模拟器，镜像选择：
   - `vela-miwear-watch-5.0(开发者大赛)`
   - 当前电脑已手动创建模拟器实例：`VelaPlan_390x450`。
6. 打开项目目录：
   - `C:\Users\LEGION\Documents\XiaoMi\contest2026_107_VoicePlan\quickapp\hello_quickapp`
7. 点击调试，确认首页能显示。

## 如果依赖安装失败

在 `app/` 目录新建或修改 `.npmrc`：

```text
registry="https://registry.npmmirror.com/"
```

然后重新执行依赖安装。

## 发布打包注意

参赛提交需要生产模式包，也就是 `dist/*.release.rpk`。AIoT-IDE 里点击“发布”时会生成签名文件：

```text
sign/private.pem
sign/certificate.pem
```

如果 Windows 提示缺少 OpenSSL，需要先安装 OpenSSL 并加入系统环境变量，再重启 AIoT-IDE。

## 常见问题

- 如果 `service.health` 没数据：检查插件版本和模拟器镜像是否正确。
- 如果中文乱码：需要按官方指南给模拟器安装中文字体。
- 如果只能在浏览器预览，说明 AIoT 环境还没完全装好，但项目逻辑可以先继续写。

## 当前电脑缺口

当前已有 AIoT-IDE 内置 ADB：

```text
C:\Users\LEGION\.vela\sdk\tools\adb\win\adb.exe
```

只用 AIoT-IDE 内置调试时不需要额外安装 Android platform-tools。

AIoT-IDE 已在官方快应用目录生成调试版 RPK。若终端提示找不到 `aiot`，请直接使用 IDE 的打包/调试入口，不要在项目中提交编译缓存。

如果 AIoT Core 输出曾出现 `quickapp\\.temp_hello_quickapp\\src\\manifest.json` 不存在，先重新点击一次 Debug，让 IDE 重建临时工程，再查看输出中的 `Install ... successfully` 和 `Debug session started successfully`。
