# MiMo 手表语音转写

## 接入依据

参赛者转述的技术答复：可以使用 MiMo-Omni 多模态接口转写音频，由手表 `system.fetch` 通过 HTTPS 调用。

截至 2026-09-06 查阅的 MiMo 官方文档，当前多模态模型为 `mimo-v2.5`；旧 `mimo-v2-omni` 已列为弃用模型。是否可用仍取决于参赛账号的模型权限、服务地址和额度，不能仅凭模型名宣称联调成功。

- [音频理解与请求示例](https://mimo.mi.com/static/docs/quick-start/usage-guide/multimodal-understanding/audio-understanding.md)
- [官方模型列表](https://mimo.mi.com/static/docs/quick-start/summary/model.md)
- [Chat Completions 协议](https://mimo.mi.com/static/docs/api/chat/openai-api.md)
- [手表 record](https://iot.mi.com/vela/quickapp/zh/features/system/record.html)
- [手表 file](https://iot.mi.com/vela/quickapp/zh/features/data/file.html)
- [手表 fetch](https://iot.mi.com/vela/quickapp/zh/features/network/fetch.html)

## 实现流程

1. 点击语音输入，`system.record` 录制最多 8 秒、16 kHz、单声道 WAV；再次点击可提前停止。
2. 成功回调返回缓存 URI。`system.file` 先检查文件大小，再读取字节，限制为 300 KiB。
3. 用 `base64-js` 生成 `data:audio/wav;base64,...`，通过 `system.fetch.fetch` 发送非流式 HTTPS 请求。不能把设备的 `internal://` URI 直接发送给云端当音频。
4. 请求使用 `input_audio`、`thinking: {type: 'disabled'}` 和 `response_format: {type: 'json_object'}`。只读取最终 `message.content` 中的 `{text: "..."}`，不读取推理字段。
5. 转写文字进入目标输入框，用户检查、编辑，再点击生成计划。转写过程不会自动调用计划引擎。
6. 计划生成继续走已有 `system.velaclaw`，不可用时明确显示本地规则结果。语音密钥不会自动配置设备端 AI Agent。

录音回调等待上限 12 秒，读取配置、音频和网络转写合计等待上限 30 秒。没有自动重试，避免重复上传和重复扣费。`system.fetch` 没有文档化取消接口，因此取消/超时会忽略迟到回调，但不保证底层网络请求立即停止。

修改目标、使用示例或退出页面会取消当前语音任务。失败不清空原目标，不把示例当作识别结果。结束时尝试删除应用录音缓存；崩溃、文件系统错误或强制断电时不能保证删除成功。

## 本地配置

1. 在 AIoT-IDE 启动 `VelaPlan_390x450`，安装并打开本次生成的 RPK。
2. 在电脑上双击 `tools/configure-watch-voice.cmd`。工具使用隐藏输入提示读取密钥，不要把密钥发到聊天里。
3. 输入账号已有的 MiMo API Key。`sk-` 使用 `https://api.xiaomimimo.com/v1/chat/completions`，`tp-` 使用 `https://token-plan-cn.xiaomimimo.com/v1/chat/completions`。Token Plan 的具体模型权限仍需账号实测。
4. 工具把配置写入模拟器应用私有目录 `/data/files/com.velaplan.watch/mimo-voice.json`，应用通过 `internal://files/mimo-voice.json` 读取。临时本地文件在工具退出时删除；不向仓库、安装包或命令历史写入密钥。

只检查连接与配置文件是否存在，不读取密钥：

```powershell
powershell.exe -NoProfile -File tools/configure-watch-voice.ps1 -CheckOnly
```

配置包含 `apiKey`、`model`、`apiUrl` 三项。应用仅接受上述两个官方 HTTPS 地址。脚本默认 `mimo-v2.5`，不购买额度、不创建账号、不自动发送测试音频。写入成功只证明本地配置完成，不代表 API 认证成功。

应用私有目录不是加密保险箱，开发者 ADB 能读取其中内容。此方案面向个人参赛演示；不要把个人密钥随模拟器镜像、设备备份、录屏或公开 RPK 分发。面向公开产品需要另行设计服务端凭证代理或短期授权。

## 验收

- `npm test`：计划逻辑、原文本客户端、布局、音频请求/错误、页面生命周期共 5 组测试。
- `npm run release`：正式快应用可生成生产 RPK。工具链仍提示未知 `system.velaclaw`，需单独确认镜像的 AI Agent 能力。
- 2026-09-06 模拟器实测：RPK 安装并启动、390×450 页面显示、录音自动结束、读取缺失私有配置的错误提示、保留原目标和删除临时录音均已验证。当前镜像日志明确显示没有 `system.velaclaw` 原生接口，计划生成仍会使用本地兜底，不能表述为 AI 已生成。
- 真实 API 验收：配置可用密钥，录一句短目标，检查识别准确性、编辑确认、计划生成及清理结果；断网重试时原目标应保留。
- 当前没有密钥的测试不等于真实转写联调成功。`submission/` 中旧 RPK、ZIP 和作品文档仍需在最终验收后统一更新。

常见错误：密钥/权限问题显示“MiMo 密钥或模型权限不可用”；限额或限流显示“MiMo 额度不足或请求频繁”；听不清显示“未识别到清晰语音”；超时/断网保留原目标。不要录制他人隐私内容用于测试。
