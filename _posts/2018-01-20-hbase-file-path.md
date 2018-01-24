---
layout: post
title: HBase 文件路径
description: HBase 文件夹路径以及作用详解
categories: HBase
keywords: HBase,big data
---


# HBase 文件路径
  
本篇将分析 HBase 中的目录以及对应的作用，基于 Apache-HBase 1.2.6

HBase 的数据文件、WAL、快照文件等信息会存储在 HDFS 中，HBase 在 HDFS 的根目录由 hbase.rootdir 参数决定,如下配置 /hbase/data

查看 HDFS 中的目录可看到如下几个目录

> 
/hbase/data/.hbase-snapshot  
/hbase/data/.tmp  
/hbase/data/MasterProcWALs  
/hbase/data/WALs  
/hbase/data/archive  
/hbase/data/corrupt  
/hbase/data/data  
/hbase/data/hbase.id  
/hbase/data/hbase.version  
/hbase/data/oldWALs  


## .hbase-snapshot 目录 

hbase 快照信息目录，保存快照信息 
/hbase/data/.hbase-snapshot/.tmp
/hbase/data/.hbase-snapshot/table1_sp/.inprogress
/hbase/data/.hbase-snapshot/table1_sp/.snapshotinfo		
/hbase/data/.hbase-snapshot/table1_sp/data.manifest   存储数据文件信息

#### .snapshotinfo 文件

存储快照描述信息
包括表名，快照名称，类型（0:DISABLE 1:FLUSH 2:SKIPFLUSH，默认为 1）


#### data.manifest 文件
存储了表结构定义
以及 region 信息和列簇以及 HFile 信息格式为：
namespace+table+(startkey,endkey)+CF+hfile名称列表
hfile 名称列表是如何找到对应的HFile（archive目录和未compcation之前回去实际表目录去找，什么逻辑？）

![](/images/posts/hbase/hbase-file-path/hbase_snapshot_data.manifest.jpg "data.manifest")

## .tmp 目录
.tmp 目录为 HBase 的临时目录

TODO : 需要梳理具体放哪些数据，/root/干什么的

## MasterProcWALS 目录

该目录为 procedure2 放置 wal 目录使用的目录， procedure2 主要用于 DDL 操作，原理是实现了一个 2 阶段提交的事务，将一些 DDL 操作分为多个步骤，将各个步骤信息存储起来，用于处理如 HMaster 中断导致的 DDL 无法执行、回滚问题，目前实现了 `CreateTable、DeleteColumnFamily、DeleteTable、 EnableTable、ModifyTable、ModifyColumnFamily、TruncateTable` 等功能，具体请参考：
[https://issues.apache.org/jira/browse/HBASE-12439](https://issues.apache.org/jira/browse/HBASE-12439 "HBASE-12439")

## WALS 目录
存放 WAL 日志，WAL 日志为 HBase 的预写日志，写入 Memstore 之前先写 WAL
WAL 存储再 HDFS 中，当发生 RegionServer 宕机重启后，RS 会读取 HDFS中的 WAL 进行 REPLAY 回放从而实现故障恢复。
WAL 类似 MySQL 的 BinLog ，从数据安全的角度，建议开启 WAL   
下图是WAL 日志中的一个存储截图：
![](/images/posts/hbase/hbase-file-path/hbase_wal_hdfs_path.png "WAL 日志路径")

wal 日志路径为 hbase.rootdir/WALs/serverName/URLEncoder.encode(serverName).default.Timestamp
WAL 日志的命名规则如下
![](/images/posts/hbase/hbase-file-path/hbase_wal_name.png "WAL 日志命名规则")

注意 meta 表使用单独的 WAL 日志保存

每个 RegionServer 会有多个 WAL 目录，达到大小后就不停滚动生成。 超过阈值会被 move 到 oldWALs 下面


相关 WAL 日志生成的代码，可参考 WALProvider.java 以及 FSHLog.java 两个类


## archive 目录

archive 目录为 HFile archive 目录

1、保存 snapshot 中的 HFile

## corrupt 目录

此目录用于放置损坏的 HFile，执行 HBCK 的时候，如果指定了 -checkCorruptHFiles 或者 
-sidelineCorruptHFiles 参数，则会调用 HFileCorruptionChecker 对表的 region 的列簇下的 HFile 进行检查，调用 reader 读取下面的表的 HFILE。此时如果发现 HFILE 损坏的话，
1）如果指定的是 -sidelineCorruptHFiles 参数则会将 HFILE move 到此目录，移动的路径为 HBASE_DIR/corrupt/table/region/cf/hfile。
2)如果只是 -checkCorruptHFiles 未指定 -sidelineCorruptHFiles, 则不会移动，仅仅打印损坏的文件信息
  
HBaseFsck.java  
```java
  // if corrupt file mode is on, first fix them since they may be opened later
      if (checkCorruptHFiles || sidelineCorruptHFiles) {
        LOG.info("Checking all hfiles for corruption");
        HFileCorruptionChecker hfcc = createHFileCorruptionChecker(sidelineCorruptHFiles);
        setHFileCorruptionChecker(hfcc); // so we can get result
        Collection<TableName> tables = getIncludedTables();
        Collection<Path> tableDirs = new ArrayList<Path>();
        Path rootdir = FSUtils.getRootDir(getConf());
        if (tables.size() > 0) {
          for (TableName t : tables) {
            tableDirs.add(FSUtils.getTableDir(rootdir, t));
          }
        } else {
          tableDirs = FSUtils.getTableDirs(FSUtils.getCurrentFileSystem(getConf()), rootdir);
        }
        hfcc.checkTables(tableDirs);
        hfcc.report(errors);
      }
```
HFileCorruptionChecker.checkTables（Path）
```java
分别调用 : checkTables->checkTableDir->checkRegionDir->checkColFamDir-checkHFile

  protected void checkHFile(Path p) throws IOException {
    HFile.Reader r = null;
    try {
      r = HFile.createReader(fs, p, cacheConf, conf);
    } catch (CorruptHFileException che) {
      LOG.warn("Found corrupt HFile " + p, che);
      corrupted.add(p);
      //inQuarantineMode 由sidelineCorruptHFiles参数决定，指定了则为true，默认为false
      if (inQuarantineMode) {
        //损坏的目录路径为：HBASE_DIR/corrupt/table/region/cf/hfile
        Path dest = createQuarantinePath(p);
        LOG.warn("Quarantining corrupt HFile " + p + " into " + dest);
        boolean success = fs.mkdirs(dest.getParent());
        //将损坏的hfile移动到corrupt 目录
        success = success ? fs.rename(p, dest): false;
        if (!success) {
          failures.add(p);
        } else {
          quarantined.add(dest);
        }
      }
      return;
    } catch (FileNotFoundException fnfe) {
      LOG.warn("HFile " + p + " was missing.  Likely removed due to compaction/split?");
      missing.add(p);
    } finally {
      hfilesChecked.addAndGet(1);
      if (r != null) {
        r.close(true);
      }
    }
  }

```

