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
- 截至 2026-09-17，发布版 RPK 已重新生成，SHA-256 为 `DB5E3665DE346D6BE54EF0CF5CB8164F284BC0EC53143A0B14E8339EDC012082`；包含录音兼容性和 HTTP 状态诊断的最新包已通过 ADB 安装并运行在 `emulator-5554`。
- WSL Ubuntu 22.04 已安装。
- 串口能识别 CH340，开发板通信基础具备。
- 已有 SF32LB52-DevKit-LCD 与 1.85 英寸 AMOLED 屏幕硬件。

## 当前阶段

- 官方参赛仓库已解压到本目录，快应用已迁移到 `quickapp/hello_quickapp/`。
- 已初始化本地 Git，当前工作分支为 `voiceplan-work`；PR #1 为 Open、可合并状态，目标分支为 `dev-ai-contest-2026`，CLA 检查已通过，仍等待官方维护者审核合入。
- `logs/Yjwqj/` 已包含 Claude Code 环境检查会话和本项目完整 Codex 开发会话；Codex 日志通过脱敏导出，组委会 `validate-log.py` 校验为 `ALL OK`。

## 还缺

- 官方分支 PR 合入；CLA 已通过，不再需要处理邮箱匹配。
- 已完成项目 Skills 沉淀：`docs/skills/health-aware-watch-planning/SKILL.md`，使用情况已写入作品材料。
- MiMo HTTPS 音频转写代码、错误处理和自动测试已补齐；录音限制为 5 秒、256000 bps、最大 1 MiB。2026-09-18 使用有效新密钥完成真实录音验收，目标框得到“明天下午三点开会，晚上需要跑步锻炼三十分钟”，页面显示“转写完成，检查目标后生成计划”。
- 最终仍需用户录制不超过 5 分钟的 Demo 视频；视频之外的 RPK、源码、作品文档和 AI Coding 日志由本目录统一生成。

## 不建议补齐的重型环境

暂时不优先安装完整固件编译链、`repo`、`arm-none-eabi-gcc`、`ninja` 等。你们主线是快应用，不是底层移植，先把模拟器 Demo 做完整更划算。

## 下一步验收

`npm test` 的 6 组 JavaScript 测试与日志导出器的 3 个 Python 回归测试均通过；`npm run release` 已成功生成生产 RPK。最新 RPK 已安装并重新打开。下一次录屏应保持当前 `VelaPlan_390x450` 模拟器，不需要重启。构建工具仍提示 `system.velaclaw` 为未知功能，应用保留本地规则兜底，演示时不能把兜底结果说成 AI 生成。

## 官方要求风险

当前项目仓库位于已初始化的 openvela `.repo` 工作区内；快应用主线可直接在 AIoT-IDE 中调试，无需为初赛额外完成整套固件编译。
