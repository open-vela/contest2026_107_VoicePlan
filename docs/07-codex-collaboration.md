# 我和 Codex 的协作方式

后续按“两人协作”推进：你负责必须本人操作的硬件、账号、扫码、IDE 图形界面步骤；Codex 负责代码、文档、调试判断、演示脚本和提交材料。

## 你需要做

1. 安装 AIoT-IDE。
2. 在 AIoT-IDE 里更新 `aiot-core` 和 `aiot-emulator` 到 1.7.22+。
3. 创建 `vela-miwear-watch-5.0(开发者大赛)` 模拟器。
4. 用 AIoT-IDE 打开 `C:\Users\LEGION\Documents\XiaoMi\contest2026_107_VoicePlan\quickapp\hello_quickapp`。
5. 连接 SF32LB52-DevKit-LCD 开发板，确认供电、屏幕、串口。
6. 把 IDE 报错、模拟器截图、开发板串口信息发给 Codex。
7. 如果需要本地后端联调，获取 MiMo API Key，但不要直接发在聊天里；只配置到本机环境变量或本地 `.env`。

## Codex 负责

1. 完成 VelaPlan 快应用代码。
2. 完成本地预览和计划生成逻辑。
3. 接入健康 Mock 数据逻辑。
4. 准备 MiMo Prompt、接口格式和后端占位。
5. 根据你发来的报错继续修代码。
6. 写作品介绍文档、README、演示脚本和提交清单。
7. 帮你压缩整理最终提交材料。

## 每次你发给 Codex 的信息

- 你当前做到哪一步。
- 屏幕截图或错误提示。
- AIoT-IDE 插件版本。
- 当前选择的模拟器镜像。
- 开发板连接后出现的 COM 口。
