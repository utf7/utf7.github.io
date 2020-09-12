---
layout: post
title: 自动化运维工具 salt 安装使用
description: 自动化运维工具 salt 安装使用
categories: [linux,salt]
keywords: linux,salt
excerpt: 本文介绍自动化运维工具 salt 安装以及使用
---



## 介绍

salt 与 ansible 一样，是常用的 linux 自动化运维工具，本文将介绍如何安装以及使用 salt。



### 节点规划

| 主机名 | 角色          |
| ------ | ------------- |
| test1  | master/minion |
| test2  | minion        |
| Test3  | minion        |



### 安装

下载安装包，本地安装包放在/utf7/salt_pkgs/ 目录

```shell
test1 节点执行

yum install -y /utf7/salt_pkgs/salt-master-2019.2.0-2.el7.noarch.rpm

yum install -y /utf7/salt_pkgs/python36-zmq-15.3.0-6.el7.x86_64.rpm
yum install -y /utf7/salt_pkgs/salt-2019.2.0-2.el7.noarch.rpm
yum install -y /utf7/salt_pkgs/salt-minion-2019.2.0-2.el7.noarch.rpm
```

其他节点执行

```shell
yum install -y /utf7/salt_pkgs/python36-zmq-15.3.0-6.el7.x86_64.rpm
yum install -y /utf7/salt_pkgs/salt-2019.2.0-2.el7.noarch.rpm
yum install -y /utf7/salt_pkgs/salt-minion-2019.2.0-2.el7.noarch.rpm
```



### 配置

`salt` 节点角色分为 `master` 和 `minion`

`master` 配置文件为 `/etc/salt/master`

`minion` 配置文件为 `/etc/salt/minion`

#### test1 master 节点

vim /etc/salt/master

```yaml
file_roots:
  base:

    - /srv/salt/base
  dev:
    - /srv/salt/dev

pillar_roots:
  base:
    - /srv/pillar/base
  prod:
    - /srv/pillar/prod

auto_accept: True
```

然后创建上面配置对应的目录

```shell
mkdir -p /srv/salt/base
mkdir -p /srv/salt/dev
mkdir -p /srv/pillar/base
mkdir -p /srv/pillar/prod
```



由于我的  `master` 节点同时也是 `minion` 功能，所以这里也需要配置 `minion`

vim /etc/salt/minion

```yaml
master:
  - test1
id: test1
master_port: 4506
```



其他minion 配置，除了id，其他都一样

#### test2 节点

vim /etc/salt/minion

```yaml
master:
  - test1
id: test2
master_port: 4506
```

#### test3 节点

vim /etc/salt/minion

```yaml
master:
  - test1
id: test3
master_port: 4506
```





### 启动命令

启动 `master`  （在test1上执行）

```shell
/bin/systemctl enable salt-master;
/bin/systemctl restart salt-master  > /dev/null 2>&1
```

启动 `minion` （test1/test2/test3都需要启动）

```shell
/bin/systemctl enable salt-minion;/bin/systemctl restart salt-minion > /dev/null 2>&1
```



### 测试是否可用

在 test1 上面执行

```shell
//所有节点执行命令
salt "*" cmd.run "hostname"
//以某个用户执行
salt "*" cmd.run runas="hadoop" "hostname;id"
//指定节点执行
salt "test" cmd.run runas="hadoop" "hostname;id"
//正则匹配
salt -E "test" cmd.run runas="hadoop" "hostname;id"
//指定多个节点执行
salt -E "test2|test3" cmd.run runas="hadoop" "hostname;id"
//debug 模式
salt -l debug "*" cmd.run "hostname"

```

`salt-cp` 用于拷贝从 `master` 上面拷贝文件到 `minion`



```shell

//拷贝文件
echo "salt-cp getfile test" > getfile.txt;
salt-cp -C -E "test" getfile.txt /tmp/
salt "test" cmd.run "cat /tmp/getfile.txt"

-C 可以支持拷贝大文件，具体参考 salt-cp -h
 -C, --chunked       Use chunked files transfer. Supports big files,
                        recursive lookup and directories creation.
```



###  问题处理

安装好以后，发现在` salt master `上面执行命令没有返回，表现如下

>salt "*" cmd.run "hostname"
>
>test1:
>    Minion did not return. [No response]
>Test2:
>    Minion did not return. [No response]
>Test3:
>    Minion did not return. [No response]
>ERROR: Minions returned with non-zero exit code



到 `minoin `节点查看日志

vim  /var/log/salt/minion

```log
2020-09-12 14:48:18,182 [salt.crypt       :1081][ERROR ][19925] The master key has changed, the salt master could have been subverted, verify salt master's public key
2020-09-12 14:48:18,182 [salt.crypt       :764 ][CRITICAL][19925] The Salt Master server's public key did not authenticate!
The master may need to be updated if it is a version of Salt lower than 2019.2.0, or
If you are confident that you are connecting to a valid Salt Master, then remove the master public key and restart the Salt Minion.
The master public key can be found at:
/etc/salt/pki/minion/minion_master.pub
2020-09-12 14:48:18,183 [salt.minion      :1026][ERROR ][19925] Error while bringing up minion for multi-master. Is master at test1 responding?
```


我这里的原因是，之前 `minion` 配置了其他节点的 `master` ，需要删除之前的 `master `公钥，重启 `minion` 即可

```
 rm -rf  /etc/salt/pki/minion/minion_master.pub;
 /bin/systemctl enable salt-minion;/bin/systemctl restart salt-minion > /dev/null 2>&1
```



更多关于 `salt` 使用请参考官网 https://docs.saltstack.com/en/latest/





### 参考

1. https://docs.saltstack.com/en/latest/
2. https://docs.saltstack.com/en/latest/topics/installation/rhel.html
3. https://blog.csdn.net/quanliyadan/article/details/50496427