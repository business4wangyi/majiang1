# 开发规范和规则

- 用户明确要求：不要生成总结性Markdown文档，不要生成测试脚本，不要编译，不要运行，用户自己处理这些操作
- 用户再次强调：不要生成总结性Markdown文档，不要生成测试脚本，可以帮助编译和运行现有代码
- 用户再次强调：不要生成总结性Markdown文档，不要生成测试脚本，不要编译，不要运行，用户自己处理这些操作
- 强制工具使用规范：所有训练、编译、测试等任务必须优先使用Desktop Commander MCP工具（start_process_desktop-commander、interact_with_process_desktop-commander、read_process_output_desktop-commander），严禁使用Terminal工具（launch-process、read-process、write-process）。这是为了避免冗长输出回调，提高处理效率，并遵循用户明确要求。
- 强制工具使用规范：所有训练、编译、测试等任务必须优先使用Desktop Commander MCP工具（start_process_desktop-commander、interact_with_process_desktop-commander、read_process_output_desktop-commander），严禁使用Terminal工具（launch-process、read-process、write-process）。这是为了避免冗长输出回调，提高处理效率，并遵循用户明确要求。
- 用户明确指示：❌不要生成总结性Markdown文档，❌不要生成测试脚本，✔️帮我编译，✔️帮我运行。需要在.augment/rules下新增规则文件补全工具使用规范。
- 用户再次强调：❌不要生成总结性Markdown文档，❌不要生成测试脚本，✔️帮我编译，✔️帮我运行。Desktop Commander MCP训练成功启动（PID:17013），正在进行第1轮训练的自我对弈阶段，用户选择继续监控MCP训练进度。
- 深度根本原因分析揭示了AI训练失败的核心问题：发现15个问题（6个严重、6个高优先级、3个中等），最关键的6个严重问题是：1)网络容量不足(33万参数，复杂度比率26.74<50)，2)数据质量不足(模拟数据评分6.0/10)，3)标签质量问题(基于规则生成非专家数据)，4)监督学习局限性(无法处理多玩家博弈)，5)训练-测试分布差异(置信度差距9.1%)，6)输出置信度过低(最大概率仅2.95%)。根本原因是：网络规模不足、训练方法错误(应用强化学习)、数据来源问题(需要真实专家数据)。建议完全重新设计架构，采用强化学习自对弈方法，增加网络规模到100万参数以上。
