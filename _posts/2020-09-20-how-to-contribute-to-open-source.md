---
layout: post
title: 如何向开源社区提交代码
description: 以 Apache HBase 为例介绍如何向开源社区提交代码
categories: [HBase,OpenSource]
keywords: HBase,OpenSource
excerpt: 以 Apache HBase 为例介绍，介绍如何向开源社区提交代码
---

本文将以 Apache HBase 项目为例，介绍如何向社区提交代码。

## fork apache 上游项目：



登陆 `github`，然后在 github 上面 fork 一下 apache/hbase

![hbase-fork](/images/posts/github/hbase-pr/hbase-fork.png)



## clone 你fork的仓库到本地



```shell
git clone https://github.com/utf7/hbase.git
```



注意上面 `clone` 的是自己 `fork`的仓库

## 设置上游仓库

```shell
git remote add upstream  https://github.com/apache/hbase.git

```

验证一下

```shell
git remote -v 
输出：
origin	https://github.com/utf7/hbase.git (fetch)
origin	https://github.com/utf7/hbase.git (push)
upstream	https://github.com/apache/hbase.git (fetch)
upstream	https://github.com/apache/hbase.git (push)
```

## 在 HBase jira 空间，创建一个 jira

![hbase-jira1](/images/posts/github/hbase-pr/hbase-jira1.png)



jira 填写标题、Issue Type,Priority,Component（可选），影响版本、描述等

然后assignee 给自己（之前没有提交过代码可能不可以assignee给自己，不过没有关系，可以联系社区人帮你添加一下或者不assginee 给自己，也可以提交解决方案等）。

## 修改并提交PR



#### 准备分支用于提交pr

git pull upstream

git checkout HBASE-24791

git pull --rebase （注意不要直接使用git pull,工作流会干净些**）**

#### 修改代码，然后提交

git add xxx

git commit 

commit 日志一般写

[JIRAID] [内容]

这里是：

HBASE-24791 Improve HFileOutputFormat2 to avoid always call getTableRelativePath method

#### 提交代码到自己的仓库

此时会触发一个PR然后让你填写：

git push origin HBASE-24791:HBASE-24791



#### 填写pr

然后去github 看，会触发一个让你创建一个pull/merge之类的（我合理截图的是之前提交给pulsar的，hbase 也是一样的）



![hbase-jira2](/images/posts/github/hbase-pr/hbase-jira2.png)



填写如下内容

一个是标题：

一个是内容描述

![hbase-jira3](/images/posts/github/hbase-pr/hbase-jira3.png)



然后点击确认

然后过一会去HBase jira 空间会看到自动链接一个pull request

#### 查看jira

![hbase-jira4](/images/posts/github/hbase-pr/hbase-jira4.png)



然后可能就会有社区的人帮你review 代码，或者留言了，注意观察跟进一下，根据修改建议，修改代码。

## 注意事项



建议提交PR有几个注意点：

1、搜索是否已经有同样问题的 jira/pr 了，一般发现的问题，社区都会解决方案。

2、注意认真阅读项目代码提交规范。

3、注意代码格式和代码质量。比如hbase项目下面有dev-support/ 下面有一些格式化的模版，同时注意一些基本的代码规范。

4、修改在本地环境测试通过以后再提交
