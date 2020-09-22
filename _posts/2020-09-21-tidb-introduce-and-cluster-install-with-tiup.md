---
layout: post
title: TiDB 介绍以及使用 TiUP 离线部署 TiDB 集群
description: TiDB 介绍以及使用 TiUP 离线部署 TiDB 集群
categories: [TiDB]
keywords: TiDB
excerpt: TiDB 介绍以及使用 TiUP 离线部署 TiDB 集群
---



## 1. TiDB 介绍与架构

以下内容来自官网：



TiDB（读作 `钛` DB) 是由 PingCAP 公司研发并开源的分布式关系型数据库，是一款同时支持在线事务处理与在线分析处理 (Hybrid Transactional and Analytical Processing, HTAP）的融合型分布式数据库产品，具备水平扩容或者缩容、金融级高可用、实时 HTAP、云原生的分布式数据库、兼容 MySQL 5.7 协议和 MySQL 生态等重要特性。目标是为用户提供一站式 OLTP (Online Transactional Processing)、OLAP (Online Analytical Processing)、HTAP 解决方案。TiDB 适合高可用、强一致要求较高、数据规模较大等各种应用场景。

TiDB 整体架构拆分成了多个模块，各模块之间互相通信，组成完整的 TiDB 系统。对应的架构图如下：



![tidb-architecture](/images/posts/tidb/install/tidb-architecture.png)



- TiDB Server：SQL 层，对外暴露 MySQL 协议的连接 endpoint，负责接受客户端的连接，执行 SQL 解析和优化，最终生成分布式执行计划。TiDB 层本身是无状态的，实践中可以启动多个 TiDB 实例，通过负载均衡组件（如 LVS、HAProxy 或 F5）对外提供统一的接入地址，客户端的连接可以均匀地分摊在多个 TiDB 实例上以达到负载均衡的效果。TiDB Server 本身并不存储数据，只是解析 SQL，将实际的数据读取请求转发给底层的存储节点 TiKV（或 TiFlash）。

- PD Server：整个 TiDB 集群的元信息管理模块，负责存储每个 TiKV 节点实时的数据分布情况和集群的整体拓扑结构，提供 TiDB Dashboard 管控界面，并为分布式事务分配事务 ID。PD 不仅存储元信息，同时还会根据 TiKV 节点实时上报的数据分布状态，下发数据调度命令给具体的 TiKV 节点，可以说是整个集群的“大脑”。此外，PD 本身也是由至少 3 个节点构成，拥有高可用的能力。建议部署奇数个 PD 节点。

- 存储节点

  - TiKV Server：负责存储数据，从外部看 TiKV 是一个分布式的提供事务的 Key-Value 存储引擎。存储数据的基本单位是 Region，每个 Region 负责存储一个 Key Range（从 StartKey 到 EndKey 的左闭右开区间）的数据，每个 TiKV 节点会负责多个 Region。TiKV 的 API 在 KV 键值对层面提供对分布式事务的原生支持，默认提供了 SI (Snapshot Isolation) 的隔离级别，这也是 TiDB 在 SQL 层面支持分布式事务的核心。TiDB 的 SQL 层做完 SQL 解析后，会将 SQL 的执行计划转换为对 TiKV API 的实际调用。所以，数据都存储在 TiKV 中。另外，TiKV 中的数据都会自动维护多副本（默认为三副本），天然支持高可用和自动故障转移。
  - TiFlash：TiFlash 是一类特殊的存储节点。和普通 TiKV 节点不一样的是，在 TiFlash 内部，数据是以列式的形式进行存储，主要的功能是为分析型的场景加速。

  TiKV Server 是使用 RocksDB 作为本地的 LSM 存储引擎，利用 Raft 协议来做数据复制，避免单机失效。数据写入走Raft 接口写入，而不是直接写入 RocksDB,通过将表数据按照 Key 拆分成很多 Region ，每个Region 的数据之宝保存在一个节点中。使用 PD 来将 

  Region 尽可能均匀的散布在集群的所有节点中，从而实现水平扩展以及负载均衡。TiKV 以 Region 为单位做数据的复制，也就是一个 Region 的数据会保存多个副本，TiKV 将每一个副本叫做一个 Replica。Replica 之间是通过 Raft 来保持数据的一致，一个 Region 的多个 Replica 会保存在不同的节点上，构成一个 Raft Group。其中一个 Replica 会作为这个 Group 的 Leader，其他的 Replica 作为 Follower。默认情况下，所有的读和写都是通过 Leader 进行，读操作在 Leader 上即可完成，而写操作再由 Leader 复制给 Follower。 大家理解了 Region 之后，应该可以理解下面这张图：

  ![tidb-storage-3.png](/images/posts/tidb/install/tidb-storage-3.png)

  

## 2.安装拓扑



|                      | 105  | 106  | 107  | 108  | 109  | 110  | 111  |
| :------------------- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 中控机               | ✅    |      |      |      |      |      |      |
| pd_servers           |      | ✅    | ✅    | ✅    |      |      |      |
| tidb_servers         |      |      |      |      | ✅    | ✅    | ✅    |
| tikv_servers         |      |      |      |      | ✅    | ✅    | ✅    |
| tiflash_servers      |      |      |      |      | ✅    | ✅    | ✅    |
| monitoring_servers   |      |      |      | ✅    |      |      |      |
| grafana_servers      |      |      |      | ✅    | ✅    | ✅    | ✅    |
| alertmanager_servers |      |      |      | ✅    | ✅    | ✅    | ✅    |



## 3. 下载安装包

官网选择对应的版本：https://pingcap.com/download-cn/community/

wget https://download.pingcap.org/tidb-community-server-v4.0.6-linux-amd64.tar.gz

下面是工具，本次不使用：

(wget https://download.pingcap.org/tidb-community-toolkit-v4.0.6-linux-amd64.tar.gz )

## 4. sudo 免密



#### 添加用户

在每个节点执行

```shell
groupadd tidb;
useradd tidb -g tidb;
passwd tidb
输入密码
```

#### sudo 免密

在每个节点执行如下命令来配置 sudo 免密

```shell
visudo
```

最后一行输入：

```reStructuredText
tidb ALL=(ALL) NOPASSWD: ALL

```

⚠️ 注意最后需要空一行

#### 验证sudo 免密码

登陆中控机，切换到 tidb 用户

ssh 到其他目标节点

以192.168.100.106节点为例，其他节点也需要验证：

```shell
ssh 192.168.100.106
输入密码，
sudo -su root 
不需要密码切换到 `root` 用户，表示 `sudo` 免密成功
```

## 5. 安装



```shell
groupadd tidb;
useradd tidb -g tidb;
su - tidb;
tar xzvf tidb-community-server-${version}-linux-amd64.tar.gz
sh tidb-community-server-${version}-linux-amd64/local_install.sh
source /home/tidb/.bash_profile
```

## 

## 6. 配置初始化参数文件 `topology.yaml`

如下部署在中控机执行

vim  `topology.yaml` 输入如下内容

```yaml
# # the deployments if a specific deployment value is missing.
global:
  user: "tidb"
  ssh_port: 22
  deploy_dir: "/tidb-deploy"
  data_dir: "/tidb-data"

server_configs:
  pd:
    replication.enable-placement-rules: true

pd_servers:
  - host: 192.168.100.106
  - host: 192.168.100.107
  - host: 192.168.100.108
tidb_servers:
  - host: 192.168.100.109
  - host: 192.168.100.110
  - host: 192.168.100.111
tikv_servers:
  - host: 192.168.100.109
  - host: 192.168.100.110
  - host: 192.168.100.111
tiflash_servers:
  - host: 192.168.100.109
    data_dir: /data1/tiflash/data
  - host: 192.168.100.110
    data_dir: /data1/tiflash/data
  - host: 192.168.100.111
    data_dir: /data1/tiflash/data
monitoring_servers:
  - host: 192.168.100.108
grafana_servers:
  - host: 192.168.100.108
alertmanager_servers:
  - host: 192.168.100.108
```

⚠️ 上面只是最小配置，用于测试

## 7. 安装部署、启动



```shell
#部署
tiup cluster deploy tidb-test1 v4.0.6 topology.yaml --user tidb -p
输入 y 然后 `tidb` 用户密码密码
#启动
tiup cluster start tidb-test1
#

```

部署输出：

```shell
$ tiup cluster deploy tidb-test1 v4.0.6 topology.yaml --user tidb -p
Starting component `cluster`: /home/tidb/.tiup/components/cluster/v1.1.2/tiup-cluster deploy tidb-test1 v4.0.6 topology.yaml --user tidb -p
Please confirm your topology:
tidb Cluster: tidb-test1
tidb Version: v4.0.6
Type          Host           Ports                            OS/Arch       Directories
----          ----           -----                            -------       -----------
pd            192.168.100.106  2379/2380                        linux/x86_64  /tidb-deploy/pd-2379,/tidb-data/pd-2379
pd            192.168.100.107  2379/2380                        linux/x86_64  /tidb-deploy/pd-2379,/tidb-data/pd-2379
pd            192.168.100.108  2379/2380                        linux/x86_64  /tidb-deploy/pd-2379,/tidb-data/pd-2379
tikv          192.168.100.109  20160/20180                      linux/x86_64  /tidb-deploy/tikv-20160,/tidb-data/tikv-20160
tikv          192.168.100.110  20160/20180                      linux/x86_64  /tidb-deploy/tikv-20160,/tidb-data/tikv-20160
tikv          192.168.100.111  20160/20180                      linux/x86_64  /tidb-deploy/tikv-20160,/tidb-data/tikv-20160
tidb          192.168.100.109  4000/10080                       linux/x86_64  /tidb-deploy/tidb-4000
tidb          192.168.100.110  4000/10080                       linux/x86_64  /tidb-deploy/tidb-4000
tidb          192.168.100.111  4000/10080                       linux/x86_64  /tidb-deploy/tidb-4000
tiflash       192.168.100.109  9000/8123/3930/20170/20292/8234  linux/x86_64  /tidb-deploy/tiflash-9000,/data1/tiflash/data
tiflash       192.168.100.110  9000/8123/3930/20170/20292/8234  linux/x86_64  /tidb-deploy/tiflash-9000,/data1/tiflash/data
tiflash       192.168.100.111  9000/8123/3930/20170/20292/8234  linux/x86_64  /tidb-deploy/tiflash-9000,/data1/tiflash/data
prometheus    192.168.100.108  9090                             linux/x86_64  /tidb-deploy/prometheus-9090,/tidb-data/prometheus-9090
grafana       192.168.100.108  3000                             linux/x86_64  /tidb-deploy/grafana-3000
alertmanager  192.168.100.108  9093/9094                        linux/x86_64  /tidb-deploy/alertmanager-9093,/tidb-data/alertmanager-9093
Attention:
    1. If the topology is not what you expected, check your yaml file.
    2. Please confirm there is no port/directory conflicts in same host.
Do you want to continue? [y/N]:  y
Input SSH password:
+ Generate SSH keys ... Done
+ Download TiDB components
  - Download pd:v4.0.6 (linux/amd64) ... Done
  - Download tikv:v4.0.6 (linux/amd64) ... Done
  - Download tidb:v4.0.6 (linux/amd64) ... Done
  - Download tiflash:v4.0.6 (linux/amd64) ... Done
  - Download prometheus:v4.0.6 (linux/amd64) ... Done
  - Download grafana:v4.0.6 (linux/amd64) ... Done
  - Download alertmanager:v0.17.0 (linux/amd64) ... Done
  - Download node_exporter:v0.17.0 (linux/amd64) ... Done
  - Download blackbox_exporter:v0.12.0 (linux/amd64) ... Done
+ Initialize target host environments
  - Prepare 192.168.100.106:22 ... Done
  - Prepare 192.168.100.107:22 ... Done
  - Prepare 192.168.100.108:22 ... Done
  - Prepare 192.168.100.109:22 ... Done
  - Prepare 192.168.100.110:22 ... Done
  - Prepare 192.168.100.111:22 ... Done
+ Copy files
  - Copy pd -> 192.168.100.106 ... Done
  - Copy pd -> 192.168.100.107 ... Done
  - Copy pd -> 192.168.100.108 ... Done
  - Copy tikv -> 192.168.100.109 ... Done
  - Copy tikv -> 192.168.100.110 ... Done
  - Copy tikv -> 192.168.100.111 ... Done
  - Copy tidb -> 192.168.100.109 ... Done
  - Copy tidb -> 192.168.100.110 ... Done
  - Copy tidb -> 192.168.100.111 ... Done
  - Copy tiflash -> 192.168.100.109 ... Done
  - Copy tiflash -> 192.168.100.110 ... Done
  - Copy tiflash -> 192.168.100.111 ... Done
  - Copy prometheus -> 192.168.100.108 ... Done
  - Copy grafana -> 192.168.100.108 ... Done
  - Copy alertmanager -> 192.168.100.108 ... Done
  - Copy node_exporter -> 192.168.100.108 ... Done
  - Copy node_exporter -> 192.168.100.109 ... Done
  - Copy node_exporter -> 192.168.100.110 ... Done
  - Copy node_exporter -> 192.168.100.111 ... Done
  - Copy node_exporter -> 192.168.100.106 ... Done
  - Copy node_exporter -> 192.168.100.107 ... Done
  - Copy blackbox_exporter -> 192.168.100.109 ... Done
  - Copy blackbox_exporter -> 192.168.100.110 ... Done
  - Copy blackbox_exporter -> 192.168.100.111 ... Done
  - Copy blackbox_exporter -> 192.168.100.106 ... Done
  - Copy blackbox_exporter -> 192.168.100.107 ... Done
  - Copy blackbox_exporter -> 192.168.100.108 ... Done
+ Check status
Deployed cluster `tidb-test1` successfully, you can start the cluster via `tiup cluster start tidb-test1`
```

启动输出：

```verilog
$ tiup cluster start tidb-test1
Starting component `cluster`: /home/tidb/.tiup/components/cluster/v1.1.2/tiup-cluster start tidb-test1
Starting cluster tidb-test1...
+ [ Serial ] - SSHKeySet: privateKey=/home/tidb/.tiup/storage/cluster/clusters/tidb-test1/ssh/id_rsa, publicKey=/home/tidb/.tiup/storage/cluster/clusters/tidb-test1/ssh/id_rsa.pub
+ [Parallel] - UserSSH: user=tidb, host=192.168.100.108
+ [Parallel] - UserSSH: user=tidb, host=192.168.100.110
+ [Parallel] - UserSSH: user=tidb, host=192.168.100.106
+ [Parallel] - UserSSH: user=tidb, host=192.168.100.107
+ [Parallel] - UserSSH: user=tidb, host=192.168.100.110
+ [Parallel] - UserSSH: user=tidb, host=192.168.100.109
+ [Parallel] - UserSSH: user=tidb, host=192.168.100.108
+ [Parallel] - UserSSH: user=tidb, host=192.168.100.111
+ [Parallel] - UserSSH: user=tidb, host=192.168.100.108
+ [Parallel] - UserSSH: user=tidb, host=192.168.100.108
+ [Parallel] - UserSSH: user=tidb, host=192.168.100.111
+ [Parallel] - UserSSH: user=tidb, host=192.168.100.110
+ [Parallel] - UserSSH: user=tidb, host=192.168.100.109
+ [Parallel] - UserSSH: user=tidb, host=192.168.100.109
+ [Parallel] - UserSSH: user=tidb, host=192.168.100.111
+ [ Serial ] - StartCluster
Starting component pd
	Starting instance pd 192.168.100.106:2379
	Starting instance pd 192.168.100.107:2379
	Starting instance pd 192.168.100.108:2379
	Start pd 192.168.100.106:2379 success
	Start pd 192.168.100.108:2379 success
	Start pd 192.168.100.107:2379 success
Starting component node_exporter
	Starting instance 192.168.100.106
	Start 192.168.100.106 success
Starting component blackbox_exporter
	Starting instance 192.168.100.106
	Start 192.168.100.106 success
Starting component node_exporter
	Starting instance 192.168.100.107
	Start 192.168.100.107 success
Starting component blackbox_exporter
	Starting instance 192.168.100.107
	Start 192.168.100.107 success
Starting component node_exporter
	Starting instance 192.168.100.108
	Start 192.168.100.108 success
Starting component blackbox_exporter
	Starting instance 192.168.100.108
	Start 192.168.100.108 success
Starting component tikv
	Starting instance tikv 192.168.100.111:20160
	Starting instance tikv 192.168.100.109:20160
	Starting instance tikv 192.168.100.110:20160
	Start tikv 192.168.100.109:20160 success
	Start tikv 192.168.100.111:20160 success
	Start tikv 192.168.100.110:20160 success
Starting component node_exporter
	Starting instance 192.168.100.109
	Start 192.168.100.109 success
Starting component blackbox_exporter
	Starting instance 192.168.100.109
	Start 192.168.100.109 success
Starting component node_exporter
	Starting instance 192.168.100.110
	Start 192.168.100.110 success
Starting component blackbox_exporter
	Starting instance 192.168.100.110
	Start 192.168.100.110 success
Starting component node_exporter
	Starting instance 192.168.100.111
	Start 192.168.100.111 success
Starting component blackbox_exporter
	Starting instance 192.168.100.111
	Start 192.168.100.111 success
Starting component tidb
	Starting instance tidb 192.168.100.111:4000
	Starting instance tidb 192.168.100.109:4000
	Starting instance tidb 192.168.100.110:4000
	Start tidb 192.168.100.109:4000 success
	Start tidb 192.168.100.111:4000 success
	Start tidb 192.168.100.110:4000 success
Starting component tiflash
	Starting instance tiflash 192.168.100.111:9000
	Starting instance tiflash 192.168.100.110:9000
	Starting instance tiflash 192.168.100.109:9000
	Start tiflash 192.168.100.110:9000 success
	Start tiflash 192.168.100.109:9000 success
	Start tiflash 192.168.100.111:9000 success
Starting component prometheus
	Starting instance prometheus 192.168.100.108:9090
	Start prometheus 192.168.100.108:9090 success
Starting component grafana
	Starting instance grafana 192.168.100.108:3000
	Start grafana 192.168.100.108:3000 success
Starting component alertmanager
	Starting instance alertmanager 192.168.100.108:9093
	Start alertmanager 192.168.100.108:9093 success
+ [ Serial ] - UpdateTopology: cluster=tidb-test1
Started cluster `tidb-test1` successfully
```



查看集群状态输出

```shell
$ tiup cluster display tidb-test1
Starting component `cluster`: /home/tidb/.tiup/components/cluster/v1.1.2/tiup-cluster display tidb-test1
tidb Cluster: tidb-test1
tidb Version: v4.0.6
ID                   Role          Host           Ports                            OS/Arch       Status  Data Dir                      Deploy Dir
--                   ----          ----           -----                            -------       ------  --------                      ----------
192.168.108:9093   alertmanager  192.168.108  9093/9094                        linux/x86_64  Up      /tidb-data/alertmanager-9093  /tidb-deploy/alertmanager-9093
192.168.108:3000   grafana       192.168.108  3000                             linux/x86_64  Up      -                             /tidb-deploy/grafana-3000
192.168.106:2379   pd            192.168.106  2379/2380                        linux/x86_64  Up|L    /tidb-data/pd-2379            /tidb-deploy/pd-2379
192.168.107:2379   pd            192.168.107  2379/2380                        linux/x86_64  Up|UI   /tidb-data/pd-2379            /tidb-deploy/pd-2379
192.168.108:2379   pd            192.168.108  2379/2380                        linux/x86_64  Up      /tidb-data/pd-2379            /tidb-deploy/pd-2379
192.168.108:9090   prometheus    192.168.108  9090                             linux/x86_64  Up      /tidb-data/prometheus-9090    /tidb-deploy/prometheus-9090
192.168.109:4000   tidb          192.168.109  4000/10080                       linux/x86_64  Up      -                             /tidb-deploy/tidb-4000
192.168.110:4000   tidb          192.168.110  4000/10080                       linux/x86_64  Up      -                             /tidb-deploy/tidb-4000
192.168.111:4000   tidb          192.168.111  4000/10080                       linux/x86_64  Up      -                             /tidb-deploy/tidb-4000
192.168.109:9000   tiflash       192.168.109  9000/8123/3930/20170/20292/8234  linux/x86_64  Up      /data1/tiflash/data           /tidb-deploy/tiflash-9000
192.168.110:9000   tiflash       192.168.110  9000/8123/3930/20170/20292/8234  linux/x86_64  Up      /data1/tiflash/data           /tidb-deploy/tiflash-9000
192.168.111:9000   tiflash       192.168.111  9000/8123/3930/20170/20292/8234  linux/x86_64  Up      /data1/tiflash/data           /tidb-deploy/tiflash-9000
192.168.109:20160  tikv          192.168.109  20160/20180                      linux/x86_64  Up      /tidb-data/tikv-20160         /tidb-deploy/tikv-20160
192.168.110:20160  tikv          192.168.110  20160/20180                      linux/x86_64  Up      /tidb-data/tikv-20160         /tidb-deploy/tikv-20160
192.168.111:20160  tikv          192.168.111  20160/20180                      linux/x86_64  Up      /tidb-data/tikv-20160         /tidb-deploy/tikv-20160
```

## 8. 查看 TIDB dashboard/监控等

http://192.168.100.107:2379/dashboard/#/overview

![tidb-dashboard](/images/posts/tidb/install/tidb-dashboard.png)

如下链接可以查看 `Grafana`

http://192.168.100.108:3000/?orgId=1



## 9.  TiDB 使用

`TIDB` 兼容 `MySQL` 协议，可以安装`MySQL 5.7` 来连接 `TIDB`

连接`mysql -u root -h 192.168.100.109 -P 4000`

```shell
#mysql -u root -h 192.168.100.109 -P 4000

Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 2
Server version: 5.7.25-TiDB-v4.0.6 TiDB Server (Apache License 2.0) Community Edition, MySQL 5.7 compatible

Copyright (c) 2000, 2019, Oracle and/or its affiliates. All rights reserved.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| INFORMATION_SCHEMA |
| METRICS_SCHEMA     |
| PERFORMANCE_SCHEMA |
| mysql              |
| test               |
+--------------------+
5 rows in set (0.00 sec)
```

查看版本

select tidb_version()\G

```shell
mysql> select tidb_version()\G
*************************** 1. row ***************************
tidb_version(): Release Version: v4.0.6
Edition: Community
Git Commit Hash: 51d365fc45fdfc039eb204a96268c5bd1c55075f
Git Branch: heads/refs/tags/v4.0.6
UTC Build Time: 2020-09-15 09:50:30
GoVersion: go1.13
Race Enabled: false
TiKV Min Version: v3.0.0-60965b006877ca7234adaced7890d7b029ed1306
Check Table Before Drop: false
1 row in set (0.00 sec)
```



简单测试：

```shell
mysql> create database testdb;
Query OK, 0 rows affected (0.09 sec)

mysql> use testdb;
Database changed
mysql> CREATE TABLE `tab_tidb` (
    -> `id` int(11) NOT NULL AUTO_INCREMENT,
    -> `name` varchar(20) NOT NULL DEFAULT '',
    -> `age` int(11) NOT NULL DEFAULT 0,
    -> `version` varchar(20) NOT NULL DEFAULT '',
    -> PRIMARY KEY (`id`),
    -> KEY `idx_age` (`age`));
Query OK, 0 rows affected (0.10 sec)

mysql> insert into `tab_tidb` values (1,'TiDB',5,'TiDB-v4.0.6');
Query OK, 1 row affected (0.02 sec)

mysql> select * from tab_tidb;
+----+------+-----+-------------+
| id | name | age | version     |
+----+------+-----+-------------+
|  1 | TiDB |   5 | TiDB-v4.0.6 |
+----+------+-----+-------------+
1 row in set (0.00 sec)
```





## 10. 错误处理



```verilog
Starting component pd
	Starting instance pd test1:2379
	Starting instance pd test2:2379
	Starting instance pd test3:2379

retry error: operation timed out after 2m0s
	pd test2:2379 failed to start: timed out waiting for port 2379 to be started after 2m0s, please check the log of the instance
retry error: operation timed out after 2m0s
	pd test1:2379 failed to start: timed out waiting for port 2379 to be started after 2m0s, please check the log of the instance
retry error: operation timed out after 2m0s
	pd test3:2379 failed to start: timed out waiting for port 2379 to be started after 2m0s, please check the log of the instance

Error: failed to start pd: 	pd di-test-app-03.h.ab1.qttsite.net:2379 failed to start: timed out waiting for port 2379 to be started after 2m0s, please check the log of the instance: timed out waiting for port 2379 to be started after 2m0s

Verbose debug logs has been written to /home/tidb/tidb-community-server-v4.0.6-linux-amd64/logs/tiup-cluster-debug-2020-09-22-21-43-46.log.
Error: run `/home/tidb/.tiup/components/cluster/v1.1.2/tiup-cluster` (wd:/home/tidb/.tiup/data/SBIwzQg) failed: exit status 1
```



pd 启动失败，登陆pd 的节点

日志在 `/tidb-deploy` 目录下（`topology.yaml` 中的  `deploy_dir` 属性决定）

```shell
vim /tidb-deploy/pd-2379/log/pd.log
```

日志：

```verilog
[2020/09/22 21:40:03.194 +08:00] [FATAL] [main.go:120] ["run server failed"] [error="[PD:etcd:ErrStartEtcd]expected IP in URL for binding (http://test1:2380)"] [stack="github.com/pingcap/log.Fatal\n\t/home/jenkins/agent/workspace/build_pd_multi_branch_v4.0.6/go/pkg/mod/github.com/pingcap/log@v0.0.0-20200511115504-543df19646ad/global.go:59\nmain.main\n\t/home/jenkins/agent/workspace/build_pd_multi_branch_v4.0.6/go/src/github.com/pingcap/pd/cmd/pd-server/main.go:120\nruntime.main\n\t/usr/local/go/src/runtime/proc.go:203"]
```

`topology.yaml` 中PD 配置的是  `hostname` ，需要修改为 `IP`.



## 参考文档

1. https://docs.pingcap.com/zh/tidb/stable/overview
2. https://docs.pingcap.com/zh/tidb/stable/tidb-architecture

2. https://docs.pingcap.com/zh/tidb/stable/production-offline-deployment-using-tiup

3. https://docs.pingcap.com/zh/tidb/stable/dashboard-access