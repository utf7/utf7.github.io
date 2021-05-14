---
layout: post
title: Spark Shuffle Service 配置不合理导致的任务失败以及NodeManager OOM 问题分析
description: spark.shuffle.service.index.cache.size 参数配置不合理问题
categories: [Spark]
keywords: Spark
excerpt: Spark Shuffle Service 配置不合理导致的任务失败以及NodeManager OOM 问题分析
---



## 1.


最近集群有 Spark 任务会出现失败，查看 Spark 日志发现会有 Executor 挂掉的信息。

一般 Executor 挂掉话，通常会是几种情况：

1、Executor 自己挂了，比如申请内存不够等，executor 运行过程中 OOM等。

2、Executor 所在的节点出现问题，比如宕机 。

3、Executor 所在节点的NodeManager 挂了。因为Executor 都是NodeManager 进程 fork 出来的，NodeManager 挂的话，Executor 通常也会挂掉

4、操作系统内存紧张触发了OS的OOM Killer 功能，被操作系统干掉了。

5、Executor 被NodeManager watch 到内存超过使用的界限等原因，被NodeManager 给干掉了。

6、人为 kill （可能性较小）

## 2.


查看 Spark 日志并没有发现 Executor 有 OOM 的情况。

登陆 Executor 所在的节点，发现机器也正常。查看 NodeManager 情况

 ps -ef|grep NodeManager|grep -v grep 
查看发现 NodeManager 也在。后来仔细看了一下 NodeManager 的启动时间发现不对，是最近的时间，证明 NodeManager 之前挂过，现在又启动了

（我们有 NodeManager 自动拉起的功能，所以挂掉以后立刻被拉起来了）

check NodeManager 日志

发现是 NodeManager OOM了

```log

WARN org.spark_project.io.netty.channel.AbstractChannelHandlerContext: An exception 'java.lang.OutOfMemoryError: Java heap space' [enable DEBUG level for full stacktrace] was thrown by a user handler's exceptionCaught() method while handling the following exception:
java.lang.OutOfMemoryError: GC overhead limit exceeded
 WARN org.spark_project.io.netty.channel.AbstractChannelHandlerContext: An exception '
java.lang.OutOfMemoryError: Java heap space
FATAL org.apache.hadoop.yarn.YarnUncaughtExceptionHandler: Thread Thread[DeletionService #3,5,main] threw an Error.  Shutting down now...
java.lang.OutOfMemoryError: Java heap space

```

OK，那么到这里原因大概就知道了

NodeManager OOM 导致的 Executor 挂掉。

那么为什么会 OOM 呢？

 ps -ef|grep NodeManager|grep -v grep 
check 了一下 NodeManager 进程，发现设置了4096的堆内存（-Xmx4096m)

根据之前的经验线上应用 NodeManager 推荐大概内存是 8-12G 比较靠谱，4G 确实有点低了。

是不是就设置一下8-12G内存就 ok了呢？当然我们还是要分析一下为什么会OOM，到底什么占用了内存？是不是有内存泄露？是个例还是很多类似的？

使用 salt  全量统计了一下所有NodeManager日志关键字段，发现并不是个例有其他节点也存在 NodeManager OOM 的情况，找到另外一个节点来check一下（该节点其实GC不过来，已经卡死了）。

## 3.

首先是保留一些信息：

1、保留堆栈信息：

jstack 31549 >nm-31459.jstack1;

sleep 2s; 

jstack 31549 >nm-31459.jstack2;

sleep 5s; 

jstack 31549 > nm-31459.jstack3;



2、保留句柄

lsof -p  31549 >  nm-31459.fd



3、check 一下GC

jstat -gcutil 分析的gc 情况.



图片



4、jmap 看一下内存情况：

jmap -histo 31549 >jmap-nm-31549.jmap



5、dump 内存

jmap -dump:format=b,file=nm-31549.heap.bin 31549



check 下 jmap 的信息



图片

发现有大量的LocalCache 对象以及ShuffleIndexInformation

ps：

[B 是指byte[] 数组

[C 是char[] 数组 

一般 Java 进程 jmap 大部分都是 byte[],char[],String 这些，是比较正常的通常看不出来什么，基本上没啥关系。

主要怀疑对象在 ShuffleIndexInformation 和 LocalCache 上面



check 了一下代码，发现 Hadoop 中并没有这个代码。

从名字看这块肯定是 Shuffle 相关的，所以自然而然就想到了Spark Shuffle Service 。这里简单说一下，通常 Shuffle 是在 Executor 中的，executor 挂的话，就会导致shuffle 数据丢失失败，所以spark 后来做了 Shuffle Service，原理是将 Shuffle 放到 NodeManager 中来做，NodeManager 一般不忙，用来做 Shuffle 也是可以的，这样的话，Executor 挂了，NodeManager 其实还在的，有一定的稳定性提高，当然现在还有一个 Shuffle 思路是将 shuffle 做成单独的服务放在外面，这是另外的一个话题了。



查看 Spark 代码，Spark Shuffle Service 的代码在 NodeManager 中跑，ExternalShuffleBlockResolver 内部有一个

LoadingCache<File, ShuffleIndexInformation> shuffleIndexCache
该 cache 主要是用于 cache shuffle 的 index 信息。

cache 默认配置的是100m，由参数spark.shuffle.service.index.cache.size来配置。

查看当前配置发现是4096m

grep  -A 1 "spark.shuffle.service.index.cache.size" /etc/apps/hadoop-conf/yarn-site.xml
 <name>spark.shuffle.service.index.cache.size</name>
 <value>4096m</value>
当前 NodeManager 配置也就 4096m，所以当 cache 到一定程度的时候，oom 就可想而知了。



cache 相关代码设置如下：

ExternalShuffleBlockResolver(
      TransportConf conf,
      File registeredExecutorFile,
      Executor directoryCleaner) throws IOException {
    this.conf = conf;
    this.registeredExecutorFile = registeredExecutorFile;
    String indexCacheSize = conf.get("spark.shuffle.service.index.cache.size", "100m");
    CacheLoader<File, ShuffleIndexInformation> indexCacheLoader =
        new CacheLoader<File, ShuffleIndexInformation>() {
          public ShuffleIndexInformation load(File file) throws IOException {
            return new ShuffleIndexInformation(file);
          }
        };
    shuffleIndexCache = CacheBuilder.newBuilder()
      .maximumWeight(JavaUtils.byteStringAsBytes(indexCacheSize))
      .weigher(new Weigher<File, ShuffleIndexInformation>() {
        public int weigh(File file, ShuffleIndexInformation indexInfo) {
          return indexInfo.getSize();//这块计算其实是有点问题的
        }
      })
      .build(indexCacheLoader);


对 dump 出来的内存进行分析发现也是与上面的结论是一致的：

发现4G内存，shuffleIndexCache 就占用了3.7G



图片

图片



check 了代码其实感觉代码还是有一些改进的地方的：

具体见注释

    shuffleIndexCache = CacheBuilder.newBuilder()
      .maximumWeight(JavaUtils.byteStringAsBytes(indexCacheSize))
      .weigher(new Weigher<File, ShuffleIndexInformation>() {
        public int weigh(File file, ShuffleIndexInformation indexInfo) {
          //return indexInfo.getSize();
          //这块计算其实是有点问题的，只计算了indexInfo文件size ，其实有会有ovehead的
          //当然这个问题主要看应该不是overhead，而是堆内存一共就配置了4096m，而cache 也配置了这么大。
          //实际上cache 是会超过配置的值的，比如文件多，但是index文件内容比较少的情况下。
          //这块代码做了一点点稍微小小的改动，具体其实是可以参考HBase d等代码来实际计算java对象大小。
          // 不过这块没有太大必要这么细，但是还是需要考虑overhead
          //当然对于index.cache.size 设置成256m的话，内存8G的NM的话，即使有8倍的overhead，其实问题也不大。
          //我们这里设置成了512m
           return file.getAbsolutePath().length() + 128+file indexInfo.getSize();
          

        }
      })
最终做了如下三个修改：

1.修改 spark.shuffle.service.index.cache.size=512m

 2.同时修改NodeManager 内存为10240m（10G）

 3.同时对shuffleIndexCache内存占用的计算做了一些小小的修正（这里不是主要原因，这次主要还是内存配置于cache.size不匹配导致的，但是内存配置即使比较大的情况下，如果shuffleIndexCache配置也比较大，也有可能会出现可能shuffleIndexCache配置2g，实际上shuffleIndexCache占用远大于2g的情况会出现问题，所以规避一下风险。



修改以后任务稳定了很多。



观察了一段时间，发现再也没有 NodeManager OOM了



后来搜了一下社区，确实有类似的关于 shuffleIndexCache 内存计算的改进的改进。相关jira：

https://issues.apache.org/jira/browse/SPARK-21501

https://issues.apache.org/jira/browse/SPARK-33206
