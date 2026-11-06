# 当前状态

版本：**0.5.3**。计算基线：**1.0.1211**（对应 `package.json` 与 `vendor/manifest.json`）。线上发布记录以[GitHub Releases](https://github.com/yukixz/deepveinidle-buddy/releases)与[Greasy Fork](https://greasyfork.org/zh-CN/scripts/601896-deepveinidle-buddy)为准，历史变更见[更新说明](../CHANGELOG.md)。

功能与计算规则统一见[面板规则](panel.md)，模块和上游来源见[技术方案](technical.md)。工作区存档保持 `version=2`，新增字段的兼容与降级限制见[存储与恢复](panel.md#存储与恢复)。

## 待发布变更

- 整理文档分工，合并重复规则，修正过期描述与引用；不改变代码、存档格式或版本号。

## 验证与边界

本次仅修改文档：已核对本地版本、存档字段、预填守卫、开发命令与发布工作流，并检查相对链接、章节锚点及差异格式；未运行单元、构建或浏览器测试，未核验线上发布状态。

发布门禁与日常入口见[构建与发布](releasing.md#日常入口)。本地结果路径：

- `.test-artifacts/release-task/summary.json`：发布任务阶段、结果及诊断日志路径。
- `.test-artifacts/verification/summary.json`：浏览器场景结果。

这些文件可能来自历史运行，不能作为本次验证结果；线上结果需查看对应 Actions 与 Release。本地诊断不提交。

隔离浏览器不代替真实脚本管理器、账号、Android／iOS 真机、安全区域、系统键盘及长期运行验收。本次未进行这些验收。
