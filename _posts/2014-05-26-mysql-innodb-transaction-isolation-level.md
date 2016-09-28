---
layout: post
title: MySQL InnoDB事务隔离级别脏读、可重复读、幻读
description: MySQL InnoDB事务隔离级别脏读、可重复读、幻读
category: MySQL
keywords: mysql，innodb,transaction
---

希望通过本文，可以加深读者对ySQL InnoDB的四个事务隔离级别，以及脏读、不重复读、幻读的理解。

## MySQL InnoDB事务隔离级别脏读、可重复读、幻读

#### **InnoDB 事务隔离级别**
	
MySQL InnoDB事务的隔离级别有四级，默认是“可重复读”（REPEATABLE READ）。

- 未提交读（READUNCOMMITTED）：
	另一个事务修改了数据，但尚未提交，而本事务中的SELECT会读到这些未被提交的数据（脏读）。
 
- 提交读（READCOMMITTED）：
	本事务读取到的是最新的数据（其他事务提交后的）。问题是，在同一个事务里，前后两次相同的SELECT会读到不同的结果（不重复读）。
 
- 可重复读（REPEATABLEREAD）：
 	在同一个事务里，SELECT的结果是事务开始时时间点的状态，因此，同样的SELECT操作读到的结果会是一致的。但是，会有幻读现象（稍后解释）。
 
- 串行化（SERIALIZABLE）：
	读操作会隐式获取共享锁，可以保证不同事务间的互斥。

四个级别逐渐增强，每个级别解决一个问题。

- 脏读：
	最容易理解。另一个事务修改了数据，但尚未提交，而本事务中的SELECT会读到这些未被提交的数据。

- 不重复读：
	解决了脏读后，会遇到，同一个事务执行过程中，另外一个事务提交了新数据，因此本事务先后两次读到的数据结果会不一致。

- 幻读：
	解决了不重复读，保证了同一个事务里，查询的结果都是事务开始时的状态（一致性）。但是，如果另一个事务同时提交了新数据，本事务再更新时，就会“惊奇的”发现了这些新数据，貌似之前读到的数据是“鬼影”一样的幻觉。
	
MySQL InnoDB事务隔离级别可设置为global和session级别。

- 事务隔离级别查看

查看当前session的事务隔离级别：

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
设置global事务隔离级别：
 set global isolation level read committed;  
注意一点的设置global并不会对当前session生效。
  
比如设置session事务隔离级别命令如下：

```sql
set session transaction isolation level read uncommitted;      
set session transaction isolation level read committed;      
set session transaction isolation level REPEATABLE READ;   
set session transaction isolation level SERIALIZABL;
```

上面的文字，读起来并不是那么容易让人理解，以下用几个实验对InnoDB的四个事务隔离级别做详细的解释，希望通过实验来加深大家对InnoDB的事务隔离级别理解。

首先，我们来创建一张innodb表，插入几条数据

```sql
CREATE TABLE `t` (  
    `a` INT (11) NOT NULL PRIMARY KEY  
) ENGINE = INNODB DEFAULT CHARSET = UTF8;  
  
INSERT INTO t (a) VALUES (1),(2),(3);  
```

- 实验一：解释脏读、可重复读问题

![解释脏读、可重复读问题](/images/posts/mysql/transaction/exp1.jpg)

- 实验二：测试READ-COMMITTED与REPEATABLE-READ

![测试READ-COMMITTED与REPEATABLE-READ](/images/posts/mysql/transaction/exp2.jpg)

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

- 实验三：测试SERIALIZABLE事务对其他的影响

![测试SERIALIZABLE事务对其他的影响](/images/posts/mysql/transaction/exp3.jpg)