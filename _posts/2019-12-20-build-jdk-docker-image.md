---
layout: post
title: 制作 JDK docker 镜像
description:  制作 JDK docker 镜像
categories: Docker,K8S
keywords: Docker,CentOS,K8S
excerpt:  Docker,CentOS,K8S
---

# 制作 JDK docker 镜像

## 1、下载 JDK 包

将下载的 jdk-8u231-linux-x64.tar.gz 放在与Dockerfile 一个路径

## 2、编写 Dockerfile

```shell
vim Dockerfile 

FROM centos:7.6.1810
MAINTAINER utf7

RUN yum install -y vim
RUN yum install -y net-tools

RUN mkdir -p /jdk64
ADD jdk-8u231-linux-x64.tar.gz /jdk64/

ENV JAVA_HOME /jdk64/jdk1.8.0_231
ENV PATH $PATH:$JAVA_HOME/bin

WORKDIR /root/
```

这里安装了比较常用的 vim 和net-tools

## 3、拉取 centos image

```shell
docker pull centos:7.6.1810
```
## 4、构建image

```shell
docker build -t utf7/jdk8 .
```

## 5、查看 docker images

```shell
# docker images
REPOSITORY                                               TAG                 IMAGE ID            CREATED             SIZE
utf7/jdk8                                                 latest              204a86499ba4        6 minutes ago       860MB
```

## 6、docker image 打 tag 

```shell
docker tag 204a86499ba4 utf7/jdk8:8u231
```

## 7、运行容器

```shell
docker run -it --name utf7-jdk8 -d utf7/jdk8:8u231
```

## 8、查看容器

```shell
# docker ps -a
CONTAINER ID        IMAGE                                      COMMAND                  CREATED              STATUS                      PORTS               NAMES
3c6ed3a48c6a        utf7/jdk8:jdk8u231                          "/bin/bash"              About a minute ago   Up About a minute                               utf7-jdk8
```

##  9、进入docker 容器

```shell

#进入容器
docker exec -it utf7-jdk8 /bin/bash

#验证Java
java -version
echo $PATH
[root@3c6ed3a48c6a ~]# java -version
java version "1.8.0_231"
Java(TM) SE Runtime Environment (build 1.8.0_231-b11)
Java HotSpot(TM) 64-Bit Server VM (build 25.231-b11, mixed mode)
[root@3c6ed3a48c6a ~]# echo $PATH
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/jdk64/jdk1.8.0_231/bin
```

## 10、退出容器

```shell
exit
```

## 11、停止容器

```shell
docker stop 3c6ed3a48c6a
```
## 12、删除容器

```shell
docker rm 3c6ed3a48c6a
```
## 13、删除 image

```shell
docker rmi 204a86499ba4
```
## 14、删除 exited 状态的容器

```shell
docker rm $(docker ps -qf status=exited)
```
