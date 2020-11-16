---
layout: post
title: salt 中关于locale的问题
description: salt 中关于locale的问题
categories: [Salt]
keywords: Salt/locale
excerpt: salt 中关于locale的问题
---


最近遇到一个诡异的事情，hive/spark 写入汉字乱码。

检查hive/spark的各种参数也没有发现有什么变动，客户端配置也是一样的。



唯一的变动是最近重启了 `NodeManager`

登陆出现问题的主机

执行 `locale`
>>   LANG=en_US.UTF-8
    LC_CTYPE="en_US.UTF-8"
    LC_NUMERIC="en_US.UTF-8"
    LC_TIME="en_US.UTF-8"
    LC_COLLATE="en_US.UTF-8"
    LC_MONETARY="en_US.UTF-8"
    LC_MESSAGES="en_US.UTF-8"
    LC_PAPER="en_US.UTF-8"
    LC_NAME="en_US.UTF-8"
    LC_ADDRESS="en_US.UTF-8"
    LC_TELEPHONE="en_US.UTF-8"
    LC_MEASUREMENT="en_US.UTF-8"
    LC_IDENTIFICATION="en_US.UTF-8"
    LC_ALL=


貌似也没啥问题。



有一个奇怪的地方是 

spark-sql -f xxx.sql,xxx.sql 如果xxx.sql 中如果有汉字，则也会有问题。

spark-submit client 模式则没有问题，cluster 模式则会有问题。

这里面唯一区别是client的driver 在 本地，cluster 在 yarn（nodemanager） 节点。

分析来看，不管是hive/spark 只要任务跑在yarn上面则会有问题。

所以这块感觉和 nodemanager 有关系，因为on yarn的进程都是 nodemanager fork 出来的


salt 'nm-*' cmd.run 'sudo -u yarn bash -c "source /etc/profile;yarn-daemon.sh start nodemanager"'

比较2个进程加载的fd 发现有一个

ps -ef|grep -v grep|grep org.apache.hadoop.yarn.server.nodemanager.NodeManager|awk '{print $2}'|xargs lsof -p |sort -n > lsof1

ps -ef|grep -v grep|grep org.apache.hadoop.yarn.server.nodemanager.NodeManager|awk '{print $2}'|xargs lsof -p |sort -n  > lsof2

diff lsof1 lsof2

然后发现少了
/usr/lib/locale/locale-archive

很奇怪相同的命令，为什么会少不一样呢？







```
salt "nm-*" cmd.run " ps -ef|grep -v grep|grep org.apache.hadoop.yarn.server.nodemanager.NodeManager|awk '{print \$2}'|xargs lsof -p|grep REG|grep /usr/lib/locale/locale-archive"

```

会发现执行失败
$2 前面需要加转义符号

```
salt "*" cmd.run " ps -ef|grep -v grep|grep org.apache.hadoop.yarn.server.nodemanager.NodeManager|awk '{print \$2}'|xargs lsof -p|grep REG|grep /usr/lib/locale/locale-archive"

```
