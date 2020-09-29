---
layout: post
title: 在 Spark SQL 使用 REPARTITION Hint 来减少小文件输出
description: 在 Spark SQL 使用 REPARTITION Hint 来减少小文件输出
categories: [Spark]
keywords: Spark SQL
excerpt: 在 Spark SQL 使用 REPARTITION Hint 来减少小文件输出
---



## 1. 问题

公司数仓业务有一个 `sql` 任务，每天会产生大量的小文件，每个文件只有几 `M` 大小，小文件过多会对 `HDFS` 性能造成比较大的影响，同时也影响数据的读写性能（Spark 任务某些情况下会缓存文件信息），虽然开发了小文件合并工具会去定期合并小文件，但还是想从源头上来解决这个问题，尽量生成比较合适的文件大小，而不是事后补救。

下图是优化前一天 18 点这个分区的数据，可以看出小文件问题明显。

![small-files](/images/posts/spark/spark-repartition-small-files/small-files.png)





## 2. 分析

思路：

1、统计每次生成的文件大小

2、每个小文件的大小

3、预期文件大小

4、找到优化方法，使其满足预期大小



统计一下每个分区的数据量，差不多每个小时 `1-6G` 数据

```shell
$  hdfs dfs -du -h  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/
3.4 G  10.2 G  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=00
2.1 G  6.3 G   hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=01
1.4 G  4.3 G   hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=02
1.1 G  3.4 G   hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=03
1.2 G  3.6 G   hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=04
1.8 G  5.5 G   hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=05
3.1 G  9.3 G   hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=06
3.8 G  11.4 G  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=07
3.8 G  11.5 G  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=08
3.9 G  11.6 G  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=09
4.1 G  12.2 G  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=10
4.6 G  13.7 G  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=11
5.4 G  16.3 G  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=12
4.7 G  14.0 G  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=13
4.1 G  12.4 G  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=14
4.1 G  12.3 G  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=15
4.1 G  12.4 G  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=16
4.5 G  13.4 G  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=17
4.6 G  13.8 G  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=18
5.0 G  15.1 G  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=19
5.5 G  16.6 G  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=20
6.1 G  18.4 G  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=21
6.2 G  18.7 G  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=22
5.0 G  15.1 G  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=23
```

使用 `hour=18` 这个分区举例：

```shell
$  hdfs dfs -ls -h -R  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=18|wc -l
800
```

可以看出有 `800` 个文件。

详细看一下文件大小，有一半是 `9.2M` 左右和一半`2.6M`左右(实际是由 UNION ALL 分别生成 400个 )，其他就不列出来了.

```shell
9.2 M  27.6 M  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=18/part-00397-13c5757b-294b-4010-a0f7-bbb7100455c8.c000
9.3 M  27.8 M  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=18/part-00398-13c5757b-294b-4010-a0f7-bbb7100455c8.c000
9.2 M  27.5 M  hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=18/part-00399-13c5757b-294b-4010-a0f7-bbb7100455c8.c000
2.6 M  7.7 M   hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=18/part-00400-13c5757b-294b-4010-a0f7-bbb7100455c8.c000
2.6 M  7.7 M   hdfs://dw/test.db/testtable/p1=a/dt=2020-09-28/hour=18/part-00401-13c5757b-294b-4010-a0f7-bbb7100455c8.c000
```

文件由 `SQL ETL` 生成，清洗入库的`sql` 如下： 

```sql
INSERT
	overwrite TABLE testdb.testtable PARTITION (p1, dt, hour)
SELECT
	...
FROM
	t1
UNION ALL
SELECT
	...
FROM
	t2
  
```

上面是很典型的一个业务，定时向某个时间点的分区导入数据。

从上面的sql 可以看出 `2` 个重要信息：

1、数据表有三个分区字段 `p1,dt,hour` 其中 `dt` 表示日期，`hour` 表示小时.

2、 `insert overwrite SELECT` 导入，有 `1` 个 `UNION ALL`  



查看 `Spark` 作业 参数，发现

```sql
spark.sql.shuffle.partitions=400
```

400 个 partition 导致 2 个表 UNION ALL  加起来一共 800 个文件。如上解释了，为什么每次都生成800个文件（400+400）

我们理想的文件大小是保持在100-200M（建议略小于等于BLOCK 大小），比如HDFS BLOCK为128MB，则可以按照100M左右去算。

目前每小时是1-6G数据量。





## 3. 优化



Spark SQL 支持 使用 ` /*+ REPARTITION(N) */ ` hint 来重新 `repartition` 数据,

我们设置  `40/20个PARTITION` 



```sql
INSERT
	overwrite TABLE testdb.testtable PARTITION (a, dt, hour)
SELECT
/*+ REPARTITION(40) */
	...
FROM
	t1
UNION ALL
SELECT
/*+ REPARTITION(20) */
	...
FROM
	t2
```

优化以后，我们发现今天新生成的数据文件明显变大，大小都在95M 左右，小文件问题解决了。

![small-files](/images/posts/spark/spark-repartition-small-files/big-files.png)





**思考：**

是否通过设置如下参数  `spark.sql.shuffle.partitions=40`  解决这个问题，区别是什么？



## 参考文档

1. https://spark.apache.org/docs/3.0.1/sql-ref-syntax-qry-select-hints.html