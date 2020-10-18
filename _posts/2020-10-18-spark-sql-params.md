
spark-sql 

使用spark-sql 导入动态分区时，出现来错误 提示增加  hive.exec.max.dynamic.partitions=1000000 的值，
可是我明明通过 --conf  hive.exec.max.dynamic.partitions=1000000 为什么还是报错了？
原来 hive的参数是通过 --hiveconf 来传递的

使用 --conf 来传递 `spark` 参数
使用 --hiveconf 来传递 `hive` 参数
修改后为：

```shell
nohup spark-sql  --master yarn  --deploy-mode client --queue root.test.myqueue  --driver-memory 24g   --executor-cores 2   --executor-memory 4g   --num-executors 256   --conf spark.driver.memoryOverhead=1g   --conf spark.executor.memoryOverhead=1g   --conf spark.speculation=false --conf spark.driver.maxResultSize=12g --conf spark.sql.hive.filesourcePartitionFileCacheSize=4621440000 --conf spark.sql.files.maxPartitionBytes=268435456 --conf spark.sql.files.openCostInBytes=0 --conf spark.sql.shuffle.partitions=512 --hiveconf hive.exec.max.dynamic.partitions=1000000 --hiveconf hive.exec.max.dynamic.partitions.pernode=100000 --hiveconf hive.exec.max.created.files=1000000 -S -e "insert overwrite table tt partition(day,hour) select * from table1 where day<='2020-10-11' distribute by day,hour , cast( floor(rand() * 8) as int);"  > merge.log 2>&1 & 
```
