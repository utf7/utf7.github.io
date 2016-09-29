---
layout: post
title: MySQL InnoDB 事务隔离级别脏读、可重复读、幻读
description: MySQL InnoDB 事务隔离级别脏读、可重复读、幻读
categories: MySQL
keywords: mysql，innodb,transaction
excerpt: MySQL InnoDB 事务隔离级别脏读、可重复读、幻读
---
## MySQL InnoDB 事务隔离级别脏读、可重复读、幻读

希望通过本文，可以加深读者对 MySQL InnoDB 的四个事务隔离级别，以及脏读、不重复读、幻读的理解。

### ** InnoDB 事务隔离级别**
	
MySQL InnoDB事务的隔离级别有四级，默认是“可重复读”（REPEATABLE READ）。

- 未提交读（READUNCOMMITTED）：
	另一个事务修改了数据，但尚未提交，而本事务中的SELECT会读到这些未被提交的数据（脏读）。
 
- 提交读（READCOMMITTED）：
	本事务读取到的是最新的数据（其他事务提交后的）。问题是，在同一个事务里，前后两次相同的 SELECT 会读到不同的结果（不重复读）。
 
- 可重复读（REPEATABLEREAD）：
 	在同一个事务里，SELECT的结果是事务开始时时间点的状态，因此，同样的 SELECT 操作读到的结果会是一致的。但是，会有幻读现象（稍后解释）。
 
- 串行化（SERIALIZABLE）：
	读操作会隐式获取共享锁，可以保证不同事务间的互斥。

四个级别逐渐增强，每个级别解决一个问题。

- 脏读：
	最容易理解。另一个事务修改了数据，但尚未提交，而本事务中的 SELECT 会读到这些未被提交的数据。

- 不重复读：
	解决了脏读后，会遇到，同一个事务执行过程中，另外一个事务提交了新数据，因此本事务先后两次读到的数据结果会不一致。

- 幻读：
	解决了不重复读，保证了同一个事务里，查询的结果都是事务开始时的状态（一致性）。但是，如果另一个事务同时提交了新数据，本事务再更新时，就会“惊奇的”发现了这些新数据，貌似之前读到的数据是“鬼影”一样的幻觉。
	
MySQL InnoDB事务隔离级别可设置为 global 和 session 级别。

- 事务隔离级别查看

查看当前 session 的事务隔离级别：

```sql
mysql> show variables like '%tx_isolation%';  
+---------------+--------------+  
| Variable_name | Value        |  
+---------------+--------------+  
| tx_isolation  | SERIALIZABLE |  
+---------------+--------------+ 
```

- 查看全局的事务隔离级别

```sql
mysql> show global variables like '%tx_isolation%';
+---------------+-----------------+
| Variable_name | Value           |
+---------------+-----------------+
| tx_isolation  | REPEATABLE-READ |
+---------------+-----------------+
1 row in set (0.00 sec)
```

- 设置事务隔离级别：  
设置 global 事务隔离级别：
 set global isolation level read committed;  
注意一点的设置 global 并不会对当前 session 生效。
  
比如设置 session 事务隔离级别命令如下：

```sql
set session transaction isolation level read uncommitted;      
set session transaction isolation level read committed;      
set session transaction isolation level REPEATABLE READ;   
set session transaction isolation level SERIALIZABL;
```
### 实验理解 InnoDB 事物隔离级别

上面的文字，读起来并不是那么容易让人理解，以下用几个实验对InnoDB的四个事务隔离级别做详细的解释，希望通过实验来加深大家对InnoDB的事务隔离级别理解。

首先，我们来创建一张 innodb 表，插入几条数据

```sql
CREATE TABLE `t` (  
    `a` INT (11) NOT NULL PRIMARY KEY  
) ENGINE = INNODB DEFAULT CHARSET = UTF8;  
  
INSERT INTO t (a) VALUES (1),(2),(3);  
```

- 实验一：解释脏读、可重复读问题

![解释脏读、可重复读问题](/images/posts/mysql/transaction/exp1.jpg)

- 实验二：测试 READ-COMMITTED 与 REPEATABLE-READ 

![测试 READ-COMMITTED与REPEATABLE-READ ](/images/posts/mysql/transaction/exp2.jpg)

当然数据的可见性都是对不同事务来说的，同一个事务，都是可以读到此事务中最新数据的。

```sql
mysql>start transaction;  
mysql>insert into t(a) values (4);    
mysql>select * from t;  
1,2,3,4;    
mysql>insert into t(a) values (5);	  
mysql>select  * from t;  	
1,2,3,4,5; 	
```

- 实验三：测试 SERIALIZABLE 事务对其他的影响

![测试 SERIALIZABLE 事务对其他的影响](/images/posts/mysql/transaction/exp3.jpg)

- 实验四：幻读

一些文章写到 InnoDB 的可重复读避免了“幻读”（phantom read），这个说法并不准确。
做个试验：(以下所有试验要注意存储引擎和隔离级别)

```sql
mysql>show create table t_bitfly\G;  
CREATE TABLE `t_bitfly` (  
`id` bigint(20) NOT NULL default '0',  
`value` varchar(32) default NULL,  
PRIMARY KEY (`id`)  
) ENGINE=InnoDB DEFAULT CHARSET=gbk  
mysql>select @@global.tx_isolation, @@tx_isolation;  
+-----------------------+-----------------+  
| @@global.tx_isolation | @@tx_isolation  |  
+-----------------------+-----------------+  
| REPEATABLE-READ       | REPEATABLE-READ |  
+-----------------------+-----------------+  
```

试验4-1：

![试验4-1](/images/posts/mysql/transaction/exp4-1.png)

(shit, 刚刚明明告诉我没有这条记录的)
如此就出现了幻读，以为表里没有数据，其实数据已经存在了，傻乎乎的提交后，才发现数据冲突了。


试验4-2：

```sql
SessionA                                                                         Session B  
  
START TRANSACTION;                                                               START TRANSACTION;  
  
SELECT * FROM t_bitfly;  
+------+-------+  
| id   | value |  
+------+-------+  
|    1 |a     |  
+------+-------+  
                                                                                  INSERT INTO t_bitfly VALUES (2, 'b');  
                             
  
SELECT * FROM t_bitfly;  
+------+-------+  
| id   | value |  
+------+-------+  
|    1 |a     |  
+------+-------+  
                                                                                   COMMIT;  
  
SELECT * FROM t_bitfly;  
+------+-------+  
| id   | value |  
+------+-------+  
|    1 |a     |  
+------+-------+  
  
UPDATE t_bitfly SET value='z';  
Rows matched: 2  Changed:2  Warnings: 0  
(怎么多出来一行)  
  
SELECT * FROM t_bitfly;  
+------+-------+  
| id   | value |  
+------+-------+  
|    1 |z     |  
|    2 |z     |  
+------+-------+  
```

本事务中第一次读取出一行，做了一次更新后，另一个事务里提交的数据就出现了。也可以看做是一种幻读。

那么，InnoDB 指出的可以避免幻读是怎么回事呢？

http://dev.mysql.com/doc/refman/5.0/en/innodb-record-level-locks.html

By default, InnoDB operatesin REPEATABLE READ transaction isolation level and with the innodb_locks_unsafe_for_binlogsystem variable disabled. In this case, InnoDB uses next-key locks for searchesand index scans, which prevents phantom rows (see Section 13.6.8.5, “Avoidingthe Phantom Problem Using Next-Key Locking”).

准备的理解是，当隔离级别是可重复读，且禁用 innodb_locks_unsafe_for_binlog 的情况下，在搜索和扫描 index 的时候使用的 next-keylocks 可以避免幻读。
关键点在于，是 InnoDB 默认对一个普通的查询也会加next-key locks，还是说需要应用自己来加锁呢？如果单看这一句，可能会以为 InnoDB 对普通的查询也加了锁，如果是，那和序列化（SERIALIZABLE）的区别又在哪里呢？

MySQL manual里还有一段：

Avoiding the PhantomProblem Using Next-Key Locking (http://dev.mysql.com/doc/refman/5.0/en/innodb-next-key-locking.html)
Toprevent phantoms, InnoDB usesan algorithm called next-key locking that combinesindex-row locking with gap locking.
Youcan use next-key locking to implement a uniqueness check in your application:If you read your data in share mode and do not see a duplicate for a row youare going to insert, then you can safely insert your row and know that thenext-key lock set on the successor of your row during the read prevents anyonemeanwhile inserting a duplicate for your row. Thus, the next-key lockingenables you to “lock” the nonexistence of something in your table.

我的理解是说，InnoDB提供了next-key locks，但需要应用程序自己去加锁。manual里提供一个例子：

`SELECT * FROM child WHERE id> 100 FOR UPDATE;`

这样，InnoDB 会给 id 大于 100 的行（假如 child 表里有一行 id 为 102），以及 100-102，102+ 的 gap 都加上锁。
可以使用 show innodb status 来查看是否给表加上了锁。

再看一个实验，要注意，表 t_bitfly 里的 id 为主键字段。

实验4-3：

```sql
Session A                               Session B  
  
START TRANSACTION;                      START TRANSACTION;  
  
SELECT * FROM t_bitfly  
WHERE id<=1  
FOR UPDATE;  
+------+-------+  
| id   | value |  
+------+-------+  
|    1 | a     |  
+------+-------+  
                                        INSERT INTO t_bitfly  
                                        VALUES (2, 'b');  
                                        Query OK, 1 row affected  
  
SELECT * FROM t_bitfly;  
+------+-------+  
| id   | value |  
+------+-------+  
|    1 | a     |  
+------+-------+  
                                        INSERT INTO t_bitfly  
                                        VALUES (0, '0');  
                                        (waiting for lock ...  
                                        then timeout)  
                                        ERROR 1205 (HY000):  
                                        Lock wait timeout exceeded;  
                                        try restarting transaction  
  
SELECT * FROM t_bitfly;  
+------+-------+  
| id   | value |  
+------+-------+  
|    1 | a     |  
+------+-------+  
                                        COMMIT;  
  
SELECT * FROM t_bitfly;  
+------+-------+  
| id   | value |  
+------+-------+  
|    1 | a     |  
+------+-------+  
```

可以看到，用 id<=1 加的锁，只锁住了 id<=1 的范围，可以成功添加 id 为 2 的记录，添加 id 为 0 的记录时就会等待锁的释放。

MySQL manual 里对可重复读里的锁的详细解释：

http://dev.mysql.com/doc/refman/5.0/en/set-transaction.html#isolevel_repeatable-read

For locking reads (SELECT with FORUPDATE or LOCK IN SHARE MODE),UPDATE, and DELETE statements, lockingdepends on whether the statement uses a unique index with a unique searchcondition, or a range-type search condition. For a unique index with a uniquesearch condition, InnoDB locksonly the index record found, not the gap before it. For other searchconditions, InnoDB locksthe index range scanned, using gap locks or next-key (gap plus index-record)locks to block insertions by other sessions into the gaps covered by the range.


一致性读和提交读，先看实验:

实验4-4：
```sql
SessionA                                                                  Session B  
  
START TRANSACTION;                                                         START TRANSACTION;  
  
SELECT * FROM t_bitfly;  
+----+-------+  
| id | value |  
+----+-------+  
|  1 |a     |  
+----+-------+  
                                                                           INSERT INTO t_bitfly VALUES (2, 'b');  
                                
                                                                          COMMIT;  
  
SELECT * FROM t_bitfly;  
+----+-------+  
| id | value |  
+----+-------+  
|  1 |a     |  
+----+-------+  
  
SELECT * FROM t_bitfly LOCK IN SHARE MODE;  
+----+-------+  
| id | value |  
+----+-------+  
|  1 |a     |  
|  2 |b     |  
+----+-------+  
  
SELECT * FROM t_bitfly FOR UPDATE;  
+----+-------+  
| id | value |  
+----+-------+  
|  1 |a     |  
|  2 |b     |  
+----+-------+  
  
SELECT * FROM t_bitfly;  
+----+-------+  
| id | value |  
+----+-------+  
|  1 |a     |  
+----+-------+  
```

如果使用普通的读，会得到一致性的结果，如果使用了加锁的读，就会读到“最新的”“提交”读的结果。

本身，可重复读和提交读是矛盾的。在同一个事务里，如果保证了可重复读，就会看不到其他事务的提交，违背了提交读；如果保证了提交读，就会导致前后两次读到的结果不一致，违背了可重复读。

可以这么讲，InnoDB 提供了这样的机制，在默认的可重复读的隔离级别里，可以使用加锁读去查询最新的数据。

http://dev.mysql.com/doc/refman/5.0/en/innodb-consistent-read.html

If you want to see the “freshest” state of the database, you should use either theREAD COMMITTED isolation level or a locking read:
`SELECT * FROM t_bitfly LOCK IN SHARE MODE;`

结论：MySQL InnoDB 的可重复读并不保证避免幻读，需要应用使用加锁读来保证。而这个加锁度使用到的机制就是 next-keylocks 。
 

文章幻读部分直接转载了 bitfly 的文章： http://blog.bitfly.cn/post/mysql-innodb-phantom-read/ 
