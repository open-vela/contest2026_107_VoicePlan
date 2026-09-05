# VelaPlan（快应用形态）

这是 VelaPlan 的 openvela 手表快应用实现，映射到
`packages/apps/contest2026_107_hello_quickapp`。

- `src/pages/index/index.ux`：腕上计划创建、执行和复盘界面
- `src/pages/index/planner.js`：本地结构化计划生成和健康状态调整
- `src/pages/index/health.js`：`service.health` 数据读取与订阅
- `src/pages/index/voice.js`：`system.record` 录音封装
- `manifest.json`：手表设备、健康服务和权限声明
