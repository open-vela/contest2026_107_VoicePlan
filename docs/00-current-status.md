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
- 截至 2026-09-17，发布版 RPK 已重新生成，SHA-256 为 `AA8AEBC436C45F8CB885DA8C48E3683DB40157FE751C9FF0C115B892454CA108`；最新包已通过 ADB 安装到 `emulator-5554`。
- WSL Ubuntu 22.04 已安装。
- 串口能识别 CH340，开发板通信基础具备。
- 已有 SF32LB52-DevKit-LCD 与 1.85 英寸 AMOLED 屏幕硬件。

## 当前阶段

- 官方参赛仓库已解压到本目录，快应用已迁移到 `quickapp/hello_quickapp/`。
- 已初始化本地 Git，当前工作分支为 `voiceplan-work`，最新提交 `500d033` 已推送到远程；PR #1 仍等待官方维护者合入。
- `logs/Yjwqj/` 有一份格式有效的采集日志，已打包为 `submission/AI-Coding-logs.zip`，但没有覆盖本次全部开发过程；提交前仍需按组委会要求重新导出完整日志。

## 还缺

- 官方分支 PR 合入；当前 GitHub 检查还提示提交使用 noreply 邮箱，CLA 需要用签署时的真实邮箱匹配。
- 已完成一个项目 Skills 沉淀：`docs/skills/health-aware-watch-planning/SKILL.md`；仍需按组委会格式把使用记录纳入日志或作品材料。
- MiMo HTTPS 音频转写代码、错误处理和自动测试已补齐，仍缺有效语音密钥的真实联调。配置入口为 `tools/configure-watch-voice.cmd`，技术依据与验收边界见 `docs/10-mimo-voice.md`。之前设备配置曾存在，但当前模拟器已关闭，重新测试前需先在 AIoT-IDE 启动它。
- 最终提交用 `release.rpk`、5 分钟内演示视频、作品介绍文档。

## 不建议补齐的重型环境

暂时不优先安装完整固件编译链、`repo`、`arm-none-eabi-gcc`、`ninja` 等。你们主线是快应用，不是底层移植，先把模拟器 Demo 做完整更划算。

## 下一步验收

`npm test` 的 planner、plan store、MiMo 客户端、页面布局、语音转写和语音页面生命周期 6 组测试均通过；`npm run release` 已成功生成生产 RPK。手动启动模拟器后，最新 RPK 已成功安装；下一次录屏应在 AIoT-IDE 中启动 `VelaPlan_390x450`，以便获得可见窗口和 IDE 调试通道。构建工具仍提示 `system.velaclaw` 为未知功能，应用保留本地规则兜底，演示时不能把兜底结果说成 AI 生成。

## 官方要求风险

当前目录是官方比赛仓库的本地 Git 工作区，但不是完整的 openvela `.repo` 工作区；快应用主线可直接在 AIoT-IDE 中调试。
