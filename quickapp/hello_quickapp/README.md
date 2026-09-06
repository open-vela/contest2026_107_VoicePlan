# VelaPlan（快应用形态）

这是 VelaPlan 的 openvela 手表快应用实现，映射到
`packages/apps/contest2026_107_hello_quickapp`。

- `src/pages/index/index.ux`：腕上计划创建、执行和复盘界面
- `src/pages/index/planner.js`：本地结构化计划生成和健康状态调整
- `src/pages/index/health.js`：`service.health` 数据读取与订阅
- `src/pages/index/voice.js`：录音、文件与 HTTPS 平台适配
- `src/pages/index/transcription.js`：MiMo 多模态音频转写与超时、错误处理
- `manifest.json`：手表设备、健康服务和权限声明

语音转写需要设备端私有密钥配置，不随源码或 RPK 提供。操作和验收说明见 [MiMo 语音接入](../../docs/10-mimo-voice.md)。
