---
layout: post
title: Spark SQL 正确的传递 Hive 参数
description: Spark SQL 传递 Hive 参数
categories: [Spark]
keywords: Spark SQL
excerpt: Spark SQL 正确的传递 Hive 参数
---

使用 `spark-sql` 导入动态分区时，出现来错误 
```log
Error in query: org.apache.hadoop.hive.ql.metadata.HiveException: Number of dynamic partitions created is 1793, which is more than 1000. To solve this try to set hive.exec.max.dynamic.partitions to at least 1793.;
```
提示增加 `hive.exec.max.dynamic.partitions` 的值，
可是我明明通过 `--conf  hive.exec.max.dynamic.partitions=1000000` 为什么还是报错了？难道是参数没有传递进去？？？
执行 `spark-sql --help` ，通过查看 `spark-sql` 的帮助

原来 hive的参数是通过 `--hiveconf` 来传递的而不是 `--conf`

使用 `--conf` 来传递 `spark` 参数
使用 `--hiveconf` 来传递 `hive` 参数
修改后为：

```shell
nohup spark-sql  --master yarn  --deploy-mode client --queue root.test.myqueue  --driver-memory 24g   --executor-cores 2   --executor-memory 4g   --num-executors 256   --conf spark.driver.memoryOverhead=1g   --conf spark.executor.memoryOverhead=1g   --conf spark.speculation=false --conf spark.driver.maxResultSize=12g --conf spark.sql.hive.filesourcePartitionFileCacheSize=4621440000 --conf spark.sql.files.maxPartitionBytes=268435456 --conf spark.sql.files.openCostInBytes=0 --conf spark.sql.shuffle.partitions=512 --hiveconf hive.exec.max.dynamic.partitions=1000000 --hiveconf hive.exec.max.dynamic.partitions.pernode=100000 --hiveconf hive.exec.max.created.files=1000000 -S -e "insert overwrite table tt partition(day,hour) select * from table1 where day<='2020-10-11' distribute by day,hour , cast( floor(rand() * 8) as int);"  > merge.log 2>&1 & 
```
