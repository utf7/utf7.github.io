---
layout: post
title: DeepSeek Harness 终于来了并重磅开源：模型之外，还有更重要的一层
description: 模型负责思考，Harness 负责让它干活。DeepSeek Harness 开源后，模型与 Harness 的 Co-Design 才是更值得关注的一层。
categories: [AI Agent]
keywords: DeepSeek, Harness, AI Agent, Cordis, DataClaw
excerpt: 模型负责思考，Harness 负责让它干活。DeepSeek Harness 开源后，模型与 Harness 的 Co-Design 才是更值得关注的一层。
---

就在刚刚，DeepSeek Harness 重磅发布。超哥没注意点开 DeepSeek 的 GitHub，本想去看看 DeepSeek V4 Pro 相关的文档，结果意外发现 DeepSeek Harness 已经在仓库里开源了。

对关注 DeepSeek Agent 方向的人来说，这次发布的分量不轻。它不是新模型，也不是给 DeepSeek API 套一个聊天界面，而是把模型放进真实工作环境的那套运行系统。

简单说，**模型负责思考，Harness 负责让它干活。**

## Harness 到底是什么？

关于 DeepSeek Harness，前几天在我的视频号聊过。有兴趣可以听一听：

<https://weixin.qq.com/sph/A71bgxIgl6>

直接调用模型并不难。难的是模型决定「下一步要做什么」之后，系统如何接住它。

模型想读文件，谁来检查路径？想运行命令，在哪个环境执行？操作有风险，是直接放行还是先让用户确认？任务跑到一半中断，下次能不能接着做？

这些都不是 Prompt 能解决的问题。

DeepSeek Harness 做的，就是把模型、工具、文件系统、终端、会话记录、沙箱和权限控制接到一起，组成一套完整的 Agent Runtime。

它提供 Web UI，也支持 Headless 模式和 Python SDK，可以独立使用，也能嵌入评测平台、CI 流程或企业内部系统。

## 从算法与 Infra Co-Design，到模型与 Harness Co-Design

我一直有个观点：AI 的进步从来不只靠算法。

大模型训练阶段，算法与 Infra 一直在共同演进。新算法会带来新的计算、通信和显存需求，基础设施的能力也会反过来决定哪些算法真正跑得起来。

Agent 时代也是同样的道理，只是关系变成了 Model 与 Harness 的 Co-Design。模型为什么进度这么快，个人感觉和 Agent Skill 的发明以及 Harness 协同设计有巨大的关系。

模型需要 Harness 提供上下文、工具和执行环境；Harness 也需要根据模型的真实表现调整工具定义、上下文组织、重试机制和权限策略。

两边不能各做各的。

模型工具调用不准，问题可能不在模型，也可能是 Tool Schema 写得不清楚。任务执行到一半跑偏，可能是规划能力不足，也可能是 Harness 返回的信息不适合模型理解。

只有把模型放进真实任务里跑，完整记录中间过程，才能知道问题究竟出在哪里。

## 一套系统，两个优化方向

DeepSeek Harness 使用追加式事件日志记录用户消息、模型输出、工具调用和执行结果。这些记录不仅可以用来恢复和回放会话，也为后续评测和数据分析留下了基础。

从这个角度看，模型与 Harness 可以形成下面的协同关系：

![模型与 Harness 协同优化](/images/posts/ai/deepseek-harness/model-harness-codesign.png)

一边是模型优化，例如规划、工具选择、参数生成和错误恢复。

另一边是 Harness 优化，例如 Prompt 组装、工具协议、上下文管理、模型路由、重试逻辑和安全策略。

真实任务产生执行轨迹，轨迹经过清洗和评测，再分别反馈给模型与 Harness。系统变好以后，可以处理更多任务，进而产生覆盖面更广的数据。

这才是数据飞轮：

```
真实任务 → 执行轨迹 → 失败归因 → 模型与 Harness 同时改进 → 更高的任务完成率 → 更多真实任务
```

需要说明的是，DeepSeek Harness 目前并没有宣称会自动把会话数据用于训练。它提供的是事件日志、持久化、回放和遥测等基础能力。训练回流、数据脱敏和用户授权仍然需要团队自己完成。

## 话不多说，把代码拉下来跑跑看

内测声明还没有去掉：

![DeepSeek Harness 内测声明](/images/posts/ai/deepseek-harness/preview-notice.png)

首页可以添加本地项目，有好几种模式：标准模式、PTC 模式、极简模式、创造模式。

![DeepSeek Harness 首页与运行模式](/images/posts/ai/deepseek-harness/homepage-modes.png)

看来 DeepSeek 还是很在乎 Trace 链路的。这点和我们开发的喜马 DataClaw 智能体不谋而合，不能说有点类似，几乎是一模一样！哈哈哈😊，特别是倒数第二个红色框起来的。

让它了解一下 DataClaw：

![向 DeepSeek Harness 介绍 DataClaw](/images/posts/ai/deepseek-harness/chat-dataclaw.png)

![DataClaw 介绍回复](/images/posts/ai/deepseek-harness/dataclaw-intro.png)

![DeepSeek Harness 对 DataClaw 架构的评价](/images/posts/ai/deepseek-harness/architecture-review.png)

操，情绪价值拉满啊：

> 设计者的架构品味和踩坑经验都体现在代码里，这是一个「有经验的人带着 AI 辅助高速迭代」的产物；但它是靠个人纪律在运转的——一旦核心维护者离开或 AI 提交失控，没有 CI 和 lint 门禁会让债务快速恶化。

继续继续。

通用设置：

![通用设置](/images/posts/ai/deepseek-harness/general-settings.png)

模型设置：

![模型设置](/images/posts/ai/deepseek-harness/model-settings.png)

插件设置：

![插件设置](/images/posts/ai/deepseek-harness/plugin-settings.png)

Agent 预设：

![Agent 预设](/images/posts/ai/deepseek-harness/agent-preset.png)

## 「一切皆插件」

DeepSeek Harness 基于 Cordis 构建，采用「一切皆插件」的架构。

### 架构先看全貌

我把仓库和架构文档过了一遍。DeepSeek Harness 最鲜明的地方不是 Web UI，而是它把整个运行系统拆成了一棵 Cordis 插件树。

![DeepSeek Harness 技术架构](/images/posts/ai/deepseek-harness/cordis-plugin-tree.png)

模型适配器是插件，工具系统是插件，会话日志是插件，Agent Loop 本身也是插件。开发者可以在不修改整套框架的情况下，更换模型，为自己的场景配置插件和权限。

这套设计很适合做对比实验。

固定 Harness 更换模型，可以比较不同模型的任务完成率；固定模型调整工具和上下文，可以判断系统层改动是否有效。只有能够控制变量，Co-Design 才有实际意义。

## Prompt 不是安全边界

DeepSeek Harness 另一个比较务实的地方，是没有把安全全部交给模型。

模型发起工具调用后，请求还要经过参数检查、权限策略、用户审批和沙箱，才能真正访问文件或执行命令。

这比在系统提示词里写一句「不要执行危险操作」可靠得多。

模型可以犯错，权限系统不能跟着碰运气。

## 如何运行？

安装 Node.js 后，可以直接启动 Web UI：

```sh
npx @deepseek-ai/dsh web
```

默认地址为：

```
http://127.0.0.1:3080
```

配置模型并选择工作目录后，就可以创建任务。

项目也提供 Python SDK：

```sh
python -m pip install deepseek-harness-sdk
```

模型方面并不只支持 DeepSeek，也可以配置 OpenAI、Anthropic、自托管服务和其他兼容接口。详见 [模型配置文档](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/providers.zh.md)。

## 现在还很早

DeepSeek Harness 目前仍处于 Developer Preview，官方明确提醒后续会有破坏兼容性的修改。

它也不是一款开箱即用的普通 AI 编程助手。Cordis、Profile、Bundle 和插件配置都有学习成本。现阶段更适合正在搭建 Agent 平台、设计受控执行环境，或者研究模型与工具协同的团队。

但方向已经很清楚。

过去我们更多关注模型本身。到了 Agent 阶段，模型能力只是系统的一部分。真正决定 Agent 能不能进入生产环境的，是模型、Harness 和 Infra 能否一起设计、一起迭代。

模型产生行动，Harness 执行动作并记录结果，数据再推动两边继续改进。

这可能才是 DeepSeek Harness 最值得期待的地方。

项目地址：[deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)

PS：第一时间让 DeepWiki 索引了 DeepSeek Harness 代码库：

<https://deepwiki.com/deepseek-ai/deepseek-harness>

---

本文同步自公众号「程序员乌托邦」：[DeepSeek Harness 终于来了并重磅开源：模型之外，还有更重要的一层](https://mp.weixin.qq.com/s/wXRoFXFeW0Q9QSGOeRx1TQ)
