# VelaPlan 后续操作指南

这份指南只说明从当前准备状态到完成提交需要做什么。当前项目主线是 openvela 手表快应用，初赛以模拟器和 RPK 为主，不要求先烧录开发板。

## 一、打开工程

1. 启动 AIoT-IDE。
2. 打开目录：

   `C:\Users\LEGION\Documents\XiaoMi\contest2026_107_VoicePlan\quickapp\hello_quickapp`

3. 确认工程中能看到 `src`、`manifest.json` 和 `package.json`。

## 二、启动模拟器并安装应用

1. 在 AIoT-IDE 的模拟器管理中启动 `VelaPlan_390x450`。
2. 等待手表画面完全出现，再回到工程窗口。
3. 选择该模拟器，点击“调试”或“Debug”。
4. 等待输出出现类似“Install successfully”和“Debug session started successfully”的结果。
5. 如果调试没有自动安装，可以选择安装 RPK，使用：

   `C:\Users\LEGION\Documents\XiaoMi\contest2026_107_VoicePlan\submission\VelaPlan.release.rpk`

6. 打开 VelaPlan，确认首页能看到心率、血氧、压力和“制定计划”。

## 三、配置语音转写

必须先安装并打开一次应用，再配置设备私有文件。

1. 双击项目中的 `tools\configure-watch-voice.cmd`。
2. 在隐藏输入框中输入新的 MiMo API Key，按回车。
3. 如果提示替换已有配置，输入 `YES`。
4. 不要把 Key 发到聊天、写入源码或录进视频。
5. 之前发到聊天里的 Key 已经暴露，正式测试前应先撤销，再使用新 Key。

配置检查命令只检查文件是否存在，不会显示 Key：

```powershell
powershell.exe -NoProfile -File tools\configure-watch-voice.ps1 -CheckOnly
```

## 四、先做一次功能验收

按下面顺序验收，出错时记录错误文字和截图，不要把失败结果当成功：

1. 点击“语音输入”。
2. 对着电脑麦克风说：`今天写代码两小时，晚上散步半小时。`
3. 再次点击按钮停止录音，等待转写。
4. 检查转写文字，必要时手动编辑，再点击“生成计划”。
5. 如果语音失败，先用文字输入继续验收计划功能；视频中必须如实说明语音未完成真实联调。
6. 点击“本周”，确认周期按钮能切换。
7. 点击“标记重要”，把提醒时间填写为 `18:00`。
8. 天气选择“下雨”，点击“生成计划”。
9. 确认任务中出现室内活动、延期或天气调整原因。
10. 点击“继续执行”，确认完成数量增加。
11. 点击“延期到明天”，确认任务没有被删除。
12. 关闭并重新打开应用，确认计划仍然存在。

## 五、验收健康状态影响

在 AIoT-IDE 的健康数据 Mock 或传感器模拟面板中，依次尝试以下演示值：

- 心率：`110`
- 血氧：`93`
- 压力：`45`

回到应用后点击“生成计划”。预期能看到呼吸放松、低强度活动、恢复安排或相应调整原因。若模拟器没有提供可操作的 Mock 面板，保留默认健康数据，不能手动修改源码冒充传感器数据，并在视频中说明使用了模拟器默认数据。

这些规则只是计划调整启发式，不是医疗诊断。

## 六、提交材料

最终提交需要与同一版本源码对应：

1. 作品介绍文档：确认最终日志 `manifest.json` 中的 Token 统计与文档一致。
2. 项目代码或源码压缩包。
3. 生产版 RPK。
4. 不超过 5 分钟的 Demo 视频。
5. 官方格式导出的完整 AI Coding 日志。
6. README、Prompt 和项目 Skills 说明。

当前已有的文件：

- `submission\VelaPlan-作品介绍文档.docx`
- `submission\VelaPlan-source.zip`
- `submission\VelaPlan.release.rpk`
- `submission\AI-Coding-logs.zip`

当前日志包包含 2 个真实会话，Codex 长会话已按组委会 schema 脱敏导出并通过官方 `validate-log.py`。正式提交前只需确认日志 ZIP 的生成时间与最终源码一致。

## 七、提交前禁止事项

- 不上传 MiMo API Key、私钥、`.env` 或设备私有配置文件。
- 不把本地规则结果说成 AI 已生成。
- 不把天气内置场景说成实时天气接口。
- 不把应用内提醒说成系统闹钟。
- 不把心率、血氧和压力规则说成医疗诊断。
- 不提交超过 5 分钟的视频。
