---
layout: post
title: HBase Region 重叠问题处理
description: HBase Region 重叠问题处理
categories: [HBase]
keywords: HBase,Region,Overlap,HFile
excerpt: HBase,Region,Overlap,HFile
---

#  HBase Region 重叠问题处理



最近某应用反馈 `HBase` 数据插入数据后、查询出现错误数据

现象如下：

有一行数据：

前面时间 `T1` ：插入3列

后面时间 `T2` ：插入`1` 列（通过 `put` 新值来更新某列数据）

`scan` 操作只能看到 时间点T1的 `3` 列数据，

`get` 操作只能看到时间点 `T2` 的 `1` 列最新数据


**具体例子：**

有一行数据数据 `rowkey` 是 `591420001`（还有一些时间戳字段省略），有3列，分别是

流程：

时间点T1: 

插入数据c1-c3 共3列，注意此时 **c2=2**

```shell
ROW                                 COLUMN+CELL
 5914200010001                          column=f:c1, timestamp=1595252551656, value=1
 5914200010001                          column=f:c2, timestamp=1595252551656, value=2
 5914200010001                          column=f:c3, timestamp=1595252551656, value=3
```

时间点T2  插入**c2值为 2-1**:

```shell
 ROW                                 COLUMN+CELL
 5914200010001                          column=f:c2, timestamp=1595252559734, value=2-1
```



按理说，scan 或者 get 出来多应该是

hbase(main):006:0> scan 'test' 或者 hbase(main):006:0> get 'test','591420001'

```shell
ROW                                 COLUMN+CELL
 5914200010001                          column=f:c1, timestamp=1595252551656, value=1
 5914200010001                          column=f:c2, timestamp=1595252559734, value=2-1
 5914200010001                          column=f:c3, timestamp=1595252551656, value=3
```

 但实际情况是, scan 出来的结果是：

```shell
 5914200010001                          column=f:c1, timestamp=1595252551656, value=1
 5914200010001                          column=f:c2, timestamp=1595252559734, value=2
 5914200010001                          column=f:c3, timestamp=1595252551656, value=3
```

`get` 出来的结果是：

 ```shell
 5914200010001                          column=f:c2, timestamp=1595252559734, value=2-1
 ```


**详细了解以及现象：**

刚听到这个描述，刚开始怀疑会不会是使用问题，是不是应用查询的时候，指定了版本，

后来询问了是否设置了多版本之类的情况，答案是没有。


又经过沟通询问，发现有些 `rowkey` 的数据是有问题，有些又是正常的，这是一个非常重要的信息，也就是只会发生在某些行数据中。

由此信息怀疑问题是否和 `rowkey` 分布的 `Region` 有关系，

根据对` HBase` 的了解和直觉，大概猜测出了 `Region` 很可能发生了重叠的情况，

Region 重叠，英文叫做 region overlap，意思是region 范围发生了交叉，

正常`region` 
~10
10~20
20~30
30~40
40~

重叠`region`
~10
10~20
15~25
20~30
30~40
40~

如上 10~20,15~25,20~30 就发生了重叠

 `region` 还有一个常见的问题，叫做 `region` 空洞 `hole`

空洞 `region`
~10
10~20
30~40
40~

如上 20~30 就区间没有了，也就是所谓的 `hole`, `region` 空洞通常是 `region` 没有 `assign` 成功导致


时间点 `T1` 的数据插入的数据从hbase:meta表中找到 `regionA`，

时间点 `T2` 的数据插入的数据从hbase:meta表中找到 `regionB`，

然后 `5914200010001` 这个 `rowkey` 同时属于 regionA 和 RegionB （正常情况 region 是不会重叠的）

于是检查集群，果然验证了自己的猜测

![](/images/posts/hbase/region-overlap/region-overlap1.png "region-overlap")

根据上图，可以看到使用红线框起来的这个 region 是有问题的，


刚开始的时候，时间点T1 插入数据到了正常的 `region` 中，

时间点 `T2`，插入数据，正好到`5192-5294` 这个 `region` 中去了。

所以导致 `scan` 和 `get` 结果不一致。 

另外如果你仔细观察的话，会发现这个有问题的 `region` 的 `startkey/endkey` 和其它的都不一样，

这个表的正常的 `region` 的 `startkey/endkey` 是 `7 `位数，而异常的只有 `4` 位数，看了一下正常的 `startkey/endkey` 应该是预先分区指定的，而不像是 `split` 出来的，

，出问题 `region` 的 `startkey` 和 `endkey`  只有4位，看起来既不是 `split` 出来的 `key` 也不像是 `split` 出来的 `key`，非常诡异，那么有人可能会想会不会可能是 `region split`出现异常导致的，分析这个异常的 `region`，基本上是排除这种情况，为什么？首先这个表的 `rowkey` 都是`13`位长度，`region` 如果是 `split` 出来的话，则会取`Region` 下面列族下面的最大 `HFile` 的 `midkey`（某个`rowkey`), 同时这个 `region` 的 `startkey/endkey` 要不就是`HFile`的 `midkey`，要不就是预先分区的 `7` 位数的 `key`，
不可能是 `4` 位数的 `key`。当时有个大胆的推测，会不会是这个 `region` 是谁一顿操作猛如虎拷贝了一个其它表或者之前的表的 `region` 目录，放在表目录下，然后一顿操作猛如虎，把这个给上线了。。。后来 `check `了 `NameNode` 的审计日志，果然发现是被人拷贝过来的。。。通过观察这个 `region` 的 `.regioninfo` 信息，发现这个region 是数个月之前的，后来被认为拷贝过来的， 具体为啥拷贝就不细说了。。。


这个 `case` 非常有意思, 会涉及到 `HBase` 的 `hbck`工具，`hfile`工具，如何查看 `master` 页面，`hbase:meta` 元数据信息，`hbase` 表的目录结构等等信息


明白了问题的现象，和原因以后，我们如何处理这个问题呢？


**处理思路：**

恢复业务为先！


下线错误 `region` -> 修复 `hbase:meta` -> `move` 走有问题的 `region` 目录 -> `check` 有问题的 `region` 目录数据是否需要恢复 ->将 出问题的 `reigon` 需要恢复的 `HFile` 导入进来

这个问题非常考验对 `HBase` 的理解以及工具的使用。

1、`unassign region` ：下线` region`

2、`move region` 目录，将出问题的 `region` 拷贝走（这个目录中的数据后续可能还需要导入）

3、`scan 'hbase:meta'` 找到出问题的 `region` 信息，从 `hbase:meta` 中删除 

4、导入数据 使用 `dobulkload` 将出问题的 `region hfile` 重新导入进去

这一步其实有一个前提，因为错误的region 是被拷贝过来的，那么我们就需要研究一下

这个错误的 `region` 当时拷贝过来的时候，是否含有 `hfile`，也就是旧的数据；一般来说旧数据按理说我们是不需要，我们需要的是拷贝过来的错误的 `region` 上线后面又写入的这部分数据，

这部分数据虽然写到了错误的 `region`，但确实是需要的数据。

这块的处理逻辑是需要推断，稍微判断失误，就可能会丢数据，或者导入不该导入的数据进来，

首先使用` hbase hfile`  工具，来检查一下这个错误的 `region` 下面的 `hfile` 的信息，

可能会使用到如下命令：

```shell

查看某个hfile 基本信息，比如startkey/endkey/midkey，又多少key，最大，最小，平均长度，时间戳等等

$ hbase hfile -f hfile_path -s
 
 打印kv
$ hbase hfile -f hfile_path -p
打印key
$ hbase hfile -f hfile_path -e

```

本案例中从这些 `hfile` 中打印出来的信息，可以发现 `hfile` 中的数据都是后写入的，根据 `rowkey` 信息（内含时间戳）以及 `KV` 的 `timestamp` 字段来判断。


到此 `HBase` 其实已经可以正常读写了。

不过 此时 `hbase` 的 `hmaster` 中还有脏数据，比如页面中还会显示这个错误的 `region`

5、根据需要决定是否重启 `HMaster`，清理 `HMaster` 内存中的脏数据



如上是大概的推测：那么是否可以解决问题了，线上环境还是需要非常谨慎的。



**制造 Region overlap/ 复现问题**

首先我们来"制造"一个类似的问题，也就是生成一个错误的`region`，制造`region overlap`（当时环境使用的是2.x 的某个早期版本，`hbck2` 还不完善），复现问题：


1) 首先创建一个表

```
create 'test','f', SPLITS => ['05', '15', '25']
```


2) 然后将这个表目录拷贝出来

假设拷贝到 `/tmp/xxx/test`

3)随后删除表

```disbale 'test'```

```drop 'test'```

 4)重新创建表（不同splitkeys)

```create 'test', 'f', SPLITS => ['10', '20', '30']
```

 5)然后选取上一次建表的region目录拷贝到新表目录中

比如：

``` hdfs dfs -cp /tmp/xxx/test/4f3cab0063decfac00755c88337da380 /apps/hbase/data/data/default/test
```

 6)上线有问题的 `region`

 执行命令

``` hbase hbck -j $hbase_home/hbase-operator-tools/hbase-hbck***.jar addFsRegionsMissingInMeta default:test
``

如上命令的意思是根据 `hdfs` 中的 `region` 目录等信息加载到 `hbase:meta` 表中


7)重启 `hmaster`

 

8)上线这个有问题的 reigon

``` hbase hbck -j  $hbase_home/hbase-operator-tools//hbase-hbck***.jar assigns 4f3cab0063decfac00755c88337da380
```



查看 `hmaster` 界面，就可以成功看到 ` region overlap` 重叠的情况了

然后 `scan hbase:meta` 就可以成功看到 这个错误的 `region` 信息也存在 `hbase:meta` 中了，此时就成功复现了 `region overlap`




 **解决流程 **



1. 下线错误`region`:进入 `hbase shell ` 对出问题的 `region`执行 `unassign 'regionanme'`

2.移动错误 `region` 目录，

例如移动到 hdfs://ns1/tmp/下新建一个目录放进去

HBase 目录结构如下

![](/images/posts/hbase/region-overlap/table-path1.png "table-path1")

/apps/hbase/data/data/default/test/regionname/f/hfile 

data 表目录

default：命名空间

test:表名

regionname： region目录

 region 目录下面有.regioninfo

f：列族目录

hfile: 为 hfile 文件

3. `scan 'hbase:meta',{STARTROW => 'tablename,591420001000',LIMIT => 100} ,这里row填有问题的前面的row，`



可能提示遮挡问题有问题，可以追加到文件里，从文件里复制

命令：echo "scan 'hbase:meta',{STARTROW => 'tablename,591420001000',LIMIT => 100}" | hbase shell > hbase.txt

 

4.`deleteall 'hbase:meta','tablename,rowkey.`有问题的 `region`.'

示例命令：`deleteall 'hbase:meta','test,5192,1578035374274. *****6bdd9b41aefefd0f89c.'`

`hbase:meta` 表中脏数据清理以后客户端读写就获取不到错误 `region` 了

5.数据导入

`hbase org.apache.hadoop.hbase.mapreduce.LoadIncrementalHFiles "/tmp/ hbase-loaddata /******89c/ " "t"`

示例命令： `hbase org.apache.hadoop.hbase.mapreduce.LoadIncrementalHFiles " /tmp/hbase-loaddata/*****6bdd9b41aefefd0f89c " "test" `

6、重启 `hmaster


最后问题得以解决。

这个问题，需要对 `unassign`、`hbck`、`region` 如何上下线，`hbase` 表目录结构,`hfile` 工具,`dobulkload` 工具，`.regioninfo`、`hbase:meta` 等工具链

HBase 元数据原理和上下线、读写流程等都需要有一定的了解。



