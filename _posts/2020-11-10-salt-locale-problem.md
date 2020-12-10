---
layout: post
title: salt 中关于locale的问题
description: salt 中关于locale的问题
categories: [Salt]
keywords: Salt/locale
excerpt: salt 中关于locale的问题
---


## 记录一次诡异的 Hive/Spark 乱码问题

最近遇到一个诡异的事情，Hive/Spark 写入汉字乱码。

检查 Hive/Spark 的各种参数也没有发现有什么变动，客户端配置也是一样的。

有一个诡异的地方是 

spark-sql -f xxx.sql,xxx.sql 如果xxx.sql 中如果有汉字，则也会有问题。

spark-submit client 模式则没有问题，cluster 模式则会有问题。

这里面唯一区别是 client 的 driver 在 本地，cluster 在 yarn（NodeManager） 节点。

另外Spark/MR 读写数据也有问题，不过 hive cli 不启动 MR的话，则没有问题。。。比如 select * from t limit 10 这种不回启动mr，则是本地运行的。

分析来看，不管是 Hive/Spark 只要任务跑在 YARN 上面则会有问题。

所以这块感觉和 NodeManager 有关系，因为 on YARN 的进程都是 NodeManager fork 出来的。

因为最近在做 Zstandard 修改了代码，所以同事怀疑是否代码引起的。我反复check了代码，并没有涉及到字符编码相关的内容。不应该出现此类问题。

不过由于修改了Hadoop 代码，需要重启 NodeManager ，最近变动就是重启了 `NodeManager`以及添加了 Zstandard 的支持。

百思不得其解：

登陆出现问题的主机

执行 `locale`

```shell
    LANG=en_US.UTF-8
    LCCTYPE="en_US.UTF-8"
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
```    

貌似也没啥问题。


此时赶快将节点回滚到之前的版本，然后慢慢重启 `NodeManager`，发现确实问题渐渐修复了。

还有另外一个现象是并不是所有内容都是乱码的，这个猜测和 `Map/Reduce` 以及 `Spark Executor` 跑在不同的 `NodeManager` 节点有关系。

这时候根据多年的经验直觉，赶快保存的异常的节点 `NodeManager` 保留的 `lsof` 句柄信息，

 diff 一下进程加载的 fd，是不是少加载了什么导致的，比较2个进程加载的fd 发现有一个  

` ps -ef|grep -v grep|grep org.apache.hadoop.yarn.server.nodemanager.NodeManager|awk '{print $2}'|xargs lsof -p |sort -n > lsof_before `  

` ps -ef|grep -v grep|grep org.apache.hadoop.yarn.server.nodemanager.NodeManager|awk '{print $2}'|xargs lsof -p |sort -n  > lsof_after`   

`diff lsof_before lsof_after`  

然后发现少了

`/usr/lib/locale/locale-archive`

咦，什么鬼。。。为啥没有这个，分明我登陆节点执行，`locale` 输出是正常的。

所以就把问题定位点放在 `/usr/lib/locale/locale-archive` 为什么少了这个地方。



出问题的 NodeManager 启动命令如下：

`salt 'nm-*' cmd.run 'sudo -u yarn bash -c "source /etc/profile;yarn-daemon.sh start nodemanager"'`

我在一个节点测试了一下，使用

`sudo -u yarn bash -c "source /etc/profile;yarn-daemon.sh start nodemanager"`

启动一个 NM 测试，发现并没有什么异常。。。。太诡异了。。。

节点还没有重启完，我赶快把所有的节点检查了一下，是否都丢失 `/usr/lib/locale/locale-archive`

```
salt "*" cmd.run " ps -ef|grep -v grep|grep org.apache.hadoop.yarn.server.nodemanager.NodeManager|awk '{print \$2}'|xargs lsof -p|grep REG|grep /usr/lib/locale/locale-archive"

```

发现我之前启动的节点都是没有 `locale-archive` ，而同事新启动的则是没有问题的。莫不是启动方式有问题？？？诡异。  
执行： `salt -E "nm-*" cmd.run "locale"`   


```  LANG=en_US.UTF-8
    LC_CTYPE=C
    LC_NUMERIC=C
    LC_TIME=C
    LC_COLLATE=C
    LC_MONETARY=C
    LC_MESSAGES=C
    LC_PAPER=C
    LC_NAME=C
    LC_ADDRESS=C
    LC_TELEPHONE=C
    LC_MEASUREMENT=C
    LC_IDENTIFICATION=C
    LC_ALL=
```
发现 `locale` 很多输出都是`C`，这个与我之前在机器上面执行的结果是不一致的。

所以应该是 `salt` 导致的，问了一下同事是如何重启的，他是kill 掉 `NodeManager`,并没有启动，而是让监控脚本自动拉起的。

而我当时为了启动快一些，是直接使用 `salt` 批量 `stop` 然后 `start` 的。

至此原因排查出来的，原来是 `salt` 的锅。

后来去github 把salt 代码拉了下来，看了一下。问题出在这边：

`salt` 默认会 `reset_system_locale`,代码截图如下：



![reset_system_locale_code1](/images/posts/salt/reset_system_locale_code1.png)



![reset_system_locale_code1](/images/posts/salt/reset_system_locale_code2.png)



个人感觉这边salt处理的很有问题，虽然提供了参数，但我仍然认为是个bug，不知道为啥会考虑默认重置locale。

很坑！！！

看了一下代码，可以执行`salt` 命令的时候，添加参数 `reset_system_locale=False` 解决：

修改 `NodeManger` 启动脚本,`Hive/Spark` 乱码问题解决

`salt 'nm-*' cmd.run reset_system_locale=False 'sudo -u yarn bash -c "source /etc/profile;yarn-daemon.sh start nodemanager"'`

验证：

`salt "nm-*" cmd.run " ps -ef|grep -v grep|grep org.apache.hadoop.yarn.server.nodemanager.NodeManager|awk '{print \$2}'|xargs lsof -p|grep REG|grep /usr/lib/locale/locale-archive"`

如果有使用salt的同学，具体可以使用如下命令来测试 测试这个问题：

`salt 'nm-*' cmd.run reset_system_locale=False 'locale'`

`salt 'nm-*' cmd.run  'locale'`

PS：
关于 `locale` ： 可参考如下几个链接：

1.https://wiki.archlinux.org/index.php/locale  
2.https://man7.org/linux/man-pages/man1/localedef.1.html  
3.https://linuxhint.com/locales_debian/


