# 当前状态

版本：**0.5.6**。计算基线：**1.0.1212**（对应 `package.json` 与 `vendor/manifest.json`）。线上发布记录以[GitHub Releases](https://github.com/yukixz/deepveinidle-buddy/releases)与[Greasy Fork](https://greasyfork.org/zh-CN/scripts/601896-deepveinidle-buddy)为准，历史变更见[更新说明](../CHANGELOG.md)。

功能与计算规则统一见[面板规则](panel.md)，模块和上游来源见[技术方案](technical.md)。工作区存档保持 `version=2`，新增字段的兼容与降级限制见[存储与恢复](panel.md#存储与恢复)。

## 当前版本变更

- 购买预填可识别市场草稿中带千位逗号的数量和单价，修复数值正确却误报输入被拒绝的问题。
- 数量与单价仍须与请求整数完全一致；游戏实际调整数值时仍明确报错，交易继续由用户确认。
- 计算基线、角色接入和用户存档格式不变。

## 验证与边界

本轮审查已通过 211 项单元测试、构建及 `git diff --check`，隔离浏览器的游戏接入与移动端场景共 58 项检查通过。专项覆盖数量 `1,234`、单价上限 `10,000,000,000` 的千位逗号回读，以及游戏实际改价时的错误反馈与不提交交易的边界。完整发布门禁结果由下方发布任务摘要记录。

发布门禁与日常入口见[构建与发布](releasing.md#日常入口)。本地结果路径：

- `.test-artifacts/release-task/summary.json`：发布任务阶段、结果及诊断日志路径。
- `.test-artifacts/verification/summary.json`：浏览器场景结果。

这些文件可能来自历史运行，不能作为本次验证结果；线上结果需查看对应 Actions 与 Release。本地诊断不提交。

隔离浏览器不代替真实脚本管理器、账号、Android／iOS 真机、安全区域、系统键盘及长期运行验收。本次未进行这些验收。
