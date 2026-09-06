# VelaPlan 腕上 AI 多场景计划助手

本仓库基于 openvela 大赛分支 `dev-ai-contest-2026`，当前本地开发分支为 `voiceplan-work`。参赛仓库地址：<https://github.com/open-vela/contest2026_107_VoicePlan>。

## 一、作品简介

VelaPlan 是基于 openvela 快应用的手表端计划助手。用户输入一个统一目标，选择今日、本周、本月或本季度周期，并可标记重要事项和提醒；应用结合心率、血氧、压力与内置天气场景生成可执行计划，支持腕上打卡、延期和复盘。

核心差异是把计划从手机待办列表变成“当天状态感知”的腕上行动建议：压力偏高时加入呼吸和休息，心率偏高或血氧偏低时降低运动强度。

## 二、参赛方向

手表应用创新。作品使用 openvela 快应用框架和 `service.health`，目标设备为支持 Vela OS 的手表或手环。

## 三、目录结构

- `quickapp/hello_quickapp/`：正式快应用源码、manifest 和打包工程
- `quickapp/hello_quickapp/src/pages/index/index.ux`：首页交互、统一计划设置、录音入口、执行和复盘
- `quickapp/hello_quickapp/src/pages/index/planner.js`：本地规则计划生成、健康状态判断和 AI JSON 解析
- `quickapp/hello_quickapp/src/pages/index/health.js`：`service.health` 读取与订阅
- `quickapp/hello_quickapp/src/pages/index/voice.js`：录音、文件与网络的平台适配
- `quickapp/hello_quickapp/src/pages/index/transcription.js`：MiMo 音频转写、请求校验与超时清理
- `backend/`：本地预览服务、MiMo Chat Completions 客户端和测试
- `board/contest_board/`：开发板展示用骨架，不是当前主线
- `web-preview/`：浏览器端流程预演
- `docs/`：比赛要求解读、硬件说明、演示脚本和提交清单
- `docs/skills/health-aware-watch-planning/SKILL.md`：可复用的健康感知计划生成约束
- `prompts/`：AI 结构化计划输出约束
- `logs/`：提交前导出的 AI Coding 日志

## 四、运行与验证

### 1. 单元测试

在仓库根目录执行：

```bash
npm test
```

### 2. AIoT-IDE 调试

1. 用 AIoT-IDE 打开 `quickapp/hello_quickapp/`。
2. 选择 `vela-miwear-watch-5.0(开发者大赛)` 镜像创建或启动 `VelaPlan_390x450`。
3. 选择设备并点击调试，安装调试版 RPK。
4. 按“示例 → 重要事项/提醒 → 下雨 → 生成计划 → 完成一项”的顺序演示。

应用优先生成本地可解释计划，然后尝试通过 `@system.velaclaw` 调用设备端 AI Agent。AI 不可用或返回格式不符合约束时自动保留本地计划，演示不会中断。健康数据来自 `service.health` Mock 回放；天气为内置场景，提醒为应用内提醒。

### 3. 打包

在 AIoT-IDE 中执行开发打包生成 debug RPK；提交前使用 IDE 的“发布”流程生成签名和 `release.rpk`。生产包、作品介绍文档、演示视频和 AI Coding 日志需要与同一版本源码对应。

命令行生产打包命令：

```bash
cd quickapp/hello_quickapp
npm run release
```

生成文件位于 `quickapp/hello_quickapp/dist/`；当前已复制一份到 `submission/VelaPlan.release.rpk` 供最终压缩包使用。`dist/`、`build/`、`sign/` 和 RPK 均被 `.gitignore` 忽略，私钥不会进入仓库。

## 五、输入说明

应用使用官方 `system.record` 录制最多 8 秒的 WAV，经 `system.file` 读取后，由手表 `system.fetch` 通过 HTTPS 调用 MiMo 多模态转写。返回文字先进入输入框，用户确认或编辑后再生成计划。未配置、断网、超时或无清晰语音时保留原目标，不用示例冒充识别结果。

代码及自动测试已补齐，但真实云端转写必须使用参赛账号的可用密钥完成验收。配置步骤、接口依据和测试边界见 [语音接入说明](docs/10-mimo-voice.md)。

## 六、MiMo 配置

`@system.velaclaw` 使用设备端 `ai_agent` 的 MiMo 配置；本地后端预览则使用环境变量：

```text
MIMO_API_KEY=<本机配置，不要提交>
MIMO_API_URL=<MiMo Chat Completions 地址>
MIMO_MODEL=<账号支持的模型>
```

密钥不得写入源码、README、日志或聊天记录。未配置或请求失败时，后端使用本地规则兜底。

手表语音转写使用独立的设备私有配置。启动模拟器并打开应用后，双击 `tools/configure-watch-voice.cmd` 在电脑的隐藏提示中输入密钥。当前文档推荐的多模态模型为 `mimo-v2.5`。配置工具不会把密钥打进 RPK，也不会替代 `ai_agent` 的计划生成配置。

## 七、计划规则

- 周期：今日展示详细任务，本周展示七天安排，本月/本季度展示阶段节点。
- 健康：最大心率估计为 `208 - 0.7 × 年龄`，心率警戒演示阈值为 `max(100, 静息心率 + 20)`，多次样本取平均；这些是非医疗启发式规则。
- 调整：压力偏高加入呼吸放松，心率高于个人基线改为低强度活动，血氧偏低改为恢复安排；下雨/大风改室内，高温缩短户外活动并提示补水。
- 重要事项和完成状态通过 `@system.storage` 保存在应用本地，延期只移动任务日期，不删除重要事项。

## 八、演示闭环

展示首页健康数据 → 输入统一目标 → 选择周期、重要提醒和天气 → 生成 AI/本地计划 → 查看健康/天气调整原因 → 完成或延期任务 → 查看复盘。

## 八、官方要求对照

- 图形能力：openvela 快应用页面、滚动布局、周期/提醒/天气设置、任务执行和复盘。
- AI 能力：`@system.velaclaw` 调用设备端 `ai_agent`，失败时使用可解释的本地规则计划。
- 多媒体能力：`@system.record` 录制 WAV，`@system.file` 读取，`@system.fetch` 调用 MiMo 转写，用户确认后交给计划引擎。
- 健康能力：`@service.health` 读取并订阅心率、血氧、压力 Mock 数据。
- 已保留项目 Skills 沉淀；提交前仍需按官方格式导出真实 AI Coding 日志、完成带密钥的语音和 AI 实测、录制不超过 5 分钟的视频，并把最终源码提交到官方 `dev-ai-contest-2026` 分支。

更多实施依据见 `docs/09-official-requirements-execution.md` 和 `docs/04-submission-checklist.md`。
