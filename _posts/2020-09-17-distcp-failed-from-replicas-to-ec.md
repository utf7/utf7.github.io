---
layout: post
title: Hadoop Distcp 拷贝三副本到纠删码目录失败
description: Hadoop Distcp 拷贝三副本到纠删码目录失败 
categories: [Hadoop]
keywords: HDFS,Hadoop,distcp
excerpt: Hadoop Distcp 拷贝三副本到纠删码目录失败
---



### 问题：



在 hadoop 3 发起 distcp 命令拷贝另外一个集群的数据到本集群

src 集群 hdfs 目录存储为三副本

target 集群为 ec纠删码

distcp 命令

```hadoop distcp -Dmapreduce.job.queuename=root.default  hdfs://src/test.db/testtable hdfs://target/ec/```



```verilog
20/09/17 21:56:53 INFO mapreduce.Job: Task Id : attempt_1600259371672_0003_m_000012_2, Status : FAILED
Error: java.io.IOException: File copy failed: hdfs://src/test.db/testtable/day=2020-09-13/part-00004-c5efd5dc-ca97-4716-b14a-944a5223099a-c000 --> hdfs://target/ec/day=2020-08-13/part-00004-c5efd5dc-ca97-4716-b14a-944a5223099a-c000
	at org.apache.hadoop.tools.mapred.CopyMapper.copyFileWithRetry(CopyMapper.java:263)
	at org.apache.hadoop.tools.mapred.CopyMapper.map(CopyMapper.java:220)
	at org.apache.hadoop.tools.mapred.CopyMapper.map(CopyMapper.java:48)
	at org.apache.hadoop.mapreduce.Mapper.run(Mapper.java:146)
	at org.apache.hadoop.mapred.MapTask.runNewMapper(MapTask.java:799)
	at org.apache.hadoop.mapred.MapTask.run(MapTask.java:347)
	at org.apache.hadoop.mapred.YarnChild$2.run(YarnChild.java:174)
	at java.security.AccessController.doPrivileged(Native Method)
	at javax.security.auth.Subject.doAs(Subject.java:422)
	at org.apache.hadoop.security.UserGroupInformation.doAs(UserGroupInformation.java:1730)
	at org.apache.hadoop.mapred.YarnChild.main(YarnChild.java:168)
Caused by: java.io.IOException: Couldn't run retriable-command: Copying hdfs://src/test.db/testtable/day=2020-09-13/part-00004-c5efd5dc-ca97-4716-b14a-944a5223099a-c000 to hdfs://target/ec/testtable/day=2020-09-13/part-00004-c5efd5dc-ca97-4716-b14a-944a5223099a-c000
	at org.apache.hadoop.tools.util.RetriableCommand.execute(RetriableCommand.java:101)
	at org.apache.hadoop.tools.mapred.CopyMapper.copyFileWithRetry(CopyMapper.java:259)
	... 10 more
Caused by: java.io.IOException: Checksum mismatch between hdfs:hdfs://src/test.db/testtable/day=2020-09-13/part-00004-c5efd5dc-ca97-4716-b14a-944a5223099a-c000 and hdfs://target/ec/.distcp.tmp.attempt_1600259371672_0003_m_000012_2.
	at org.apache.hadoop.tools.util.DistCpUtils.compareFileLengthsAndChecksums(DistCpUtils.java:641)
	at org.apache.hadoop.tools.mapred.RetriableFileCopyCommand.doCopy(RetriableFileCopyCommand.java:146)
	at org.apache.hadoop.tools.mapred.RetriableFileCopyCommand.doExecute(RetriableFileCopyCommand.java:115)
	at org.apache.hadoop.tools.util.RetriableCommand.execute(RetriableCommand.java:87)
	... 11 more
```



### 解决办法：

由于不同的 EC 策略文件，因为其校验值不同而导致Distcp 任务失败

加上 **`-skipcrccheck`** 参数

```shell
 $ hadoop distcp -Dmapreduce.job.queuename=root.default  -skipcrccheck hdfs://src/test.db/testtable hdfs://target/ec/
```


