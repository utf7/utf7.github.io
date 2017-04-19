---
layout: post
title: HBase操作手册
description: HBase 操作手册
categories: [HBase]
keywords: HBase
excerpt: HBase 操作手册
---

## 快速上手


####1. 进入HBase Shell
进入到HBase 目录下面,执行如下命令，进入HBase Shell
`./bin/hbase shell`

####2. 查看HBase Shell 帮助信息

在HBase Shell 中输入`help`然后回车查看帮助
`hbase>help`

####3. 建表
`hbase>create 't','f'`
建一张表名为't',列族为'f'的表

####4. 插入数据
```
hbase>put 't','r1','f:c1','value1'
hbase>put 't','r2','f:c1','value2'
```
####5. 查询数据

扫描全部表数据
`hbase>scan 't'`
 
>ROW      COLUMN+CELL
 r1      column=f1:c1, timestamp=1492564813004, value=value1
 r2      column=f1:c1, timestamp=1492564821627, value=value2

获取单行数据
`hbase>get 't','r1'`
 
>ROW      COLUMN+CELL
 r1      column=f1:c1, timestamp=1492564813004, value=value1

####6. 更新数据
HBase 更新和插入操作都通过put命令执行
如下命令更新表t,rowkey为r1,列族为f,列名为c1的值。
`hbase>put 't','r1', 'f:c1', 'new_value1'`
执行如下命令，可以看到value 时间戳和value已经被更新
`hbase>get 't','r1',{COLUMN => 'f:c1'}`
>COLUMN     CELL           
>f:c1      timestamp=1492565330738, value=new_value1
 
####7. 删除数据

删除一行数据

`hbase>deleteall 't','r1'`
 
删除一列数据
`delete 't','r2','f:c2'`

####8. 列出表

列出所有表

`hbase>list`

>TABLE
t                                                                      
1 row(s) in 0.0180 seconds

 

####9. 查看表描述

`hbase>describe 't'`

>Table t is ENABLED              
t                                 t
COLUMN FAMILIES DESCRIPTION      
{NAME => 'f', DATA_BLOCK_ENCODING => 'NONE', BLOOMFILTER => 'ROW', REPLICATION_SCOPE => '0', VERSIONS => '1', COMPRESSION => 'NONE', 
MIN_VERSIONS => '0', TTL => 'FOREVER', KEEP_DELETED_CELLS => 'FALSE', BLOCKSIZE => '65536', IN_MEMORY => 'false', BLOCKCACHE => 'true
'}                                                          
1 row(s) in 0.0200 seconds


####10. 启用、禁用表

禁用表
`hbase>disable 't'`

启用表
`hbase>enable 't'`

>TABLE
t                                                                      
1 row(s) in 0.0180 seconds


####11. 清空表

`hbase>truncate 't'`

>Truncating 't' table (it may take a while):
 \- Disabling table...
 \- Truncating table...
0 row(s) in 13.8790 seconds


####12. 删除表

删除表之前需要禁用表
`disable 't'`
执行删除表操作
`hbase>drop 't'`

####13. 退出HBase Shell

在HBase Shell 中执行 `quit` 退出shell

`hbase>quit`


## 表管理命令

您可以在HBase Shell 中执行 help 'ddl' 来查看帮助
可以使用help 'command' 查看具体某个命令的帮助。
比如:`hbase>help 'alter'`

DDL主要包含如下命令
 `alter, alter_async, alter_status, create, describe, disable, disable_all, drop, drop_all, enable, enable_all, exists, get_table, is_disabled, is_enabled, list, show_filters`

####1. alter

语法：
`alter '<table>',{<property1> => <value1>,<property2> => <value2>,...},{...},...`

alter 命令用于修改表定义

表增加或者修改列族：

比如为表t增加或者修改列族f，最大版本数为5

`hbase>alter 't',NAME => 'f',VERSION =>5`

对多个列族进行操作：

`hbase>alter 't', 'f2', {NAME => 'f2', VERSIONS => 5}, {NAME => 'f3', VERSIONS => 5}`

删除表中列族：
将表ns1:t1中的列族f1删除

`hbase>alter 'ns1:t1', NAME => 'f1', METHOD => 'delete'`
或者
`hbase>alter 'ns1:t1', 'delete' => 'f1'`

修改表的属性，MAX_FILESIZE,READONLY,MEMSTORE_FLUSHSIZE,DURABILITY等，
表t1修改最大的region size 为10G

`hbase>alter 't1', MAX_FILESIZE => '10737418240'`


为表增加协处理器

格式如下：
[coprocessor jar file location] | class name | [priority] | [arguments]

`hbase> alter 't1',
    'coprocessor'=>'hdfs:///foo.jar|com.foo.FooRegionObserver|1001|arg1=1,arg2=2'`

因为可以为表配置多个协处理器，所以执行增加协处理器命令时，会自动产生一个自动唯一的序列号
为表、列族设置属性

`hbase> alter 't1', CONFIGURATION => {'hbase.hregion.scan.loadColumnFamiliesOnDemand' => 'true'}`
`hbase> alter 't1', {NAME => 'f2', CONFIGURATION => {'hbase.hstore.blockingStoreFiles' => '10'}}`

删除表级别属性

`hbase> alter 't1', METHOD => 'table_att_unset', NAME => 'MAX_FILESIZE'`

`hbase> alter 't1', METHOD => 'table_att_unset', NAME => 'coprocessor$1'`

设置REGION_REPLICATION属性

  hbase> alter 't1', {REGION_REPLICATION => 2}

一次设置多个属性

  hbase> alter 't1', { NAME => 'f1', VERSIONS => 3 }, 
   { MAX_FILESIZE => '134217728' }, { METHOD => 'delete', NAME => 'f2' },
   OWNER => 'johndoe', METADATA => { 'mykey' => 'myvalue' }


####2. alter_async

语法：
  语法与 alter 相同

alter_async语法与alter相同，alter_async指定可以立即返回，而alter需要等到所有region更新完毕返回。
更新期间可以使用alter_status查看更新进度。


####3. alter_status
语法
`alter_status '<tablename>'`
查看region 更新进度
`hbase> alter_status 't1'`
`hbase> alter_status 'ns1:t1'`

####4. create

语法：
`create '<table>', {NAME => '<column_family>' [, ...]} [, {...}, ...]`
说明：

  建表可以指定一组列族、属性（可选）、表配置(可选)、列族配置信息(可选)，
  至少需要指定一个列族，列族名通过NAME => '<column_family>' 指定，
  可设置列族其它元数据，不同列族信息用{}隔开。

在命名空间ns1建表t1列族f1

`hbase> create 'ns1:t1', {NAME => 'f1', VERSIONS => 5}`



在默认的命名空间default建表t1,三个列族f1、f2、f3

`hbase> create 't1', {NAME => 'f1'}, {NAME => 'f2'}, {NAME => 'f3'}`
等同于以下缩写
`hbase> create 't1', 'f1', 'f2', 'f3'`

hbase> create 't1', {NAME => 'f1', VERSIONS => 1, TTL => 2592000, BLOCKCACHE => true}
hbase> create 't1', {NAME => 'f1', CONFIGURATION => {'hbase.hstore.blockingStoreFiles' => '10'}}
  
建表时预分区

```  
hbase> create 'ns1:t1', 'f1', SPLITS => ['10', '20', '30', '40']  
hbase> create 't1', 'f1', SPLITS => ['10', '20', '30', '40']  
从文件中设置分区
hbase> create 't1', 'f1', SPLITS_FILE => 'splits.txt', OWNER => 'johndoe'  
建表指定 metadata 信息
hbase> create 't1', {NAME => 'f1', VERSIONS => 5}, METADATA => { 'mykey' => 'myvalue' }  
```
创建指定分区(region)个数的表
```
hbase> create 't1', 'f1', {NUMREGIONS => 15, SPLITALGO => 'HexStringSplit'}
hbase> create 't1', 'f1', {NUMREGIONS => 15, SPLITALGO => 'HexStringSplit', REGION_REPLICATION => 2, CONFIGURATION => {'hbase.hregion.scan.loadColumnFamiliesOnDemand' => 'true'}}
```
####5. describe 

语法:
`desc '<tablename>'`

查看表描述
`hbase>describe 't'`

>Table t is ENABLED              
t                                 
COLUMN FAMILIES DESCRIPTION      
{NAME => 'f', DATA_BLOCK_ENCODING => 'NONE', BLOOMFILTER => 'ROW', REPLICATION_SCOPE => '0', VERSIONS => '1', COMPRESSION => 'NONE', 
MIN_VERSIONS => '0', TTL => 'FOREVER', KEEP_DELETED_CELLS => 'FALSE', BLOCKSIZE => '65536', IN_MEMORY => 'false', BLOCKCACHE => 'true
'}                                                          
1 row(s) in 0.0200 seconds


####6. disable

语法:
`disable '<tablename>'`

禁用单个表

`hbase>disable 't'`

####7. disable_all

语法:
`disable_all`

禁用匹配给定表达式的表

```
禁用所有表
hbase>disable_all '.*'
禁用表名以t开头的表
hbase> disable_all 't.*'
禁用命名空间为ns，表名以t开头的表
hbase> disable_all 'ns:t.*'
禁用命名空间ns下面的所有表
hbase> disable_all 'ns:.*'
```

禁用多个表
`hbase(main):038:0> disable_all '.*'`
>a                         
t                             
t1                            
t2                            
testLoad                      
testLoad1                     
testLoad2                     
testLoad3                     
testLoad4                     
>
>Disable the above 9 tables (y/n)?

输入y，执行禁用所选表


####8. drop

语法:
`drop '<tablename>'`
作用：
删除某个表


*HBase 删除表之前，需要先禁用表*

```
hbase>disable 't'
hbase>drop 't'
hbase>disable 'ns:t'
hbase>drop 'ns:t'
```


