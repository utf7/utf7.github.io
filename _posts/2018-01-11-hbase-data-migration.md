---
layout: post
title: HBase 数据迁移
description: HBase 数据迁移方法
categories: HBase
keywords: HBase，数据迁移,big data
---

本文介绍 HBase 常见的适合大数据量的迁移方法:DISTCP、SNAPSHOT  
  
  

- 1、DSTCP+FIX 元数据信息  

- 2、SNAPSHOT快照导出迁移  
 

## **DISTCP迁移**

DISTCP的思路是，直接通过DISTCP拷贝HBase 的目录文件到目标集群，  
然后在目标集群通过hbase提供的hbck 工具来执行元数据修复
	
案例：
0.94.11 版本迁移到1.1.3，0.94.11 版本是2013年的版本，是非常老的一个版本。
社区从0.96版本开始 HBase 序列化协议和目录结构发生了变化
其它版本的迁移，理论上也都可以按照此步骤来，只不过步骤2，3可能不需要

解决步骤：
确保网络互通，两个集群的 /etc/hosts 配置主机名映射

如下所在步骤在新集群操作
 
1、首先distcp 拷贝表目录
2、创建表描述文件目录
3、移动表描述文件到如上目录
4、修改权限
5、修改所属用户
6、修复表 执行hbase hbck -fixMeta -fixAssignments
7、登陆hbase shell 执行describe/count/scan 操作验证
      数据量大的表建议使用hbase提供的MR RowCounter 工具进行统计：
     hbase org.apache.hadoop.hbase.mapreduce.RowCounter 'testTable' 

1-5 步骤使用hdfs 用户执行命令：

hadoop distcp   hftp://original_namenode1:port/hbase/test hdfs://new_namenode:8020/apps/hbase/data/data/default/
hdfs dfs -mkdir /apps/hbase/data/data/default/test/.tabledesc
hdfs dfs -mv /apps/hbase/data/data/default/test/.tableinfo.0000000001 /apps/hbase/data/data/default/test/.tabledesc/
hdfs dfs -chmod -R 755 /apps/hbase/data/data/default/test
hdfs dfs -chown -R hbase:hdfs /apps/hbase/data/data/default/test

6-7 切换到hbase 用户执行：

hbase hbck -fixMeta  -fixAssignments test


## **SNAPSHOT快照迁移**

HBase 支持快照功能以及快照导出功能，组合利用此功能可以实现数据迁移。

总体思路：
1、启用快照配置
2、原集群执行快照，然后执行ExportSnapshot 导出到老集群。注意权限问题。
3）导出后，修改对应的权限，然后执行恢复即可

注意点：
1、注意文件目录权限
2、注意配置各自的hostname和IP映射
3、注意压缩库是否都配置了

新集群：

1）检查新老集群配置snappy压缩支持(可选，因为有些新老集群压缩不一定支持）
在HC的hbase-env.sh中添加如下属性：
```bash export JAVA_LIBRARY_PATH=/usr/lib/hadoop/lib/native/Linux-amd64-64:/usr/lib/hadoop/lib/native
```
默认加载hadoop的native类库。
2）检查是否启用快照
hbase-site.xml中：
hbase.snapshot.enabled为true
4)检查快照和压缩可用性（hbase 用户执行）
（注意本步骤必不可少，即使知道快照和压缩已经可用，因为需要此步骤来自动生成 /apps/hbase/data/.hbase-snapshot 目录）
```bash
su - hbase
hbase>create 'test_tmp_2017', {NAME => 'c1', DATA_BLOCK_ENCODING => 'NONE', BLOOMFILTER => 'ROW', REPLICATION_SCOPE => '0', VERSIONS => '1', COMPRESSION => 'SNAPPY', MIN_VERSIONS => '0',
TTL => '2147483647', KEEP_DELETED_CELLS => 'false', BLOCKSIZE => '65536', IN_MEMORY => 'false', BLOCKCACHE => 'true'}
hbase>flush ’test_tmp_2017'
hbase>snapshot ’test_tmp_2017', ’test_tmp_2017_sp'
hbase>list_snapshots
hbase>delete_snapshot ’test_tmp_2017_sp'
```
5)修改新集群快照目录权限（hdfs用户执行）
原集群为olduser用户，执行快照导出的时候，由于没有权限会导致导入失败。
导出快照前，需要执行如下权限：
```bash
su - hdfs
hdfs dfs -chmod -R 777 /apps/hbase/data/.hbase-snapshot ;
hdfs dfs -chmod -R 777 /apps/hbase/data/archive ;
```  
如下步骤发生到老集群导入后：
6）修改导出快照文件和信息的权限(hbase:hdfs)
导入后为olduser用户权限，需要修改如下
```bash
hdfs dfs -chmod -R 755 /apps/hbase/data/.hbase-snapshot;
hdfs dfs -chmod -R 755 /apps/hbase/data/archive ;
hdfs dfs -chown -R hbase:hadoop /apps/hbase/data/.hbase-snapshot;
hdfs dfs -chown -R hbase:hadoop /apps/hbase/data/archive ;
```
11）恢复快照(hbase用户执行）
```bash
hbase>list_snapshots
hase>restore_snapshot 'snapshot_name'
```
12）检查快照恢复后的表是否可用
（a)先简单 hbase> scan 'tablename',{LIMIT => 10}
(b)后面再使用hbase canary扫描全部的表
(c)统计行数
```bash
su - hdfs
hdfs dfs -mkdir -p /user/hbase;
hdfs dfs -chown -R hbase:hdfs /user/hbase;
su - hbase
export HADOOP_HOME=/usr/lib/hadoop;export HBASE_HOME=/usr/lib/hbase;export HADOOP_CLASSPATH=`${HBASE_HOME}/bin/hbase classpath`; ${HADOOP_HOME}/bin/hadoop jar /usr/lib/hbase/lib/hbase-server-1.1.3.jar rowcounter <tableName>
```
原集群
7）修改原集群的hbase.rootdir配置，在NameNode HA的情况下，原来的hbase.rootdir配置写的有问题，不需要nameservice 不需要端口
```xml 
<property>
<name>hbase.rootdir</name>
<value>hdfs://cluster1:8020/hbase</value>
</property>
```
修改为
```xml  
<property>
<name>hbase.rootdir</name>
<value>hdfs://cluster1/hbase</value>
</property>
```
8）添加新集群IP和主机名映射
将新集群的/etc/hosts中主机名和IP映射添加到老集群所有节点。（ExportSnapshot MR要用到）
9）对所有需要的历史表执行快照，快照命名规则为tablename_sp_YYYYMMDDHHMMmm
```bash
snapshot 'tablename','tablename_sp_20170821112930'
```
10）从老集群导出快照到新集群
```bash
hbase>flush 'tablename'
hbase --config /usr/lib/hadoop/etc/hadoop:/usr/lib/hbase/conf/ org.apache.hadoop.hbase.snapshot.ExportSnapshot -snapshot {snapshotname} -copy-to
{hbase.rootdir}
```  
第一个参数为快照名称，第二个参数为新集群中hbase-site.xml中配置的hbase根目录
备注：
如果exportSnapshot执行失败，则需要在新集群删除
```
hdfs dfs -rm -r /apps/hbase/data/.hbase-snapshot/.tmp/snapshotname
```
删除对应的临时目录



常见错误：
 
1、执行ExportSnapshot 报Wrong FS错误
NN HA不需要加端口，只需要dfs.nameservices

```bash
hbase --config /usr/lib/hadoop/etc/hadoop:/usr/lib/hbase/conf/ org.apache.hadoop.hbase.snapshot.ExportSnapshot -snapshot test_export -copy-to file:///home/old_user
```

>Exception in thread "main" java.lang.IllegalArgumentException: Wrong FS: hdfs://cluster1:8020/hbase/.hbase-snapshot/test_export/.snapshotinfo, expected: hdfs://cluster1

```xml
<property>
<namehbase.rootdir></name>
<value>hdfs://cluster1:8020/hbase</value>
</property>
``` 
修改为
```xml 
<property>
<name>hbase.rootdir</name>
<value>hdfs://cluster1/hbase</value>
</property>
```
  

  
2、执行快速结束了，没有MR信息
 

> Exception in thread "main" org.apache.hadoop.hbase.snapshot.ExportSnapshotException: Failed to copy the snapshot directory: from=hdfs://cluster1/hbase/.hbase-snapshot/test_snapshot to=hdfs://new_cluster:8020/tmp/export/.hbase-snapshot/.tmp/test_snapshot
at org.apache.hadoop.hbase.snapshot.ExportSnapshot.run(ExportSnapshot.java:742)
at org.apache.hadoop.util.ToolRunner.run(ToolRunner.java:70
at org.apache.hadoop.hbase.snapshot.ExportSnapshot.innerMain(ExportSnapshot.java:800)
at org.apache.hadoop.hbase.snapshot.ExportSnapshot.main(ExportSnapshot.java:804)
 

原因是导出新集群的目录没有权限（此处并没有报出错误信息）
```bash
hdfs dfs -chmod 777 /tmp/export
```
3、UnknownHostException

>17/08/18 16:14:51 INFO mapreduce.Job: Task Id : attempt_1503041014815_0006_m_000000_0, Status : FAILED
Error: java.lang.IllegalArgumentException: java.net.UnknownHostException: new_cluster at org.apache.hadoop.security.SecurityUtil.buildTokenService(SecurityUtil.java:377)
at org.apache.hadoop.hdfs.NameNodeProxies.createNonHAProxy(NameNodeProxies.java:237)
at org.apache.hadoop.hdfs.NameNodeProxies.createProxy(NameNodeProxies.java:141)
at org.apache.hadoop.hdfs.DFSClient.<init>(DFSClient.java:576)
at org.apache.hadoop.hdfs.DFSClient.<init>(DFSClient.java:521)
at org.apache.hadoop.hdfs.DistributedFileSystem.initialize(DistributedFileSystem.java:146)
at org.apache.hadoop.fs.FileSystem.get(FileSystem.java:368)
at org.apache.hadoop.hbase.snapshot.ExportSnapshot$ExportMapper.setup(ExportSnapshot.java:142)
....
 Caused by: java.net.UnknownHostException: new_cluster
 
 
将新集群的IP和主机名 添加到原集群中。
  
4、导入失败
 
>Exception in thread "main" org.apache.hadoop.hbase.snapshot.ExportSnapshotException: Failed to copy the snapshot directory: from=hdfs://cluster1/hbase/.hbase-snapshot/test_snapshot to=hdfs://new_cluster:8020/apps/hbase/data/.hbase-snapshot/.tmp/test_snapshot at org.apache.hadoop.hbase.snapshot.ExportSnapshot.run (ExportSnapshot.java:742)
at org.apache.hadoop.util.ToolRunner.run(ToolRunner.java:70)
at org.apache.hadoop.hbase.snapshot.ExportSnapshot.innerMain(ExportSnapshot.java:800)
at org.apache.hadoop.hbase.snapshot.ExportSnapshot.main(ExportSnapshot.java:804)
 
原来的老集群的用户old_user没有权限，导入新集群(hbase:hdfs)
 
chmod 777 /apps/hbase/data/.hbase-snapshot snapshot描述信息目录
 
chmod 777 /apps/hbase/data/archive 实际数据文件目录
   
4、导出快照目录路径问题

导出快照的路径不是随便写的，不然目的集群找不到快照名称。
 
路径应该为新集群的hbase.rootdir
 
导入的快照会在hbase.rootdir/.hbase-snapshot 中，该目录刚开始是没有的，需要在新集群，随便生生个表，然后执行一次快照即会出现。
  
5、快照 may be in-progress
 

>A snapshot with the same name 'test_snapshot' may be in-progress
Please check hdfs://new_cluster:8020/apps/hbase/data/.hbase-snapshot/.tmp/test_snapshot. If the snapshot has completed,
consider removing hdfs://new_cluster:8020/apps/hbase/data/.hbase-snapshot/.tmp/test_snapshot before retrying export
 
原因是上次导出快照失败后，仍然会残留信息
删除新集群的/apps/hbase/data/.hbase-snapshot/.tmp/test_snapshot 重新执行
  
6、恢复权限时候报错：
 
>Caused by: org.apache.hadoop.ipc.RemoteException(org.apache.hadoop.security.AccessControlException): Permission denied: user=hbase, access=WRITE, inode="/apps/hbase/data/archive/data/default/test/55920779ef2f781d7b1195862a81e7b9/c1/.links-6186277fd0e14bcb98020b41437580fc":e3base:hdfs:drwxr-xr-x
  
导入的时候，是使用导入用户的权限。需要授权
7、snappy 报错
配置snappy压缩支持：
在HC的hbase-env.sh中添加如下属性：
```bash
export JAVA_LIBRARY_PATH=/usr/lib/hadoop/lib/native/Linux-amd64-64:/usr/lib/hadoop/lib/native
```
8、ClassNotFoundException：
>java.lang.ClassNotFoundException：org.apache.hbadoop.hbase.codec.prefixetree.PrefixTreeCodec....

yarn-site.xml中的yarn.application.classpath 添加hbase /lib 目录路径
mapred-site.xml中的mapreduce.application.classpath 添加hbase /lib 目录路径
尝试使用类似如下命令去执行hbase MR
```bash
export HADOOP_HOME=/usr/lib/hadoop;export HBASE_HOME=/usr/lib/hbase;export HADOOP_CLASSPATH=`${HBASE_HOME}/bin/hbase classpath`; ${HADOOP_HOME}/bin/hadoop jar /usr/lib/hbase/lib/hbase-server-1.1.3.jar rowcounter testtable
```


----------


注意线上环境执行distcp或者snapshot 需要限制带宽。可通过设置map数以及限制每个map的带宽来实现。

限制带宽方法请执行如下命令查看帮助

```bash
hadoop distcp
```
>-bandwidth <arg>              Specify bandwidth per map in MB  
>-m <arg>                      Max number of concurrent maps to use for copy  

```bash 
hbase org.apache.hadoop.hbase.snapshot.ExportSnapshot
```
>-mappers                Number of mappers to use during the copy   (mapreduce.job.maps).  
>-bandwidth              Limit bandwidth to this value in MB/second.