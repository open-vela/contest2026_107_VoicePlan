# 提交清单

## 官方时间

- 报名：2026-07-17 至 2026-09-08。
- 初赛作品提交截止：2026-09-20 24:00。
- 初赛评审：2026-09-26 至 2026-09-29。
- 决赛：2026-10-11。

## 代码

- `quickapp/hello_quickapp/src/manifest.json`
- `quickapp/hello_quickapp/src/app.ux`
- `quickapp/hello_quickapp/src/pages/index/index.ux`
- `quickapp/hello_quickapp/src/pages/index/health.js`
- `quickapp/hello_quickapp/src/pages/index/planner.js`
- `quickapp/hello_quickapp/src/pages/index/voice.js`
- `quickapp/hello_quickapp/package.json`
- 生产模式打包产物：`quickapp/hello_quickapp/dist/*.release.rpk`，当前副本为 `submission/VelaPlan.release.rpk`。
- 官方比赛仓库地址或最终源码压缩包。

## 文档

- 作品介绍文档。
- 项目 README。
- 开发板与模拟器说明。
- AI-Native 开发日志。
- Prompt 与结构化输出说明。
- 至少一个有效 Skills 沉淀。
- 如使用 MiMo API，说明调用方式和 Token 使用情况，不提交密钥。
- 说明作品赛道：手表应用创新。
- 说明相对个人基线的演示规则：最大心率估计 `208 - 0.7 × 年龄`，心率警戒阈值为 `max(100, 静息心率 + 20)`，仅用于非医疗计划调整。

## 视频

- 不超过 5 分钟。
- 必须展示完整闭环：统一目标与周期设置、重要提醒、生成计划、腕上执行、健康/天气影响、复盘总结。
- 至少包含一次健康 Mock 数据影响计划的画面。
- 视频内容必须和提交的 RPK、源码、作品文档一致。

## 风险检查

- 不提交 API Key。
- 不宣传医疗诊断能力。
- 不使用未授权素材。
- 代码和文档基于 `dev-ai-contest-2026` 相关要求。
- 遵循 Apache 2.0 开源协议要求。
- 如果使用语音唤醒，只使用 `你好，openvela` 或 `Hello，openvela`。
- 当前目录是官方队伍仓库的本地 Git 工作区；提交前必须完成最终 commit、远程推送、官方分支 PR 合入和日志链路。
