# 当前准备状态

## 已具备

- 电脑性能足够：i7-14650HX、16GB 内存。
- 磁盘空间够：C 盘约 113GB 可用，D 盘约 206GB 可用。
- 已安装 Git、Node.js/npm、Python、VS Code、Java、J-Link。
- 已安装 AIoT-IDE：`D:\AIoT IDE\AIoT IDE.exe`。
- 已安装 AIoT-IDE 插件：`aiot-core` 1.7.22、`aiot-emulator` 1.7.22、`aiot-project`、`aiot-ux`。
- 已安装 Vela SDK 模拟器环境：emulator、qa、skins、tools、modem_simulator。
- 已下载开发者大赛镜像：`vela-miwear-watch-5.0-beta`。
- 已创建模拟器实例：`VelaPlan_390x450`。
- 已安装项目依赖，`quickapp/hello_quickapp/` 已能命令行打包生成发布版 RPK。
- 发布版 RPK 已成功重新生成；旧版本曾通过 `adb` 安装到 `emulator-5554`，当前新版需在 AIoT-IDE 中重新点击调试安装。
- WSL Ubuntu 22.04 已安装。
- 串口能识别 CH340，开发板通信基础具备。
- 已有 SF32LB52-DevKit-LCD 与 1.85 英寸 AMOLED 屏幕硬件。

## 当前阶段

- 官方参赛仓库已解压到本目录，快应用已迁移到 `quickapp/hello_quickapp/`。
- 已初始化本地 Git，当前工作分支为 `voiceplan-work`，最新提交 `e65cd1e` 已推送到远程；PR #1 仍等待官方维护者合入。
- `logs/Yjwqj/` 已有一份格式有效的采集日志，但没有覆盖本次全部开发过程；提交前仍需按组委会要求确认是否需要重新导出完整日志。

## 还缺

- 官方分支 PR 合入；当前 GitHub 检查还提示提交使用 noreply 邮箱，CLA 需要用签署时的真实邮箱匹配。
- 已完成一个项目 Skills 沉淀：`docs/skills/health-aware-watch-planning/SKILL.md`；仍需按组委会格式把使用记录纳入日志或作品材料。
- MiMo HTTPS 音频转写代码、错误处理和自动测试已补齐，仍缺有效语音密钥的真实联调。配置入口为 `tools/configure-watch-voice.cmd`，技术依据与验收边界见 `docs/10-mimo-voice.md`。
- 最终提交用 `release.rpk`、5 分钟内演示视频、作品介绍文档。

## 不建议补齐的重型环境

暂时不优先安装完整固件编译链、`repo`、`arm-none-eabi-gcc`、`ninja` 等。你们主线是快应用，不是底层移植，先把模拟器 Demo 做完整更划算。

## 下一步验收

命令行已成功构建官方目录下的 `quickapp/hello_quickapp`，并把发布版 RPK 安装到模拟器。经 AIoT Core 输出日志确认，之前的 `build stopped` 是一次临时工程目录未生成完整导致的旧失败记录；重新点击 Debug 后已成功构建、安装并启动 `VelaPlan_390x450`。项目脚本已移除已弃用的 `--open-nuttx` 参数。

## 官方要求风险

当前目录是官方比赛仓库的本地 Git 工作区，但不是完整的 openvela `.repo` 工作区；快应用主线可直接在 AIoT-IDE 中调试。
