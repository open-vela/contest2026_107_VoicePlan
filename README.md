# VelaPlan 腕上 AI 多场景计划助手

本仓库基于 openvela 大赛分支 `dev-ai-contest-2026`，当前本地开发分支为 `voiceplan-work`。参赛仓库地址：<https://github.com/open-vela/contest2026_107_VoicePlan>。

## 一、作品简介

VelaPlan 是基于 openvela 快应用的手表端计划助手。用户选择日常、学习、健身或混合类别，输入当天目标，应用结合心率、血氧和压力生成可执行的一日计划，并支持腕上打卡和复盘。

核心差异是把计划从手机待办列表变成“当天状态感知”的腕上行动建议：压力偏高时加入呼吸和休息，心率偏高或血氧偏低时降低运动强度。

## 二、参赛方向

手表应用创新。作品使用 openvela 快应用框架和 `service.health`，目标设备为支持 Vela OS 的手表或手环。

## 三、目录结构

- `quickapp/hello_quickapp/`：正式快应用源码、manifest 和打包工程
- `quickapp/hello_quickapp/src/pages/index/index.ux`：首页交互、计划生成、录音入口和复盘
- `quickapp/hello_quickapp/src/pages/index/planner.js`：本地规则计划生成、健康状态判断和 AI JSON 解析
- `quickapp/hello_quickapp/src/pages/index/health.js`：`service.health` 读取与订阅
- `quickapp/hello_quickapp/src/pages/index/voice.js`：`system.record` 录音封装
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
4. 按“混合 → 示例 → 生成计划 → 完成一项”的顺序演示。

应用优先生成本地可解释计划，然后尝试通过 `@system.velaclaw` 调用设备端 AI Agent。AI 不可用或返回格式不符合约束时自动保留本地计划，演示不会中断。健康数据来自 `service.health` Mock 回放。

### 3. 打包

在 AIoT-IDE 中执行开发打包生成 debug RPK；提交前使用 IDE 的“发布”流程生成签名和 `release.rpk`。生产包、作品介绍文档、演示视频和 AI Coding 日志需要与同一版本源码对应。

命令行生产打包命令：

```bash
cd quickapp/hello_quickapp
npm run release
```

生成文件位于 `quickapp/hello_quickapp/dist/`；当前已复制一份到 `submission/VelaPlan.release.rpk` 供最终压缩包使用。`dist/`、`build/`、`sign/` 和 RPK 均被 `.gitignore` 忽略，私钥不会进入仓库。

## 五、输入说明

应用已接入官方 `system.record` 录音接口，按钮可以在设备上采集一段 WAV 录音。当前版本在录音结束后保留输入框作为文字确认入口；最终提交前必须根据组委会允许的方式补齐 ASR 转写，并将转写文字传给计划引擎，不能把“录到音频”表述成“已完成语音识别”。

## 六、MiMo 配置

`@system.velaclaw` 使用设备端 `ai_agent` 的 MiMo 配置；本地后端预览则使用环境变量：

```text
MIMO_API_KEY=<本机配置，不要提交>
MIMO_API_URL=<MiMo Chat Completions 地址>
MIMO_MODEL=<账号支持的模型>
```

密钥不得写入源码、README、日志或聊天记录。未配置或请求失败时，后端使用本地规则兜底。

## 七、演示闭环

展示首页健康数据 → 选择计划类别 → 输入目标 → 生成 AI/本地计划 → 查看健康状态对运动强度的影响 → 完成任务 → 查看复盘和次日建议。

## 八、官方要求对照

- 图形能力：openvela 快应用页面、滚动布局、类别选择、任务执行和复盘。
- AI 能力：`@system.velaclaw` 调用设备端 `ai_agent`，失败时使用可解释的本地规则计划。
- 多媒体能力：`@system.record` 录制 WAV 音频。
- 健康能力：`@service.health` 读取并订阅心率、血氧、压力 Mock 数据。
- 已保留项目 Skills 沉淀；提交前仍需按官方格式导出真实 AI Coding 日志、完成 ASR 允许链路、录制不超过 5 分钟的视频，并把源码提交到官方 `dev-ai-contest-2026` 分支。

更多实施依据见 `docs/09-official-requirements-execution.md` 和 `docs/04-submission-checklist.md`。
