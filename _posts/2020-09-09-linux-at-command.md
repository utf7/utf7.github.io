---
layout: post
title: Linux 一次性任务调度 at 命令简介
description: Linux 一次性任务调度 at 命令
categories: [Linux]
keywords: linux,at
excerpt: 本文介绍 Linux 一次性任务调度 at 命令的常规使用
---

# Linux 一次性任务调度 at 命令

##  背景描述
  
Linux 计划任务分为周期性和一次性，周期性使用 `crontab` 命令， `at` 用于执行一次性计划任务。


## 使用

### 创建 job

```shell
$  at 5:00 tomorrow   // 明天5点执行

at>date > /tmp/at_test.txt

at><EOT>
```

输入 Ctrl+D 来表示停止添加命令,此时会输出本次编辑的计划信息：

`job 6 at Fri Sep 11 05:00:00 2020`

### 查看 job

执行 atq // 查询

`$atq`

`6	Fri Sep 11 05:00:00 2020 a hadoop`

at -l 与 atq 类似


### 查看 job 详细

at -c jobid

### 删除 job 

`atrm jobid`

如：`atrm 6`


atrm  jobid

at -d jobid

at -r jobid


### 执行多个任务


$  at now + 1 minute   // 明天5点执行
at>date > /tmp/at_test.txt;hostname > /tmp/at_test1.txt;
at><EOT>

输入 Ctrl+D 来表示停止添加命令,此时会输出本次编辑的计划信息：

`job 11 at Fri Sep 11 01:30:00 2020`


### 从文件中执行 job

-f 表示执行文件中的命令

`at now + 1 minute -f test.sh`

另外也可以使用

`at now + 1 minute < test.sh`

### 常见时间格式：

```shell
at 11:00 AM //今天上午11点

at 11:00 AM tomorrow // 明天上午11点 

at 11:00 AM next week // 下周今天11点

at next week  // 下周的这个时刻

at 11:00 AM next fri //下周五上午11点

at next fri // 下周五这个时候

at 11:00 AM next month //下个月的这个时候

at 11:00 AM 3/15/2020 //执行某个时刻

at now + 30 minutes //30分钟后

at now + 2 hours //2小时后

at tomorrow //明天的这时刻

at thursday //周三这时刻

at midnight //早上（中午）12点

at now + 1 minute //一分钟后执行

```

更多用法请查看 `man at`


参考链接：

1. https://linux.die.net/man/1/at
2. https://www.howtogeek.com/451386/how-to-use-at-and-batch-on-linux-to-launch-processes/



