---
layout: post
title: CentOS 安装 Docker
description:  CentOS 安装 Docker
categories: Docker
keywords: Docker,CentOS
excerpt:  Docker,CentOS
---

# 安装 Docker


## 1、卸载旧版本

```bash
sudo yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-selinux \
                  docker-engine-selinux \
                  docker-engine
```
                  
## 2、配置yum 仓库

```bash
$ sudo yum install -y yum-utils

$ sudo yum-config-manager \
    --add-repo \
    https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

$ sudo sed -i 's/download.docker.com/mirrors.aliyun.com\/docker-ce/g' /etc/yum.repos.d/docker-ce.repo
```

## 3、安装docker

```bash
sudo yum install -y docker-ce docker-ce-cli containerd.io
```


## 4、启动docker

```
sudo systemctl enable docker

sudo systemctl start docker

systemctl status docker 
```

## 5、验证docker 

```bash
docker run --rm hello-world
```


## 6、修改docker 镜像地址


默认 docker image 镜像网络访问不了（或者慢），这里配置阿里云的镜像地址

```bash

vim /etc/docker/daemon.json
```


```json
{

     "registry-mirrors":  ["https://aekshq8n.mirror.aliyuncs.com"]

}
```




##  7、卸载docker:

```bash
sudo yum remove docker-ce

sudo rm -rf /var/lib/docker

```
