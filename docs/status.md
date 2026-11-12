# 当前状态

版本：**0.5.6**。计算基线：**1.0.1214**（对应 `package.json` 与 `vendor/manifest.json`）。线上发布记录以[GitHub Releases](https://github.com/yukixz/deepveinidle-buddy/releases)与[Greasy Fork](https://greasyfork.org/zh-CN/scripts/601896-deepveinidle-buddy)为准，历史变更见[更新说明](../CHANGELOG.md)。

功能与计算规则统一见[面板规则](panel.md)，模块和上游来源见[技术方案](technical.md)。工作区存档保持 `version=2`，新增字段的兼容与降级限制见[存储与恢复](panel.md#存储与恢复)。

## 待发布变更

- 计算基线更新至游戏 1.0.1214，更新公开资源、来源摘要和符号映射并重新生成上游模块；105 级工具升级保留强化等级。
- 收藏（制造）执行计划移除额外的“当前→目标”列，已完成提示保留在物品列，目标调整与移除操作保留。
- 执行计划操作列将“执行”放在所有按钮首位，收藏操作依次为执行、＋、−、×。
- 用户存档格式保持 `version=2`，本轮未发布。

## 验证与边界

本轮已通过 211 项单元测试、构建及 `git diff --check`。隔离浏览器运行 `assistant-modes`、`execution-summary`、`execution-borders`、`game-integration`、`mobile-tables` 五个场景，共 79 项检查通过，覆盖双语六列表头、执行按钮首位、目标调整与移除、完成项提示、配套制造、移动端横向滚动及只读接入／草稿预填。上游来源摘要与确定性再生成已由单元测试核验，工具升级覆盖全部 10 种工具、5 种品质及 +0／+1／+10／+20。

发布门禁与日常入口见[构建与发布](releasing.md#日常入口)。本地结果路径：

- `.test-artifacts/release-task/summary.json`：发布任务阶段、结果及诊断日志路径。
- `.test-artifacts/verification/summary.json`：浏览器场景结果。

这些文件可能来自历史运行，不能作为本次验证结果；线上结果需查看对应 Actions 与 Release。本地诊断不提交。

隔离浏览器不代替真实脚本管理器、账号、Android／iOS 真机、安全区域、系统键盘及长期运行验收。本次未进行这些验收。
